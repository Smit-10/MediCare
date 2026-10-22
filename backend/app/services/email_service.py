import resend
from app.config import RESEND_API_KEY, EMAIL_FROM

def send_otp_email(receiver_email: str, otp: str):
    if not RESEND_API_KEY:
        raise ValueError("RESEND_API_KEY is not configured.")

    resend.api_key = RESEND_API_KEY

    params = {
        "from": EMAIL_FROM,
        "to": [receiver_email],
        "subject": "MediCare - Password Reset OTP",
        "text": f"""
Hello,

Your MediCare password reset OTP is: {otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
MediCare Team
"""
    }

    resend.Emails.send(params)