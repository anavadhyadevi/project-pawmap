from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ──────────────────────────────────────────────────────────────
# WARNING: move this to .env before production
SECRET_KEY = 'django-insecure-cl+gt@hc32quy&sa+_w-_i61s21f!2zx#p4g-3srssc0jwn_!^'

DEBUG = True

ALLOWED_HOSTS = ['*']  # restrict this in production

# ── Applications ──────────────────────────────────────────────────────────
INSTALLED_APPS = [
    # Django defaults
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # PawMap apps
    'users',
    'cases',
    'animals',
    'volunteers',
    'medical',
    'adoption',
    'analytics',
    'notifications',
]

# ── Middleware ─────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'pawmap_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'pawmap_backend.wsgi.application'

# ── Database ───────────────────────────────────────────────────────────────
# Using SQLite for development — switch to PostgreSQL + PostGIS for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Production PostgreSQL config (comment out SQLite above and uncomment this):
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.contrib.gis.db.backends.postgis',
#         'NAME': 'pawmap_db',
#         'USER': 'pawmap_user',
#         'PASSWORD': 'your_password',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

# ── Custom User Model ──────────────────────────────────────────────────────
AUTH_USER_MODEL = 'users.User'

# ── Django REST Framework ──────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ── JWT Settings ───────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── CORS ───────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization',
    'content-type', 'dnt', 'origin', 'user-agent',
    'x-csrftoken', 'x-requested-with',
]

# ── Celery ─────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# ── Media files (animal photos etc) ───────────────────────────────────────
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ── Static files ───────────────────────────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ── Password Validation ────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internationalisation ───────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ── Default primary key ────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'