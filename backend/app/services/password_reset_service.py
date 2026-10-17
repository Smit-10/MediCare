import secrets
import hmac
import hashlib
from datetime import datetime, timedelta, timezone

from app.database import get_connection
from app.auth.password import hash_password
from app.config import OTP_SECRET
from app.services.email_service import send_otp_email


def hash_otp(otp: str):
    if not OTP_SECRET:
        raise RuntimeError("OTP_SECRET is not configured.")
    
    return hmac.new(
        OTP_SECRET.encode(),
        otp.encode(),
        hashlib.sha256
    ).hexdigest()


def request_password_reset(email: str):
    email = email.strip().lower()

    connection = get_connection()
    cursor = connection.cursor()

    try:
        # Only accounts with an existing password can reset it.
        cursor.execute(
            """
            SELECT user_id, email
            FROM users
            WHERE LOWER(email) = %s
              AND password_hash IS NOT NULL
            """,
            (email,)
        )

        user = cursor.fetchone()

        if user is None:
            return False

        user_id = user[0]
        registered_email = user[1]

        # Prevent repeated OTP requests within 60 seconds.
        cursor.execute(
            """
            SELECT created_at
            FROM password_reset_otps
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_id,)
        )

        previous = cursor.fetchone()

        if previous is not None:
            created_at = previous[0]

            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            if datetime.now(timezone.utc) - created_at < timedelta(seconds=60):
                return True

        # Invalidate previous unused OTPs.
        cursor.execute(
            """
            UPDATE password_reset_otps
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
              AND used_at IS NULL
            """,
            (user_id,)
        )

        otp = f"{secrets.randbelow(1000000):06d}"
        otp_hash = hash_otp(otp)

        cursor.execute(
            """
            INSERT INTO password_reset_otps (
                user_id,
                email,
                otp_hash,
                expires_at
            )
            VALUES (
                %s, %s, %s,
                CURRENT_TIMESTAMP + INTERVAL '5 minutes'
            )
            RETURNING reset_id
            """,
            (user_id, registered_email, otp_hash)
        )

        reset_id = cursor.fetchone()[0]
        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()

    try:
        send_otp_email(registered_email, otp)
    except Exception:
        # Invalidate the OTP if email delivery fails.
        connection = get_connection()
        cursor = connection.cursor()

        try:
            cursor.execute(
                """
                UPDATE password_reset_otps
                SET used_at = CURRENT_TIMESTAMP
                WHERE reset_id = %s
                """,
                (reset_id,)
            )
            connection.commit()
        finally:
            cursor.close()
            connection.close()

        raise

    return True


def reset_password(email: str, otp: str, new_password: str):
    email = email.strip().lower()
    supplied_hash = hash_otp(otp)

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                r.reset_id,
                r.user_id,
                r.otp_hash,
                r.expires_at,
                r.attempts
            FROM password_reset_otps r
            JOIN users u ON u.user_id = r.user_id
            WHERE LOWER(r.email) = %s
              AND LOWER(u.email) = %s
              AND u.password_hash IS NOT NULL
              AND r.used_at IS NULL
            ORDER BY r.created_at DESC
            LIMIT 1
            FOR UPDATE OF r
            """,
            (email, email)
        )

        reset = cursor.fetchone()

        if reset is None:
            connection.rollback()
            return False

        reset_id, user_id, stored_hash, expires_at, attempts = reset

        if attempts >= 5 or expires_at <= datetime.now(timezone.utc):
            cursor.execute(
                """
                UPDATE password_reset_otps
                SET used_at = CURRENT_TIMESTAMP
                WHERE reset_id = %s
                """,
                (reset_id,)
            )
            connection.commit()
            return False

        if not hmac.compare_digest(stored_hash, supplied_hash):
            cursor.execute(
                """
                UPDATE password_reset_otps
                SET attempts = attempts + 1
                WHERE reset_id = %s
                """,
                (reset_id,)
            )
            connection.commit()
            return False

        new_password_hash = hash_password(new_password)

        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
              AND password_hash IS NOT NULL
            """,
            (new_password_hash, user_id)
        )

        if cursor.rowcount != 1:
            connection.rollback()
            return False

        # Consume every outstanding OTP for this user.
        cursor.execute(
            """
            UPDATE password_reset_otps
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
              AND used_at IS NULL
            """,
            (user_id,)
        )

        connection.commit()
        return True

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()