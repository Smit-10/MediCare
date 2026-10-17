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
    
    # Google-only accounts do not have a password
    if user[3] is None:
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


def change_password(user_id: int, current_password: str, new_password: str):
    if current_password == new_password:
        raise ValueError("New password must differ from current password.")

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT password_hash
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if user is None:
            raise ValueError("User account not found.")

        stored_hash = user[0]

        # Google-only accounts do not have a password.
        if not stored_hash:
            raise ValueError(
                "This account does not have a password. "
                "Password change is unavailable."
            )

        if not verify_password(current_password, stored_hash):
            raise ValueError("Current password is incorrect.")

        new_password_hash = hash_password(new_password)

        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
            """,
            (new_password_hash, user_id)
        )

        connection.commit()
        return True

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()