from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from .models import Case, CaseStatusLog
from .serializers import (
    CaseSerializer, CaseCreateSerializer,
    ClaimCaseSerializer, UpdateStatusSerializer
)


class CaseListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/cases/     — list all open cases (public)
    POST /api/cases/     — submit a new case (authenticated)
    """
    queryset = Case.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CaseCreateSerializer
        return CaseSerializer

    def get_queryset(self):
        qs = Case.objects.all()
        # filter by status if provided e.g. ?status=Open
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        # filter by species e.g. ?species=Dog
        species = self.request.query_params.get('species')
        if species:
            qs = qs.filter(species__iexact=species)
        return qs

    def perform_create(self, serializer):
        case = serializer.save(
            reporter=self.request.user if self.request.user.is_authenticated else None,
            status='Open'
        )
        CaseStatusLog.objects.create(
            case=case,
            actor=self.request.user if self.request.user.is_authenticated else None,
            old_status='',
            new_status='Open',
            note='Case created'
        )
        return case

    def create(self, request, *args, **kwargs):
        print("REQUEST DATA:", request.data)  # add this line
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = self.perform_create(serializer)
        return Response(
            CaseSerializer(case).data,
            status=status.HTTP_201_CREATED
        )


class CaseDetailView(generics.RetrieveAPIView):
    """
    GET /api/cases/{case_id}/ — get one case with full status log
    """
    queryset           = Case.objects.all()
    serializer_class   = CaseSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field       = 'case_id'


class MyCasesView(generics.ListAPIView):
    """
    GET /api/cases/my/ — cases reported by the logged in user
    """
    serializer_class   = CaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Case.objects.filter(reporter=self.request.user)


class ClaimCaseView(APIView):
    """
    PATCH /api/cases/{case_id}/claim/ — volunteer atomically claims a case
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, case_id):
        serializer = ClaimCaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # select_for_update locks the row so no two volunteers
            # can claim the same case at the same time
            with transaction.atomic():
                case = Case.objects.select_for_update().get(case_id=case_id)

                if case.status != 'Open':
                    return Response(
                        {'error': f'Case is already {case.status}. Cannot claim.'},
                        status=status.HTTP_409_CONFLICT
                    )

                if case.volunteer is not None:
                    return Response(
                        {'error': 'Case has already been claimed.'},
                        status=status.HTTP_409_CONFLICT
                    )

                old_status = case.status

                # calculate response time in minutes
                now = timezone.now()
                response_time = (now - case.created_at).total_seconds() / 60

                case.volunteer        = request.user
                case.status           = 'In_Progress'
                case.response_time_min = round(response_time, 1)
                case.save()

                CaseStatusLog.objects.create(
                    case=case,
                    actor=request.user,
                    old_status=old_status,
                    new_status='In_Progress',
                    note=serializer.validated_data.get('note', '')
                )

        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            CaseSerializer(case).data,
            status=status.HTTP_200_OK
        )


class UpdateCaseStatusView(APIView):
    """
    PATCH /api/cases/{case_id}/status/ — volunteer updates case status
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, case_id):
        serializer = UpdateStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            case = Case.objects.get(case_id=case_id)
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # only the assigned volunteer or an admin can update status
        if case.volunteer != request.user and request.user.role not in ['NGO_Admin', 'Platform_Admin']:
            return Response(
                {'error': 'You are not assigned to this case.'},
                status=status.HTTP_403_FORBIDDEN
            )

        old_status = case.status
        new_status = serializer.validated_data['status']
        note       = serializer.validated_data.get('note', '')

        case.status = new_status
        case.save()

        CaseStatusLog.objects.create(
            case=case,
            actor=request.user,
            old_status=old_status,
            new_status=new_status,
            note=note
        )

        return Response(
            CaseSerializer(case).data,
            status=status.HTTP_200_OK
        )