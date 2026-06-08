const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
const WHATSAPP_NUMBER = '213551466301';
const GROUP_NAME = 'FRONTIX ALGÉRIEN';

async function getCounter() {
  try {
    const res = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.NETLIFY_SITE_ID}/counter`, {
      headers: { Authorization: `Bearer ${process.env.NETLIFY_TOKEN}` }
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return parseInt(data.value || '0');
  } catch { return 0; }
}

async function setCounter(num) {
  try {
    await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.NETLIFY_SITE_ID}/counter`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(num) })
    });
  } catch {}
}

function buildCaption(num) {
  const n = String(num).padStart(2, '0');
  return `🔢 منتج رقم: ${n}\n📦 النوع: —\n🎯 النيش: —\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ مدة التوفر: — | أقل كمية: —\n\nلمعرفة سعر المنتج او اي تفاصيل\n📲 تواصل معنا على واتساب: +${WHATSAPP_NUMBER}`;
}

function buildKeyboard(num) {
  const n = String(num).padStart(2, '0');
  const msg = encodeURIComponent(`مرحبا، رأيت منتج رقم ${n} في مجموعة ${GROUP_NAME} وأريد معرفة التفاصيل والسعر`);
  return {
    inline_keyboard: [[{ text: '📲 اضغط للطلب عبر واتساب', url: `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}` }]]
  };
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

    const current = await getCounter();
    const num = current + 1;
    await setCounter(num);

    const caption = buildCaption(num);
    const keyboard = buildKeyboard(num);

    if (msg.photo && msg.photo.length > 0) {
      await sendTelegram('sendPhoto', {
        chat_id: TARGET_CHANNEL_ID,
        photo: msg.photo[msg.photo.length - 1].file_id,
        caption,
        reply_markup: keyboard
      });
    } else if (msg.video) {
      await sendTelegram('sendVideo', {
        chat_id: TARGET_CHANNEL_ID,
        video: msg.video.file_id,
        caption,
        reply_markup: keyboard
      });
    }

    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    return { statusCode: 200, body: 'error: ' + e.message };
  }
};
