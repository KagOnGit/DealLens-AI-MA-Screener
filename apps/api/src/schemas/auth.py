from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime


# Authentication request schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    job_title: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Authentication response schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    job_title: Optional[str] = None
    phone_number: Optional[str] = None
    theme: str = "dark"
    timezone: str = "UTC"
    currency: str = "USD"
    language: str = "en"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    organization: Optional[str] = None
    job_title: Optional[str] = None
    phone_number: Optional[str] = None
    theme: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    language: Optional[str] = None


class User(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserProfile(User):
    """Extended user profile with sensitive info for self-view"""
    api_keys: Optional[Dict[str, Any]] = None  # Will be filtered/encrypted


class UserSettings(BaseModel):
    """User settings update schema"""
    theme: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    language: Optional[str] = None
    api_keys: Optional[Dict[str, str]] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class PasswordReset(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


# API Response schemas
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class AuthResponse(BaseModel):
    user: User
    tokens: Token
    message: str = "Authentication successful"
