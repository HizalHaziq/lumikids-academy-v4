"""Email sending via Gmail SMTP using aiosmtplib."""
import os
import logging
from email.message import EmailMessage
import aiosmtplib

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html_body: str, plain_body: str = "") -> bool:
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))

    if not smtp_user or not smtp_pass:
        logger.warning(f"SMTP not configured. Would send to {to_email}: {subject}")
        return False

    # FIX: Get the admin email to use as the sender address for Resend
    sender_email = os.environ.get("ADMIN_EMAIL", "no-reply@lumikids.online")

    msg = EmailMessage()
    msg["From"] = f"LumiKids Academy <{sender_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(plain_body or "Please use an HTML-capable email client to view this message.")
    msg.add_alternative(html_body, subtype="html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            start_tls=True,
            username=smtp_user,
            password=smtp_pass,
            timeout=15,
        )
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def enrollment_approval_html(parent_name: str, child_name: str, email: str, password: str, login_url: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FFFAF5;">
      <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <h1 style="color: #FF8C73; margin: 0 0 16px;">Welcome to LumiKids Academy! 🌟</h1>
        <p style="color: #1E293B; font-size: 16px;">Dear {parent_name},</p>
        <p style="color: #1E293B; font-size: 16px;">
          We're delighted to inform you that your enrollment request for <strong>{child_name}</strong>
          has been <strong>approved</strong>!
        </p>
        <div style="background: #FDF3B8; border-radius: 16px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">Your Parent Portal Credentials:</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> {email}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: white; padding: 4px 8px; border-radius: 8px;">{password}</code></p>
        </div>
        <a href="{login_url}" style="display: inline-block; background: #FF8C73; color: white; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">Login to Parent Portal</a>
        <p style="color: #64748B; font-size: 14px; margin-top: 32px;">
          Please change your password after first login. If you have any questions, reply to this email.
        </p>
        <p style="color: #64748B; font-size: 14px;">— The LumiKids Team</p>
      </div>
    </div>
    """


def enrollment_received_html(parent_name: str, child_name: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FFFAF5;">
      <div style="background: white; border-radius: 24px; padding: 40px;">
        <h1 style="color: #FF8C73;">Enrollment Received! 🎈</h1>
        <p>Dear {parent_name},</p>
        <p>Thank you for your interest in LumiKids Academy. We've received your enrollment request for <strong>{child_name}</strong>.</p>
        <p>Our admissions team will review your application and get back to you within 2-3 business days.</p>
        <p style="color: #64748B;">— The LumiKids Team</p>
      </div>
    </div>
    """