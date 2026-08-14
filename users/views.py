from rest_framework_simplejwt.tokens import RefreshToken
from pawmap_backend.geo import redis_client
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
    POST /api/users/location/ — volunteer pings current location.
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

        key = f'volunteer_location:{request.user.pk}'
        redis_client.set(key, f'{lat},{lon}', ex=300)

        return Response({'status': 'location updated'}, status=status.HTTP_200_OK)

class VolunteerListView(generics.ListAPIView):
    """
    GET /api/users/volunteers/ — list all volunteers (NGO Admin only)
    """
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role='Volunteer')

class VerifyVolunteerView(APIView):
    """
    PATCH /api/users/{id}/verify/ — NGO Admin verifies a volunteer
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
        volunteer.is_verified = True
        volunteer.save()
        return Response(
            UserProfileSerializer(volunteer).data,
            status=status.HTTP_200_OK
        )