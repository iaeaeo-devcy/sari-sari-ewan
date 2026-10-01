#!/usr/bin/env node
'use strict';

/**
 * Build the self-contained, original SVG pack illustrations used by the catalog.
 * These are graphic stand-ins, not official brand pack photography. All labels,
 * colours, and shapes are emitted locally so no product image depends on a CDN.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'products.json');
const OUT = path.join(ROOT, 'products');
const catalog = JSON.parse(fs.readFileSync(DATA, 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const xml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[char]));
const safeColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
const text = (x, y, value, size, fill, weight = 700, anchor = 'middle', extra = '') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${xml(value)}</text>`;
const lines = (value, max = 13) => {
  const words = String(value || '').split(/\s+/);
  const result = [''];
  for (const word of words) {
    const index = result.length - 1;
    const candidate = `${result[index]} ${word}`.trim();
    if (candidate.length > max && result[index]) result.push(word);
    else result[index] = candidate;
  }
  return result.slice(0, 2);
};
const multiline = (x, y, value, max, size, fill, weight = 800) => {
  const parts = lines(value, max);
  return parts.map((part, index) => text(x, y + index * (size + 2), part, size, fill, weight)).join('');
};

function render(product) {
  const [background, main, accent, ink] = product.palette.map((color, index) =>
    safeColor(color, ['#eee5d2', '#c83a2d', '#efc33f', '#263638'][index]));
  const brandSize = product.brand.length > 13 ? 10 : product.brand.length > 9 ? 12 : 15;
  const labelSize = product.artLabel.length > 13 ? 9 : product.artLabel.length > 9 ? 10 : 12;
  const id = `title-${product.id}`;
  const parts = [];
  const push = (...items) => parts.push(...items);
  const border = '#263638';
  const seam = `<path d="M84 43v-7m72 7v-7M84 176v7m72-7v7" stroke="${ink}" stroke-width="2" opacity=".46"/>`;

  // Centered wrapper used for sachets, coffee, instant noodles, and small packs.
  function pouch({ x = 72, y = 26, w = 96, h = 160, fill = main, corner = 7, outline = border } = {}) {
    push(`<path d="M${x + 7} ${y}h${w - 14}l7 9-4 8 4 7v${h - 46}l-6 8h-${w - 10}l-7-8V${y + 24}l5-7-5-8z" fill="${fill}" stroke="${outline}" stroke-width="2.2" stroke-linejoin="round"/>`);
    push(`<path d="M${x + 9} ${y + 17}h${w - 18}M${x + 9} ${y + h - 19}h${w - 18}" stroke="${accent}" stroke-width="2" opacity=".82"/>`);
    push(`<path d="M${x + 10} ${y + 24}v${h - 46}M${x + w - 10} ${y + 24}v${h - 46}" stroke="${ink}" stroke-width="1" opacity=".16"/>`);
    push(seam);
  }
  function brandBand(y, fill = accent, textFill = ink, width = 90) {
    push(`<rect x="${120 - width / 2}" y="${y}" width="${width}" height="25" rx="3" fill="${fill}" opacity=".97"/>`);
    push(text(120, y + 17, product.brand, brandSize, textFill, 900));
  }

  switch (product.artType) {
    case 'noodle': {
      pouch({ x: 64, y: 22, w: 112, h: 170, corner: 9 });
      push(`<path d="M75 60h90v59H75z" fill="${accent}" opacity=".95"/>`);
      push(text(120, 78, product.brand, brandSize + 1, ink, 900));
      push(multiline(120, 96, product.artLabel, 14, labelSize, ink, 900));
      push(`<ellipse cx="120" cy="151" rx="31" ry="17" fill="#fff3d5" stroke="${ink}" stroke-width="2"/>`);
      push(`<path d="M94 149q9-16 18-4t18-1q7-4 15 5M99 155q10-7 18-1t19 0" fill="none" stroke="${main}" stroke-width="3" stroke-linecap="round"/>`);
      push(`<circle cx="109" cy="145" r="2.4" fill="#d7492f"/><circle cx="131" cy="145" r="2.4" fill="#639249"/>`);
      break;
    }
    case 'can': {
      push(`<ellipse cx="120" cy="47" rx="43" ry="13" fill="#d8d1c2" stroke="${border}" stroke-width="2.2"/>`);
      push(`<path d="M77 47v111c0 7 19 13 43 13s43-6 43-13V47" fill="${main}" stroke="${border}" stroke-width="2.2"/>`);
      push(`<ellipse cx="120" cy="47" rx="43" ry="13" fill="${accent}" stroke="${border}" stroke-width="2.2"/>`);
      push(`<ellipse cx="120" cy="158" rx="43" ry="13" fill="${main}" stroke="${border}" stroke-width="2.2"/>`);
      push(`<rect x="80" y="78" width="80" height="56" fill="${accent}" opacity=".96"/>`);
      push(text(120, 96, product.brand, brandSize, ink, 900));
      push(multiline(120, 113, product.artLabel, 13, labelSize, ink, 900));
      push(`<path d="M104 149q15-13 31 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`);
      push(`<circle cx="111" cy="146" r="3" fill="${ink}"/><circle cx="127" cy="146" r="3" fill="${ink}"/>`);
      break;
    }
    case 'coffee': {
      pouch({ x: 74, y: 21, w: 92, h: 172, corner: 5 });
      push(`<path d="M83 51h74v82H83z" fill="${accent}"/>`);
      push(text(120, 72, product.brand, brandSize + 1, ink, 900));
      push(multiline(120, 91, product.artLabel, 13, labelSize, ink, 900));
      push(`<ellipse cx="120" cy="133" rx="19" ry="5" fill="${ink}" opacity=".17"/>`);
      push(`<path d="M106 112h25l-3 18h-19z" fill="#fff7e6" stroke="${ink}" stroke-width="1.8"/><path d="M131 116h6q5 0 4 6t-8 5" fill="none" stroke="${ink}" stroke-width="2"/>`);
      push(`<path d="M111 109q-5-6 0-10m9 10q-5-6 0-10m9 10q-5-6 0-10" fill="none" stroke="#fff7e6" stroke-width="2" stroke-linecap="round"/>`);
      push(text(120, 159, '3 IN 1', 10, ink, 900));
      break;
    }
    case 'snack': {
      push(`<path d="M77 31l7 8-5 8 5 8-7 8v84l7 8-5 8 5 8h72l5-8-5-8 7-8V63l-7-8 5-8-5-8 5-8z" fill="${main}" stroke="${border}" stroke-width="2.2" stroke-linejoin="round"/>`);
      push(`<path d="M84 57h72v72H84z" fill="${accent}" opacity=".98"/>`);
      push(text(120, 77, product.brand, brandSize + 1, ink, 900));
      push(multiline(120, 96, product.artLabel, 13, labelSize, ink, 900));
      push(`<circle cx="120" cy="143" r="18" fill="#f8d57a" stroke="${ink}" stroke-width="2"/>`);
      push(`<path d="M107 146q13-15 26 0M111 151q9-9 18 0" fill="none" stroke="${main}" stroke-width="3" stroke-linecap="round"/>`);
      push(`<path d="M89 48h62M89 163h62" stroke="${ink}" stroke-width="1.5" opacity=".34"/>`);
      break;
    }
    case 'candy': {
      push(`<path d="M66 82l22-23h64l22 23v73l-22 21H88l-22-21z" fill="${main}" stroke="${border}" stroke-width="2.2" stroke-linejoin="round"/>`);
      push(`<path d="M79 90h82v57H79z" fill="${accent}"/>`);
      push(text(120, 108, product.brand, brandSize, ink, 900));
      push(multiline(120, 127, product.artLabel, 13, labelSize, ink, 900));
      push(`<circle cx="103" cy="155" r="8" fill="#fff5da" stroke="${ink}" stroke-width="1.5"/><circle cx="120" cy="155" r="8" fill="#fff5da" stroke="${ink}" stroke-width="1.5"/><circle cx="137" cy="155" r="8" fill="#fff5da" stroke="${ink}" stroke-width="1.5"/>`);
      push(`<path d="M103 149q-3-4 0-7m17 7q-3-4 0-7m17 7q-3-4 0-7" fill="none" stroke="#fff" stroke-width="1.5"/>`);
      break;
    }
    case 'bottle': {
      push(`<path d="M105 30h30v18l9 11v13q20 12 20 33v48q0 16-15 18H91q-15-2-15-18v-48q0-21 20-33V59l9-11z" fill="${main}" stroke="${border}" stroke-width="2.4" stroke-linejoin="round"/>`);
      push(`<rect x="104" y="20" width="32" height="14" rx="3" fill="${accent}" stroke="${border}" stroke-width="2"/>`);
      push(`<path d="M87 86h66v48H87z" fill="${accent}" opacity=".96"/>`);
      push(text(120, 104, product.brand, brandSize, ink, 900));
      push(multiline(120, 120, product.artLabel, 13, labelSize, ink, 900));
      push(`<path d="M88 145h64M94 156h52" stroke="${ink}" stroke-width="1.3" opacity=".3"/>`);
      push(`<path d="M92 64v13m7-18v9" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".65"/>`);
      break;
    }
    case 'carton': {
      push(`<path d="M78 57l17-22h50l17 22v119H78z" fill="${main}" stroke="${border}" stroke-width="2.4" stroke-linejoin="round"/>`);
      push(`<path d="M78 57h84M95 35v22m50-22v22" stroke="${border}" stroke-width="2"/>`);
      push(`<path d="M89 82h58v57H89z" fill="${accent}"/>`);
      push(text(118, 101, product.brand, brandSize + 1, ink, 900));
      push(multiline(118, 119, product.artLabel, 13, labelSize, ink, 900));
      push(`<circle cx="118" cy="151" r="12" fill="#f6c04c" stroke="${ink}" stroke-width="1.5"/><path d="M112 154q7-15 14 0" fill="none" stroke="#fff1cb" stroke-width="2"/>`);
      break;
    }
    case 'refill': {
      pouch({ x: 71, y: 27, w: 98, h: 161, fill: main, corner: 6 });
      push(`<path d="M81 52h78v83H81z" fill="${accent}"/>`);
      push(text(120, 73, product.brand, brandSize, ink, 900));
      push(multiline(120, 93, product.artLabel, 13, labelSize, ink, 900));
      push(`<path d="M96 145q24-19 48 0l-6 18h-36z" fill="${ink}" opacity=".78"/>`);
      push(text(120, 159, 'REFILL', 8.5, '#fff8e7', 900));
      break;
    }
    case 'rice': {
      push(`<path d="M87 35q33 9 66 0l-4 15q15 16 15 33v81q-44 24-88 0V83q0-18 15-33z" fill="${main}" stroke="${border}" stroke-width="2.4" stroke-linejoin="round"/>`);
      push(`<path d="M88 54q32 10 64 0M78 91h84v46H78z" fill="${accent}" opacity=".95"/>`);
      push(text(120, 108, product.brand, brandSize > 12 ? 11 : brandSize, ink, 900));
      push(multiline(120, 125, product.artLabel, 13, labelSize, ink, 900));
      for (let i = 0; i < 9; i++) {
        const x = 95 + (i % 3) * 24;
        const y = 151 + Math.floor(i / 3) * 8;
        push(`<ellipse cx="${x}" cy="${y}" rx="3.5" ry="1.8" transform="rotate(-23 ${x} ${y})" fill="#fff6df" opacity=".92"/>`);
      }
      break;
    }
    case 'egg': {
      push(`<path d="M65 121h110l-9 41q-46 23-92 0z" fill="#b8814b" stroke="${border}" stroke-width="2.2"/>`);
      push(`<path d="M69 126h102M74 140h92M83 154h74" stroke="#e0b578" stroke-width="3"/>`);
      const eggPositions = product.id === 'egg-one-piece' ? [[120, 96, 34]] : [[88, 88, 26], [120, 79, 27], [152, 88, 26], [102, 116, 25], [138, 116, 25], [120, 101, 25]];
      eggPositions.forEach(([x, y, rx]) => push(`<ellipse cx="${x}" cy="${y}" rx="${rx / 2}" ry="${rx}" fill="${main}" stroke="#b98d5e" stroke-width="1.8"/>`));
      push(text(120, 184, product.artLabel, labelSize, ink, 900));
      break;
    }
    case 'toiletry': {
      pouch({ x: 71, y: 24, w: 98, h: 168, corner: 5 });
      push(`<path d="M80 55h80v79H80z" fill="${accent}"/>`);
      push(text(120, 76, product.brand, brandSize, ink, 900));
      push(multiline(120, 97, product.artLabel, 13, labelSize, ink, 900));
      push(`<path d="M95 145q25-18 50 0v17H95z" fill="${main}" stroke="${ink}" stroke-width="1.4"/>`);
      push(`<path d="M102 151h36" stroke="${ink}" stroke-width="2" opacity=".35"/>`);
      break;
    }
    case 'soap': {
      push(`<path d="M74 75q2-23 26-28h40q25 5 26 28l-5 75q-2 23-25 26h-32q-25-4-26-28z" fill="${main}" stroke="${border}" stroke-width="2.4"/>`);
      push(`<path d="M80 93h80v46H80z" fill="${accent}"/>`);
      push(text(120, 111, product.brand, brandSize, ink, 900));
      push(multiline(120, 129, product.artLabel, 13, labelSize, ink, 900));
      push(`<path d="M92 153q28 8 56 0" fill="none" stroke="${ink}" stroke-width="1.5" opacity=".4"/>`);
      break;
    }
    case 'candle': {
      push(`<rect x="83" y="56" width="31" height="120" rx="6" fill="${main}" stroke="${border}" stroke-width="2"/>`);
      push(`<rect x="126" y="39" width="31" height="137" rx="6" fill="${main}" stroke="${border}" stroke-width="2"/>`);
      push(`<path d="M98 55v-9m43-8v-9" stroke="${border}" stroke-width="2.2" stroke-linecap="round"/>`);
      push(`<path d="M98 42q-8 8 0 12 8-4 0-12zm43-8q-8 8 0 12 8-4 0-12z" fill="${accent}" stroke="#d67832" stroke-width="1.4"/>`);
      push(`<rect x="79" y="102" width="39" height="30" fill="${accent}"/><rect x="122" y="92" width="39" height="32" fill="${accent}"/>`);
      push(text(98, 121, 'KAN', 8, ink, 900));
      push(text(141, 112, 'DILA', 8, ink, 900));
      push(text(120, 194, product.artLabel, labelSize, ink, 900));
      break;
    }
    case 'matches': {
      push(`<path d="M63 76l92-24 29 90-93 26z" fill="${main}" stroke="${border}" stroke-width="2.5" stroke-linejoin="round"/>`);
      push(`<path d="M79 81l65-17 20 64-66 17z" fill="${accent}" stroke="${border}" stroke-width="1.5"/>`);
      push(text(118, 99, product.brand, brandSize, ink, 900, 'middle', `transform="rotate(-14 118 99)"`));
      push(text(120, 117, product.artLabel, labelSize - 1, ink, 900, 'middle', `transform="rotate(-14 120 117)"`));
      for (let i = 0; i < 5; i++) {
        const x = 88 + i * 13;
        push(`<path d="M${x} 149l18-5" stroke="#d4ac78" stroke-width="3"/><circle cx="${x + 19}" cy="144" r="3" fill="#c8372e"/>`);
      }
      break;
    }
    case 'bar': {
      push(`<path d="M67 72q0-14 16-17l75 1q16 4 16 18l-8 67q-2 17-18 20h-56q-16-3-18-20z" fill="${main}" stroke="${border}" stroke-width="2.4"/>`);
      push(`<path d="M72 93h96v43H72z" fill="${accent}"/>`);
      push(text(120, 111, product.brand, brandSize, ink, 900));
      push(multiline(120, 129, product.artLabel, 13, labelSize, ink, 900));
      push(`<path d="M86 151q34 8 68 0" fill="none" stroke="${ink}" stroke-width="1.4" opacity=".35"/>`);
      break;
    }
    case 'bag': {
      push(`<path d="M83 65l13-15h48l13 15-7 115H90z" fill="${main}" fill-opacity=".94" stroke="${border}" stroke-width="2.4" stroke-linejoin="round"/>`);
      push(`<path d="M98 53q0-21 22-21t22 21" fill="none" stroke="${border}" stroke-width="4"/>`);
      push(`<path d="M95 97h51v45H95z" fill="${accent}" opacity=".86"/>`);
      push(text(120, 115, product.brand, brandSize, ink, 900));
      push(multiline(120, 132, product.artLabel, 13, labelSize, ink, 900));
      push(`<path d="M101 157h38" stroke="${ink}" stroke-width="1.4" opacity=".3"/>`);
      break;
    }
    default:
      pouch();
      brandBand(61);
      push(multiline(120, 109, product.artLabel, 13, labelSize, ink, 900));
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="240" height="220" viewBox="0 0 240 220" role="img" aria-labelledby="${id}">\n<title id="${id}">${xml(product.brand)} ${xml(product.name)} — original illustrated pack</title>\n<rect width="240" height="220" fill="${background}"/>\n<path d="M0 194H240" stroke="${ink}" stroke-width="1" opacity=".12"/>\n<circle cx="22" cy="29" r="2" fill="${accent}" opacity=".6"/><circle cx="218" cy="50" r="2" fill="${accent}" opacity=".55"/>\n<ellipse cx="120" cy="197" rx="56" ry="7" fill="${ink}" opacity=".11"/>\n${parts.join('\n')}\n</svg>\n`;
  return svg;
}

let made = 0;
for (const product of catalog.products) {
  if (!/^[a-z0-9-]+$/.test(product.id)) throw new Error(`Unsafe product id: ${product.id}`);
  const target = path.join(OUT, `${product.id}.svg`);
  fs.writeFileSync(target, render(product));
  made += 1;
}
console.log(`Generated ${made} local product illustrations in ${path.relative(ROOT, OUT)}/`);
