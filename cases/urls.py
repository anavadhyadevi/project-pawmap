from django.urls import path
from .views import (
    CaseListCreateView, CaseDetailView,
    MyCasesView, ClaimCaseView, UpdateCaseStatusView
)

urlpatterns = [
    path('',                        CaseListCreateView.as_view(),  name='case-list-create'),
    path('my/',                     MyCasesView.as_view(),         name='my-cases'),
    path('<str:case_id>/',          CaseDetailView.as_view(),      name='case-detail'),
    path('<str:case_id>/claim/',    ClaimCaseView.as_view(),       name='case-claim'),
    path('<str:case_id>/status/',   UpdateCaseStatusView.as_view(),name='case-status'),
]