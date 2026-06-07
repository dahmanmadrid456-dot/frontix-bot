import os
import logging
import yt_dlp
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN")
SOURCE_GROUP_ID = int(os.environ.get("SOURCE_GROUP_ID", "0"))
TARGET_CHANNEL_ID = int(os.environ.get("TARGET_CHANNEL_ID", "0"))
COUNTER_FILE = "counter.txt"

logging.basicConfig(level=logging.INFO)

def get_counter():
    try:
        with open(COUNTER_FILE, "r") as f:
            return int(f.read().strip())
    except:
        return 0

def increment_counter():
    count = get_counter() + 1
    with open(COUNTER_FILE, "w") as f:
        f.write(str(count))
    return count

def build_caption(num):
    n = str(num).zfill(2)
    return (
        f"🔢 منتج رقم: {n}\n"
        f"📦 النوع: —\n"
        f"🎯 النيش: —\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"✅ مدة التوفر: — | أقل كمية: —\n\n"
        f"لمعرفة سعر المنتج او اي تفاصيل\n"
        f"📲 تواصل معنا على واتساب: +213551466301"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or msg.chat_id != SOURCE_GROUP_ID:
        return

    text = msg.text or msg.caption or ""
    urls = [w for w in text.split() if w.startswith("http")]
    num = increment_counter()
    caption = build_caption(num)

    if urls:
        url = urls[0]
        try:
            ydl_opts = {
                "format": "best[ext=mp4]/best",
                "outtmpl": f"/tmp/video_{num}.%(ext)s",
                "quiet": True,
                "max_filesize": 50 * 1024 * 1024,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                ext = info.get("ext", "mp4")
                filepath = f"/tmp/video_{num}.{ext}"
            with open(filepath, "rb") as vf:
                await context.bot.send_video(
                    chat_id=TARGET_CHANNEL_ID,
                    video=vf,
                    caption=caption
                )
            os.remove(filepath)
        except Exception as e:
            logging.error(f"Error: {e}")
            await context.bot.send_message(
                chat_id=TARGET_CHANNEL_ID,
                text=caption + f"\n\n🔗 {url}"
            )
        return

    if msg.photo:
        await context.bot.send_photo(
            chat_id=TARGET_CHANNEL_ID,
            photo=msg.photo[-1].file_id,
            caption=caption
        )
        return

    if msg.video:
        await context.bot.send_video(
            chat_id=TARGET_CHANNEL_ID,
            video=msg.video.file_id,
            caption=caption
        )
        return

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.ALL, handle_message))
    print("Bot started...")
    app.run_polling()

if __name__ == "__main__":
    main()
