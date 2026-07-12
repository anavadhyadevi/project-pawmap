from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Platform_Admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ('Reporter', 'Reporter'),
        ('Volunteer', 'Volunteer'),
        ('Vet', 'Vet'),
        ('NGO_Admin', 'NGO Admin'),
        ('Platform_Admin', 'Platform Admin'),
    ]

    user_id    = models.CharField(max_length=20, unique=True, editable=False)
    full_name  = models.CharField(max_length=100)
    email      = models.EmailField(unique=True)
    phone      = models.CharField(max_length=15, unique=True, null=True, blank=True)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Reporter')
    is_verified = models.BooleanField(default=False)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    ngo        = models.ForeignKey(
                    'self', null=True, blank=True,
                    on_delete=models.SET_NULL,
                    related_name='ngo_members'
                 )
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']

    def save(self, *args, **kwargs):
        if not self.user_id:
            last = User.objects.order_by('-created_at').first()
            if last and last.user_id:
                num = int(last.user_id.split('-')[1]) + 1
            else:
                num = 1
            self.user_id = f'USR-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.email} ({self.role})'

    class Meta:
        db_table = 'users'