const { getStore } = require('@netlify/blobs');
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const VIP_CHAT = '-1003891254928';
const VIP_THREAD = '2';
const WHATSAPP = '213551466301';

function tg(method, data, isMultipart) {
  return new Promise((resolve, reject) => {
    const body = isMultipart ? data : JSON.stringify(data);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: isMultipart
        ? data.getHeaders()
        : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ ok: false }); } });
    });
    req.on('error', reject);
    if (!isMultipart) req.write(body);
    else data.pipe(req);
    if (!isMultipart) req.end();
  });
}

function buildText(p) {
  const sep = '━━━━━━━━━━━━━━━━━━━━━━━━';
  const num = String(p.number).padStart(2, '0');
  const hd = [`🔢 منتج رقم: ${num}`];
  if (p.type && p.type !== '—') hd.push(`📦 النوع: ${p.type}`);
  if (p.niche && p.niche !== '—') hd.push(`🎯 النيش: ${p.niche}`);
  const dt = [];
  const hasC = p.confirmRate && p.confirmRate !== '—';
  const hasD = p.deliveryRate && p.deliveryRate !== '—';
  if (hasC && hasD) dt.push(`✅ نسبة التأكيد: ${p.confirmRate}% | التوصيل: ${p.deliveryRate}%`);
  else if (hasC) dt.push(`✅ نسبة التأكيد: ${p.confirmRate}%`);
  else if (hasD) dt.push(`✅ نسبة التوصيل: ${p.deliveryRate}%`);
  const b = parseInt(p.buyPrice) || 0, s = parseInt(p.sellPrice) || 0;
  if (b && s) dt.push(`💰 سعر الشراء: ${b.toLocaleString('ar-DZ')} دج | سعر البيع: ${s.toLocaleString('ar-DZ')} دج`);
  else if (b) dt.push(`💰 سعر الشراء: ${b.toLocaleString('ar-DZ')} دج`);
  else if (s) dt.push(`💰 سعر البيع: ${s.toLocaleString('ar-DZ')} دج`);
  const hasDu = p.duration && p.duration !== '—';
  const hasQ = p.qty && p.qty !== '—';
  if (hasDu && hasQ) dt.push(`⏱️ مدة توفر المنتج: ${p.duration} أيام كأقصى حد | أقل كمية: ${p.qty} قطعة`);
  else if (hasDu) dt.push(`⏱️ مدة توفر المنتج: ${p.duration} أيام كأقصى حد`);
  else if (hasQ) dt.push(`⏱️ أقل كمية: ${p.qty} قطعة`);
  const parts = [hd.join('\n')];
  if (dt.length) parts.push(dt.join('\n'));
  if (p.note) parts.push(`⚠️ ملاحظة: ${p.note}`);
  parts.push(`💵 للحصول على الصور والمعلومات الكاملة: +${WHATSAPP} تواصل معنا عبر الواتساب`);
  parts.push(`⚠️ يرجى التقيد بسعر البيع لا تبيع تحته\n${sep}\n⚠️ ملاحظة: إذا أحسست تأخذ هذا المنتج وحدك ولا أحد يأخذه — اطلب 300 حبة وسينزع المنتج من التيليغرام مباشرة`);
  parts.push(`لطلب تصنيع او استراد اي منتج\nhttps://frontixalgerien.com/`);
  return parts.join('\n' + sep + '\n');
}

async function publishProduct(p) {
  const text = buildText(p);
  const num = String(p.number).padStart(2, '0');
  const waUrl = `https://wa.me/${WHATSAPP}?text=` + encodeURIComponent(`👑 VIP — منتج رقم: ${num}\nأريد معرفة التفاصيل والسعر الكامل`);
  const reply_markup = { inline_keyboard: [[{ text: '👑 VIP — اطلب الآن عبر واتساب', url: waUrl }]] };
  const imgs = p.images || [];

  if (imgs.length >= 1) {
    // أرسل أول صورة مع النص (الصور مخزّنة كروابط file_id من تيليغرام)
    await tg('sendPhoto', {
      chat_id: VIP_CHAT,
      message_thread_id: parseInt(VIP_THREAD),
      photo: imgs[0],
      caption: text,
      reply_markup
    });
  } else {
    await tg('sendMessage', {
      chat_id: VIP_CHAT,
      message_thread_id: parseInt(VIP_THREAD),
      text,
      reply_markup
    });
  }
}

exports.handler = async () => {
  try {
    const store = getStore({
      name: 'frontix-scheduled',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN
    });
    let queue = JSON.parse((await store.get('queue')) || '[]');
    const now = Date.now();
    const due = queue.filter(p => p.scheduledTime <= now);
    const remaining = queue.filter(p => p.scheduledTime > now);

    for (const p of due) {
      try { await publishProduct(p); } catch (e) {}
    }

    if (due.length > 0) {
      await store.set('queue', JSON.stringify(remaining));
    }

    return { statusCode: 200, body: `published ${due.length}, remaining ${remaining.length}` };
  } catch (e) {
    return { statusCode: 200, body: 'error: ' + e.message };
  }
};
