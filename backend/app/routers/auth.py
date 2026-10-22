from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from authlib.integrations.starlette_client import OAuth
from app.schemas.auth import UserRegister, Token, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest
from app.services.auth_service import register_user, login_user, change_password
from app.services.password_reset_service import request_password_reset, reset_password as reset_password_service
from app.services.google_auth_service import get_or_create_google_user, is_patient_profile_complete
from app.auth.jwt_handler import get_current_user, create_access_token
from app.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, FRONTEND_URL, COOKIE_SAMESITE, COOKIE_SECURE, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

import logging

logger = logging.getLogger(__name__)

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
    
    # if result.email is None:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Email already registered"
    #     )
    # if result.name is None:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="Email already registered"
    #         )
    
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
    
    response = JSONResponse(
        content={
            "access_token": result["access_token"],
            "token_type": result["token_type"]
        }
    )
    
    response.set_cookie(
        key="access_token",
        value = result["access_token"],
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES*60
    )
    
    return response

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
    
    if user["status"] != "Active":
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
    if user["role"] == "patient":
        if is_patient_profile_complete(user["user_id"]):
            redirect_url = f"{FRONTEND_URL}/patient/dashboard"
        else:
            redirect_url = f"{FRONTEND_URL}/complete-profile"

    elif user["role"] == "doctor":
        redirect_url = f"{FRONTEND_URL}/doctor/dashboard"

    elif user["role"] == "admin":
        redirect_url = f"{FRONTEND_URL}/admin/dashboard"

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user role"
        )

    response = RedirectResponse(url=redirect_url)
    
    # response = RedirectResponse(
    #     url = FRONTEND_URL
    # )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return response

@router.post("/logout")
def logout():
    response = JSONResponse(
        content={
            "message": "Logged out successfully"
        }
    )
    
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE
    )
    
    return response

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    try:
        request_password_reset(str(data.email))
    except Exception:
        logger.exception("Forgot password failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the request. Please try again later."
        )

    return {
        "message": (
            "If an eligible account exists for this email, "
            "an OTP will be sent."
        )
    }


@router.post("/reset-password")
def reset_password_endpoint(data: ResetPasswordRequest):
    try:
        success = reset_password_service(
            email=str(data.email),
            otp=data.otp,
            new_password=data.new_password
        )   
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to reset password. Please try again later."
        )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP."
        )

    return {"message": "Password reset successfully."}


@router.post("/change-password")
def change_password_endpoint(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    try:
        change_password(
            user_id=current_user["user_id"],
            current_password=data.current_password,
            new_password=data.new_password
        )

        return {"message": "Password changed successfully."}

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to change password. Please try again later."
        )