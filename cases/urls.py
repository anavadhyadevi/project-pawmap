from django.urls import path
from .views import (
    CaseListCreateView, CaseDetailView,
    MyCasesView, ClaimCaseView, UpdateCaseStatusView,
    LostPetReportListCreateView, FoundPetReportListCreateView,
    MyVolunteerCasesView
)

urlpatterns = [
    path('',                        CaseListCreateView.as_view(),  name='case-list-create'),
    path('my/',                     MyCasesView.as_view(),         name='my-cases'),
    path('my-volunteer-cases/',     MyVolunteerCasesView.as_view(),name='my-volunteer-cases'),
    path('lost/',                   LostPetReportListCreateView.as_view(),  name='lost-reports'),
    path('found/',                  FoundPetReportListCreateView.as_view(), name='found-reports'),
    path('<str:case_id>/',          CaseDetailView.as_view(),      name='case-detail'),
    path('<str:case_id>/claim/',    ClaimCaseView.as_view(),       name='case-claim'),
    path('<str:case_id>/status/',   UpdateCaseStatusView.as_view(),name='case-status'),
]