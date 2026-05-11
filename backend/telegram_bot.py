"""Telegram bot helper for sending absence alerts."""
import os
import logging
import httpx

logger = logging.getLogger(__name__)


async def send_telegram_message(chat_id: str, message: str) -> bool:
    """Send a Telegram message via Bot API. Returns True on success."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token or not chat_id:
        logger.info(f"Telegram not configured or no chat_id (would send: {message[:60]})")
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json={
                "chat_id": str(chat_id),
                "text": message,
                "parse_mode": "HTML",
            })
            if r.status_code == 200:
                return True
            logger.error(f"Telegram API error {r.status_code}: {r.text}")
            return False
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False


def absence_message(child_name: str, school_date: str) -> str:
    return (
        f"🔔 <b>LumiKids Absence Alert</b>\n\n"
        f"Your child <b>{child_name}</b> was marked <b>absent</b> "
        f"on <b>{school_date}</b>.\n\n"
        f"If this is unexpected, please contact the school."
    )


def late_message(child_name: str, school_date: str) -> str:
    return (
        f"⏰ <b>LumiKids Late Arrival</b>\n\n"
        f"Your child <b>{child_name}</b> arrived <b>late</b> "
        f"on <b>{school_date}</b>."
    )
