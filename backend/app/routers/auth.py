from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import UserLogin, UserRegister, Token
from app.services.auth_service import register_user, login_user
from app.auth.jwt_handler import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
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