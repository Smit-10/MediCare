import secrets

from app.database import get_connection
from app.auth.password import hash_password

def get_or_create_google_user(google_id: str, email: str, name: str):
    connection = get_connection()
    cursor = connection.cursor()
    
    # checkking whether this google account already exists
    cursor.execute(
        """
        SELECT user_id, username, email, role, status
        FROM users where google_id=%s
        """,
        (google_id,)
    )
    
    user = cursor.fetchone()
    
    if user is not None:
        cursor.close()
        connection.close()
        
        return{
            "user_id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[3],
            "status": user[4]
        }
    
    # checking whether this account already exists with same email
    cursor.execute(
        """
        SELECT user_id, username, email, role, status, google_id
        FROM users WHERE email = %s
        """,
        (email,)
    )
    
    existing_user = cursor.fetchone()
    
    if existing_user is not None:
        # link google account with existing medicare account
        cursor.execute(
            """
            UPDATE users
            SET google_id = %s, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
            RETURNING user_id, username, email, role, status
            """,
            (google_id, existing_user[0])
        )
        
        user = cursor.fetchone()
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "user_id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[3],
            "status": user[4]
        }
    
    # Completely new Google user, No password is required.
    cursor.execute(
        """
        INSERT INTO users (
            username,
            email,
            password_hash,
            google_id,
            role,
            status
        )
        VALUES (%s, %s, NULL, %s, 'patient', 'Active')
        RETURNING user_id, username, email, role, status
        """,
        (name, google_id)
    )

    user = cursor.fetchone()

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "user_id": user[0],
        "username": user[1],
        "email": user[2],
        "role": user[3],
        "status": user[4]
    }