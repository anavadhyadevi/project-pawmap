import uuid
from django.conf import settings
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status, permissions
from django.contrib.auth import authenticate
from .models import User
from .serializers import RegisterSerializer, UserProfileSerializer, LoginSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Account created successfully.',
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access':  str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if not user.is_active:
            return Response(
                {'error': 'Account is deactivated. Contact admin.'},
                status=status.HTTP_403_FORBIDDEN
            )
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful.',
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access':  str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LocationPingView(APIView):
    """
    POST /api/users/location/ -- volunteer pings current location.
    Stored in Redis only, expires in 5 min if pings stop.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'Volunteer':
            return Response({'error': 'Only volunteers can ping location.'}, status=status.HTTP_403_FORBIDDEN)

        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        if lat is None or lon is None:
            return Response({'error': 'latitude and longitude are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from pawmap_backend.geo import redis_client
            key = f'volunteer_location:{request.user.pk}'
            redis_client.set(key, f'{lat},{lon}', ex=300)
        except Exception:
            pass  # Redis unavailable -- silently skip location storage
        return Response({'status': 'location updated'}, status=status.HTTP_200_OK)


class VolunteerListView(generics.ListAPIView):
    """
    GET /api/users/volunteers/ -- list all volunteers (NGO Admin only)
    """
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = User.objects.filter(role='Volunteer')
        if self.request.user.role == 'NGO_Admin':
            return qs.filter(ngo=self.request.user)
        if self.request.user.role == 'Platform_Admin':
            return qs
        return qs.none()


class NgoListView(generics.ListAPIView):
    """GET /api/users/ngos/ -- public list used by the volunteer sign-up form."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return User.objects.filter(role='NGO_Admin', is_active=True).order_by('full_name')


class VerifyVolunteerView(APIView):
    """
    PATCH /api/users/{id}/verify/ -- NGO Admin verifies a volunteer
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ['NGO_Admin', 'Platform_Admin']:
            return Response(
                {'error': 'Only NGO Admins can verify volunteers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            volunteer = User.objects.get(pk=pk, role='Volunteer')
        except User.DoesNotExist:
            return Response(
                {'error': 'Volunteer not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        if request.user.role == 'NGO_Admin' and volunteer.ngo_id != request.user.id:
            return Response(
                {'error': 'This volunteer is not affiliated with your NGO.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if request.user.role == 'NGO_Admin' and not request.user.is_verified:
            return Response(
                {'error': 'Your NGO account must be verified before you can approve volunteers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        volunteer.is_verified = True
        volunteer.save()
        return Response(
            UserProfileSerializer(volunteer).data,
            status=status.HTTP_200_OK
        )


class PasswordResetRequestView(APIView):
    """
    POST /api/users/password-reset/request/
    Body: { "email": "user@example.com" }

    Stateless HMAC token (Django default_token_generator) -- no Redis needed.
    Always returns 200 to prevent user enumeration.
    The reset link is emailed; in dev it is printed to the Django console.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response(
                {'error': 'Email address is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        safe = {'message': 'If that email is registered, a reset link has been sent.'}

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(safe, status=status.HTTP_200_OK)

        # Build a stateless token: uidb64 + Django HMAC token (expires per
        # PASSWORD_RESET_TIMEOUT in settings, default 3 days; we surface
        # "15 minutes" in UX via PASSWORD_RESET_TTL but the HMAC token itself
        # is valid for the Django setting).  This requires no Redis.
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        frontend_origin = 'http://localhost:5173'
        reset_url = f'{frontend_origin}/reset-password?uid={uid}&token={token}'

        send_mail(
            subject='Reset your PawMap password',
            message=(
                f'Hi {user.full_name},\n\n'
                f'We received a request to reset your PawMap password.\n'
                f'Click the link below to set a new password:\n\n'
                f'{reset_url}\n\n'
                f'If you did not request this, you can safely ignore this email.\n\n'
                f'-- The PawMap Team'
            ),
            from_email=getattr(settings, 'EMAIL_FROM', 'noreply@pawmap.app'),
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(safe, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    POST /api/users/password-reset/confirm/
    Body: { "uid": "<uidb64>", "token": "<hmac token>", "password": "..." }

    Verifies the HMAC token, sets the new password. Single-use: Django's
    default_token_generator invalidates the token once the password changes.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid      = (request.data.get('uid')      or '').strip()
        token    = (request.data.get('token')    or '').strip()
        password = (request.data.get('password') or '')

        if not uid or not token:
            return Response(
                {'error': 'Invalid reset link. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            pk   = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'This reset link is invalid or has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'This reset link is invalid or has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.save()

        return Response(
            {'message': 'Password updated successfully. You can now log in.'},
            status=status.HTTP_200_OK
        )
