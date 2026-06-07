const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;

function buildCaption() {
  return `🔢 منتج رقم: —\n📦 النوع: —\n🎯 النيش: —\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ مدة التوفر: — | أقل كمية: —\n\nلمعرفة سعر المنتج او اي تفاصيل\n📲 تواصل معنا على واتساب: +213551466301`;
}

function sendTelegram(method, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const msg = body.message;
    if (!msg) return { statusCode: 200, body: 'ok' };

    const caption = buildCaption();

    if (msg.photo && msg.photo.length > 0) {
      await sendTelegram('sendPhoto', {
        chat_id: TARGET_CHANNEL_ID,
        photo: msg.photo[msg.photo.length - 1].file_id,
        caption: caption
      });
    } else if (msg.video) {
      await sendTelegram('sendVideo', {
        chat_id: TARGET_CHANNEL_ID,
        video: msg.video.file_id,
        caption: caption
      });
    }

    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    return { statusCode: 200, body: 'error: ' + e.message };
  }
};
