'use strict';

const fs = require('node:fs');
const path = require('node:path');

function sendJson(res, statusCode, payload) {
  // Vercel's response object has .status().json(); the built-in Node response does not.
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(payload);
    return;
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

// Read-only catalog endpoint. data/products.json is explicitly bundled by vercel.json.
module.exports = function productsHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const fromProjectRoot = path.join(process.cwd(), 'data', 'products.json');
    const localFallback = path.join(__dirname, '..', 'data', 'products.json');
    const filePath = fs.existsSync(fromProjectRoot) ? fromProjectRoot : localFallback;
    const catalog = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    sendJson(res, 200, catalog);
  } catch (error) {
    console.error('Could not read data/products.json:', error);
    sendJson(res, 500, { error: 'Catalog is temporarily unavailable.' });
  }
};
