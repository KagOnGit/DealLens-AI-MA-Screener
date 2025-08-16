from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.auth import (
    verify_password, 
    get_password_hash, 
    create_user_tokens,
    verify_token,
    generate_user_id
)
from ...core.deps import get_current_user, get_current_active_user
from ...models.user import User
from ...schemas.auth import (
    UserRegister, UserLogin, RefreshTokenRequest, Token, AuthResponse,
    User as UserSchema, MessageResponse, PasswordChange, UserSettings,
    UserProfile
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new user."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | 
        (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_id = generate_user_id()
    
    db_user = User(
        id=user_id,
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        organization=user_data.organization,
        job_title=user_data.job_title,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create tokens
    tokens = create_user_tokens(db_user.id, db_user.email)
    
    return AuthResponse(
        user=UserSchema.model_validate(db_user),
        tokens=Token(**tokens),
        message="User registered successfully"
    )


@router.post("/login", response_model=AuthResponse)
def login_user(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """Authenticate user and return JWT tokens."""
    
    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    tokens = create_user_tokens(user.id, user.email)
    
    return AuthResponse(
        user=UserSchema.model_validate(user),
        tokens=Token(**tokens),
        message="Login successful"
    )


@router.post("/login-form", response_model=AuthResponse)
def login_with_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """Alternative login endpoint compatible with OAuth2 password flow."""
    
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | 
        (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    tokens = create_user_tokens(user.id, user.email)
    
    return AuthResponse(
        user=UserSchema.model_validate(user),
        tokens=Token(**tokens)
    )


@router.post("/refresh", response_model=Token)
def refresh_access_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Refresh access token using refresh token."""
    
    # Verify refresh token
    token_data = verify_token(refresh_data.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = token_data.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    tokens = create_user_tokens(user.id, user.email)
    return Token(**tokens)


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get current user profile."""
    user_profile = UserProfile.model_validate(current_user)
    
    # Filter sensitive API keys (only show if they exist, not the actual values)
    if current_user.api_keys:
        user_profile.api_keys = {
            key: "***" if value else None 
            for key, value in current_user.api_keys.items()
        }
    
    return user_profile


@router.put("/me", response_model=UserSchema)
def update_current_user(
    user_update: UserSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update current user profile and settings."""
    
    # Update user fields
    if user_update.theme is not None:
        current_user.theme = user_update.theme
    if user_update.timezone is not None:
        current_user.timezone = user_update.timezone
    if user_update.currency is not None:
        current_user.currency = user_update.currency
    if user_update.language is not None:
        current_user.language = user_update.language
    
    # Update API keys (in a real app, these should be encrypted)
    if user_update.api_keys is not None:
        if current_user.api_keys is None:
            current_user.api_keys = {}
        current_user.api_keys.update(user_update.api_keys)
    
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return UserSchema.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Change user password."""
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password confirmation
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return MessageResponse(message="Password changed successfully")


@router.post("/logout", response_model=MessageResponse)
def logout_user(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Logout user (client should discard tokens)."""
    # In a production app, you might want to blacklist the token
    # For now, we just return a success message
    return MessageResponse(message="Logout successful")
