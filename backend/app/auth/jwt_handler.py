from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_connection

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False
)

def create_access_token(data: dict):
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire
    })
    
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return token

def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )
    
    # first we will check Authorization header
    # if there is no Bearer token, we will check the cookie
    if token is None:
        token = request.cookies.get("access_token")
        
    # if still there is no token
    if token is None:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        if user_id is None:
            raise credentials_exception
    
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT user_id, username, email, role, status
        FROM users WHERE user_id %s
        """,
        (user_id,)
    )
    
    user = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    if user is None:
        raise credentials_exception
    
    if user[4] != 'Active':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )
    
    return {
        "user_id": user[0],
        "username": user[1],
        "email": user[2],
        "role": user[3],
        "status": user[4]
    }

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        if user_id is None:
            raise credentials_exception
        
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT user_id, username, email, role, status
        FROM users
        WHERE user_id = %s
        """,
        (user_id,)
    )
    
    user = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    if user is None:
        raise credentials_exception
    
    if user[4] != 'Active':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return {
        "user_id": user[0],
        "username": user[1],
        "email": user[2],
        "role": user[3],
        "status": user[4]
    }