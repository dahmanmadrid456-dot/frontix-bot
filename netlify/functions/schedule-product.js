const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'ok' };
  }

  try {
    const store = getStore({
      name: 'frontix-scheduled',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN
    });

    // GET: إرجاع قائمة المنتجات المجدولة
    if (event.httpMethod === 'GET') {
      const list = await store.get('queue');
      return { statusCode: 200, headers, body: list || '[]' };
    }

    // POST: إضافة أو حذف منتج مجدول
    const data = JSON.parse(event.body || '{}');
    let queue = JSON.parse((await store.get('queue')) || '[]');

    if (data.action === 'delete') {
      queue = queue.filter(p => p.schedId !== data.schedId);
      await store.set('queue', JSON.stringify(queue));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, queue }) };
    }

    // إضافة منتج جديد
    queue.push(data.product);
    await store.set('queue', JSON.stringify(queue));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, count: queue.length }) };

  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
