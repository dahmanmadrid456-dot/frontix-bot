const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  try {
    const store = getStore({
      name: 'frontix',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN
    });
    const val = await store.get('counter');
    const counter = parseInt(val || '14') || 14;
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ counter })
    };
  } catch {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ counter: 14 })
    };
  }
};
