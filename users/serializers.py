from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    ngo = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='NGO_Admin'), required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone', 'role', 'ngo', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if attrs.get('role') == 'Volunteer' and not attrs.get('ngo'):
            raise serializers.ValidationError({'ngo': 'Choose the NGO you will work with.'})
        if attrs.get('ngo') and attrs.get('role') != 'Volunteer':
            raise serializers.ValidationError({'ngo': 'Only volunteer accounts can be linked to an NGO.'})
        # Vets and NGO_Admins start unverified — manual activation required
        if attrs.get('role') in ['Vet', 'NGO_Admin', 'Platform_Admin']:
            attrs['is_verified'] = False
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    ngo_name = serializers.CharField(source='ngo.full_name', read_only=True)
    class Meta:
        model = User
        fields = [
            'id', 'user_id', 'full_name', 'email', 'phone', 'ngo', 'ngo_name',
            'role', 'is_verified', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'user_id', 'email', 'role', 'is_verified', 'created_at']


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)
