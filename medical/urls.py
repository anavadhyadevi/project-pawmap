from django.urls import path
from .views import MedicalRecordListCreateView

urlpatterns = [
    path('<str:animal_id>/', MedicalRecordListCreateView.as_view(), name='medical-records'),
    path('records/', MedicalRecordListCreateView.as_view(), name='medical-records'),
]