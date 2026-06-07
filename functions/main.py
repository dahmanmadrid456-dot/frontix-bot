import os
import json
import requests

BOT_TOKEN = os.environ.get("BOT_TOKEN")
TARGET_CHANNEL_ID = os.environ.get("TARGET_CHANNEL_ID")

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

def get_counter():
    try:
        with open("/tmp/counter.txt", "r") as f:
            return int(f.read().strip())
    except:
        return 0

def increment_counter():
    count = get_counter() + 1
    with open("/tmp/counter.txt", "w") as f:
        f.write(str(count))
    return count

def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        msg = body.get("message", {})
        if not msg:
            return {"statusCode": 200, "body": "ok"}

        num = increment_counter()
        caption = build_caption(num)
        api = f"https://api.telegram.org/bot{BOT_TOKEN}"

        if msg.get("photo"):
            photo_id = msg["photo"][-1]["file_id"]
            requests.post(f"{api}/sendPhoto", json={
                "chat_id": TARGET_CHANNEL_ID,
                "photo": photo_id,
                "caption": caption
            })

        elif msg.get("video"):
            video_id = msg["video"]["file_id"]
            requests.post(f"{api}/sendVideo", json={
                "chat_id": TARGET_CHANNEL_ID,
                "video": video_id,
                "caption": caption
            })

        return {"statusCode": 200, "body": "ok"}
    except Exception as e:
        return {"statusCode": 200, "body": str(e)}
