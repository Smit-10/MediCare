from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from authlib.integrations.starlette_client import OAuth
from app.schemas.auth import UserLogin, UserRegister, Token
from app.services.auth_service import register_user, login_user
from app.services.google_auth_service import get_or_create_google_user
from app.auth.jwt_handler import get_current_user, create_access_token
from app.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, FRONTEND_URL, COOKIE_SAMESITE, COOKIE_SECURE, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Google OAuth Configuration
oauth = OAuth()

oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile"
    }
)

@router.post("/register")
def register(user: UserRegister):
    result = register_user(user.name, user.email, user.password)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return {
        "message": "User registered successfully",
        "user": {
            "user_id": result[0],
            "name": result[1],
            "email": result[2],
            "role": result[3],
            "status": result[4]
        }
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    result = login_user(form_data.username, form_data.password)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password" 
        )
    
    return result

@router.get("/me")
def get_my_account(current_user: dict = Depends(get_current_user)):
    return {
        "message": "Authenticated successfully",
        "user": current_user
    }

# Google Login
@router.get("/google")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(
        request, 
        GOOGLE_REDIRECT_URI
    )

@router.get("/google/callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    
    userinfo = token.get("userinfo")
    
    if userinfo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not get Google user information"
        )
    
    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    name = userinfo.get("name")
    
    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google information is incomplete"
        )
    
    if not userinfo.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email id is not verified"
        )
    
    user = get_or_create_google_user(
        google_id,
        email,
        name or email.split("@")[0]
    )
    
    if user["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(
        {
            "user_id": user["user_id"],
            "role": user["role"]
        }
    )
    
    response = RedirectResponse(
        url = FRONTEND_URL
    )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return response