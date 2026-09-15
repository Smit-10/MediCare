from app.database import get_connection
from app.auth.password import hash_password, verify_password
from app.auth.jwt_handler import create_access_token

def register_user(name: str, email:str, password: str):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """SELECT user_id FROM users WHERE email = %s""", (email,)
    )
    
    existing_user = cursor.fetchone()
    
    if existing_user:
        cursor.close()
        connection.close()
        return None
    
    hashed_password = hash_password(password)
    
    cursor.execute(
        """INSERT INTO users
        (username, email, password_hash, role, status)
        VALUES (%s, %s, %s, 'patient', 'Active')
        RETURNING user_id, username, email, role, status
        """,
        (name, email, hashed_password)
    )
    
    user = cursor.fetchone()
    connection.commit()
    cursor.close()
    connection.close()
    
    return user

def login_user(email: str, password: str):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT user_id, username, email, password_hash, role, status
        FROM users
        WHERE email=%s
        """,
        (email,)
    )
    
    user = cursor.fetchone()
    cursor.close()
    connection.close()
    
    if user is None:
        return None
    
    password_valid = verify_password(password, user[3])
    
    if not password_valid:
        return None
    
    if user[5] != 'Active':
        return None
    
    access_token = create_access_token({
        "user_id": user[0],
        "role": user[4]
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }