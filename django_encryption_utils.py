# Django Backend Encryption Utilities
# Save this as: your_django_project/utils/encryption.py

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64
import json
import os
from django.conf import settings
from django.core.cache import cache

class EncryptionManager:
    def __init__(self):
        self.backend = default_backend()
        self._private_key = None
        self._public_key = None
        self._load_or_generate_keypair()
    
    def _load_or_generate_keypair(self):
        """Load existing keypair or generate new one"""
        try:
            # Try to load from cache first
            private_key_pem = cache.get('rsa_private_key')
            public_key_pem = cache.get('rsa_public_key')
            
            if private_key_pem and public_key_pem:
                self._private_key = serialization.load_pem_private_key(
                    private_key_pem.encode(), 
                    password=None, 
                    backend=self.backend
                )
                self._public_key = self._private_key.public_key()
                return
                
            # Generate new keypair
            self._generate_keypair()
            
        except Exception as e:
            print(f"Error loading keypair: {e}")
            self._generate_keypair()
    
    def _generate_keypair(self):
        """Generate new RSA keypair"""
        self._private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=self.backend
        )
        self._public_key = self._private_key.public_key()
        
        # Cache the keys (expires in 1 hour)
        private_pem = self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode()
        
        public_pem = self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()
        
        cache.set('rsa_private_key', private_pem, 3600)  # 1 hour
        cache.set('rsa_public_key', public_pem, 3600)   # 1 hour
    
    def get_public_key_pem(self):
        """Get public key in PEM format for frontend"""
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()
    
    def decrypt_rsa(self, encrypted_data_b64):
        """Decrypt RSA encrypted data"""
        try:
            encrypted_data = base64.b64decode(encrypted_data_b64)
            decrypted = self._private_key.decrypt(
                encrypted_data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return decrypted.decode('utf-8')
        except Exception as e:
            raise ValueError(f"RSA decryption failed: {e}")
    
    def decrypt_aes(self, encrypted_data, key_hex, iv_hex):
        """Decrypt AES encrypted data"""
        try:
            key = bytes.fromhex(key_hex)
            iv = bytes.fromhex(iv_hex)
            encrypted_bytes = base64.b64decode(encrypted_data)
            
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=self.backend
            )
            decryptor = cipher.decryptor()
            decrypted_padded = decryptor.update(encrypted_bytes) + decryptor.finalize()
            
            # Remove PKCS7 padding
            padding_length = decrypted_padded[-1]
            decrypted = decrypted_padded[:-padding_length]
            
            return decrypted.decode('utf-8')
        except Exception as e:
            raise ValueError(f"AES decryption failed: {e}")
    
    def decrypt_form_data(self, encrypted_payload):
        """Decrypt form data from frontend"""
        try:
            # Extract components
            data = encrypted_payload.get('data', {})
            encrypted_aes_key = encrypted_payload.get('key')
            iv_hex = encrypted_payload.get('iv')
            
            if not all([encrypted_aes_key, iv_hex]):
                raise ValueError("Missing encryption components")
            
            # Decrypt AES key using RSA
            aes_key_hex = self.decrypt_rsa(encrypted_aes_key)
            
            # Decrypt sensitive fields
            decrypted_data = {}
            for field, value in data.items():
                if isinstance(value, dict) and value.get('encrypted'):
                    # Decrypt this field
                    decrypted_data[field] = self.decrypt_aes(
                        value['data'], 
                        aes_key_hex, 
                        iv_hex
                    )
                else:
                    # Field is not encrypted
                    decrypted_data[field] = value
            
            return decrypted_data
            
        except Exception as e:
            raise ValueError(f"Form data decryption failed: {e}")

# Global instance
encryption_manager = EncryptionManager()


# Django Views
# Add these to your Django views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@require_http_methods(["GET"])
def get_public_key(request):
    """Endpoint to provide RSA public key to frontend"""
    try:
        public_key = encryption_manager.get_public_key_pem()
        return JsonResponse({
            'public_key': public_key,
            'status': 'success'
        })
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def secure_login(request):
    """Secure login endpoint that handles encrypted data"""
    try:
        data = json.loads(request.body)
        
        # Check if data is encrypted
        if 'key' in data and 'iv' in data:
            # Decrypt the form data
            decrypted_data = encryption_manager.decrypt_form_data(data)
            email = decrypted_data.get('email')
            password = decrypted_data.get('password')
        else:
            # Fallback to plain data (for development)
            email = data.get('email')
            password = data.get('password')
        
        # Your existing login logic here
        from django.contrib.auth import authenticate
        user = authenticate(request, username=email, password=password)
        
        if user:
            # Generate token (your existing token generation)
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return JsonResponse({
                'token': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'status': 'success'
            })
        else:
            return JsonResponse({
                'error': 'Invalid credentials',
                'status': 'error'
            }, status=401)
            
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def secure_signup(request):
    """Secure signup endpoint that handles encrypted data"""
    try:
        data = json.loads(request.body)
        
        # Check if data is encrypted
        if 'key' in data and 'iv' in data:
            # Decrypt the form data
            decrypted_data = encryption_manager.decrypt_form_data(data)
            username = decrypted_data.get('username')
            email = decrypted_data.get('email')
            password = decrypted_data.get('password')
        else:
            # Fallback to plain data (for development)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
        
        # Your existing signup logic here
        from django.contrib.auth.models import User
        
        # Check if user exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'error': 'User with this email already exists',
                'status': 'error'
            }, status=400)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Generate token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return JsonResponse({
            'token': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'status': 'success'
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=400)


# URLs configuration
# Add these to your Django urls.py

"""
from django.urls import path
from . import views

urlpatterns = [
    path('api/public-key/', views.get_public_key, name='get_public_key'),
    path('api/login/', views.secure_login, name='secure_login'),
    path('api/signup/', views.secure_signup, name='secure_signup'),
    # ... your other URLs
]
"""

# Requirements for Django
"""
Add these to your requirements.txt:

cryptography>=3.4.8
django-cors-headers>=3.8.0
djangorestframework>=3.12.0
djangorestframework-simplejwt>=4.8.0
"""