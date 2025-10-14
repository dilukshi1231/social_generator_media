from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, Token, UserLogin
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


# Helper function to get user by email
async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


# Helper function to get user by username
async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


# Dependency to get current user from token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    # Verify it's an access token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    
    try:
        print("=" * 50)
        print(f"DEBUG: Registration attempt started")
        print(f"DEBUG: Received data: {user_data.model_dump()}")
        
        # Check if email already exists
        print(f"DEBUG: Checking if email exists: {user_data.email}")
        existing_user = await get_user_by_email(db, user_data.email)
        if existing_user:
            print(f"DEBUG: Email already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        print(f"DEBUG: Checking if username exists: {user_data.username}")
        existing_username = await get_user_by_username(db, user_data.username)
        if existing_username:
            print(f"DEBUG: Username already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user
        print(f"DEBUG: Hashing password...")
        hashed_password = get_password_hash(user_data.password)
        print(f"DEBUG: Password hashed successfully")
        
        print(f"DEBUG: Creating User object...")
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            user_type=user_data.user_type,
            business_name=user_data.business_name,
            business_description=user_data.business_description,
            industry=user_data.industry,
            website=user_data.website,
        )
        print(f"DEBUG: User object created successfully")
        
        print(f"DEBUG: Adding user to database session...")
        db.add(new_user)
        print(f"DEBUG: Committing to database...")
        await db.commit()
        print(f"DEBUG: Commit successful, refreshing user...")
        await db.refresh(new_user)
        print(f"DEBUG: User created successfully with ID: {new_user.id}")
        print("=" * 50)
        
        return new_user
        
    except HTTPException as he:
        print(f"DEBUG: HTTPException raised: {he.detail}")
        raise
    except Exception as e:
        print("=" * 50)
        print(f"ERROR: Exception caught in register function")
        print(f"ERROR: Type: {type(e).__name__}")
        print(f"ERROR: Message: {str(e)}")
        print(f"ERROR: Full traceback:")
        import traceback
        traceback.print_exc()
        print("=" * 50)
        
        await db.rollback()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login user and return access token."""
    
    # Get user by email (form_data.username can be email)
    user = await get_user_by_email(db, form_data.username)
    
    # If not found by email, try username
    if not user:
        user = await get_user_by_username(db, form_data.username)
    
    # Verify user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    print(f"DEBUG: Login successful for user {user.id}")
    print(f"DEBUG: Generated access_token: {access_token[:50]}...")
    print(f"DEBUG: Generated refresh_token: {refresh_token[:50]}...")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    
    print("=" * 50)
    print(f"DEBUG: Refresh token request received")
    print(f"DEBUG: Token (first 50 chars): {refresh_token[:50]}...")
    
    payload = decode_token(refresh_token)
    
    if payload is None:
        print(f"ERROR: Token decode returned None")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    print(f"DEBUG: Token decoded. Payload: {payload}")
    
    token_type = payload.get("type")
    print(f"DEBUG: Token type: {token_type}")
    
    if token_type != "refresh":
        print(f"ERROR: Invalid token type. Expected 'refresh', got '{token_type}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type. Expected refresh token, got {token_type}"
        )
    
    user_id: int = payload.get("sub")
    print(f"DEBUG: User ID from token: {user_id}")
    
    if user_id is None:
        print(f"ERROR: No user_id in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        print(f"ERROR: User {user_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        print(f"ERROR: User {user_id} is inactive")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Create new tokens
    new_access_token = create_access_token(data={"sub": user.id, "email": user.email})
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    print(f"DEBUG: New tokens generated successfully")
    print(f"DEBUG: New access_token: {new_access_token[:50]}...")
    print(f"DEBUG: New refresh_token: {new_refresh_token[:50]}...")
    print("=" * 50)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should delete token)."""
    return {"message": "Successfully logged out"}