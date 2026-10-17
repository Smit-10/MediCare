import smtplib
import ssl
from email.message import EmailMessage

from app.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_EMAIL,
    SMTP_APP_PASSWORD,
)


def send_otp_email(receiver_email: str, otp: str):
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        raise ValueError("SMTP credentials are not configured.")

    message = EmailMessage()

    message["Subject"] = "MediCare - Password Reset OTP"
    message["From"] = SMTP_EMAIL
    message["To"] = receiver_email

    message.set_content(
        f"""
Hello,

Your MediCare password reset OTP is: {otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
MediCare Team
"""
    )

    context = ssl.create_default_context()

    with smtplib.SMTP_SSL(
        SMTP_HOST,
        SMTP_PORT,
        context=context,
        timeout=20
    ) as server:
        server.set_debuglevel(1)
        server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
        server.send_message(message)