// "আমার শেরপুর" কার্ড আঁকার কোড: ১০৮০×১৩৫০ PNG, পুরোটা ব্যবহারকারীর ব্রাউজারেই তৈরি হয়।
// এই ফাইলে ব্রাউজারের জিনিস (document, Path2D) শুধু ফাংশনের ভেতরে ব্যবহার হয়েছে,
// যাতে সার্ভারে লোড হলেও ভাঙে না। কোনো Tailwind ক্লাস নেই।
import { PLACES, UPAZILAS } from './sherpurPlaces';
import { UPAZILA_SHAPES, MAP_WIDTH, MAP_HEIGHT, project, MAP_CREDIT } from './sherpurMap';
import { toBn } from './format';

export const CARD_W = 1080;
export const CARD_H = 1350;

const M = 72; // পাশের ফাঁকা জায়গা
const CONTENT_TOP = 292;
const CONTENT_BOTTOM = 1210;
const PROGRESS_H = 96;

// কার্ডের রঙের থিম। id দিয়ে renderCard-এ বাছা হয়, label ও swatch পাতার বোতামের জন্য।
const THEMES = {
  sabuj: {
    label: 'সবুজ',
    bg: '#F6F2EA', green: '#1C8A4C', greenDark: '#0E5C33', ink: '#1B2A4A',
    muted: '#77725F', faint: '#9A9582', beige: '#E5DFD0', line: '#DDD7C8',
    red: '#E5384F', white: '#FFFFFF', onGreen: '#CFEBDA', halo: '#0E5C33',
    leader: 'rgba(14,92,51,0.55)',
  },
  raat: {
    label: 'রাত',
    bg: '#10202E', green: '#2F9E63', greenDark: '#E3F5EA', ink: '#EAF1F7',
    muted: '#9FB3C4', faint: '#6F8597', beige: '#243B4F', line: '#2C4358',
    red: '#FF5A6E', white: '#FFFFFF', onGreen: '#E3F5EA', halo: '#0B1620',
    leader: 'rgba(227,245,234,0.55)',
  },
  sonali: {
    label: 'সোনালি',
    bg: '#FAF1DC', green: '#C0801A', greenDark: '#6B4300', ink: '#3A2A10',
    muted: '#8A7650', faint: '#A8956E', beige: '#EBDDBA', line: '#E2D2AA',
    red: '#B3261E', white: '#FFFFFF', onGreen: '#FFF3D6', halo: '#6B4300',
    leader: 'rgba(107,67,0,0.55)',
  },
  nil: {
    label: 'নীল',
    bg: '#EAF2F8', green: '#2C6E9B', greenDark: '#123F5E', ink: '#16314A',
    muted: '#5B7185', faint: '#8396A8', beige: '#D3E1EC', line: '#C5D6E3',
    red: '#E5384F', white: '#FFFFFF', onGreen: '#E4F0F8', halo: '#123F5E',
    leader: 'rgba(18,63,94,0.55)',
  },
};

// পাতার থিম-বোতামের জন্য
export const CARD_THEMES = Object.keys(THEMES).map((id) => ({
  id,
  label: THEMES[id].label,
  bg: THEMES[id].bg,
  accent: THEMES[id].green,
  dark: THEMES[id].greenDark,
}));


const SANS = '"Hind Siliguri", "Noto Sans Bengali", system-ui, sans-serif';
const SERIF = '"Noto Serif Bengali", "Hind Siliguri", Georgia, serif';

// উপজেলার নামের জায়গা এখন sherpurMap.js-এ ঠিক করা, তাই আলাদা সরানোর দরকার নেই
const LABEL_NUDGE = {};

const FONT_SAMPLE = 'আমার শেরপুর ০১২৩৪৫৬৭৮৯ ঝিনাইগাতী নকলা নালিতাবাড়ী শ্রীবরদী';

export async function loadCardFonts() {
  try {
    if (!document.fonts || !document.fonts.load) return;
    await Promise.all([
      document.fonts.load('400 30px "Hind Siliguri"', FONT_SAMPLE),
      document.fonts.load('500 30px "Hind Siliguri"', FONT_SAMPLE),
      document.fonts.load('600 30px "Hind Siliguri"', FONT_SAMPLE),
      document.fonts.load('700 30px "Hind Siliguri"', FONT_SAMPLE),
      document.fonts.load('700 30px "Noto Serif Bengali"', FONT_SAMPLE),
      document.fonts.load('500 30px "Noto Serif Bengali"', FONT_SAMPLE),
      document.fonts.load('400 30px "Noto Serif Bengali"', '০১২৩৪৫৬৭৮৯'),
    ]);
    await document.fonts.ready;
  } catch {}
}

// নাম সর্বোচ্চ ৩০ অক্ষর-গুচ্ছ (যুক্তাক্ষর না ভেঙে)
export function sanitizeName(raw) {
  const clean = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
  return graphemes(clean).slice(0, 30).join('').trim();
}

// ছবি বর্গাকারে কেটে ছোট করে নেয়। ছবি কোথাও পাঠানো হয় না।
export async function prepareSquarePhoto(file, size = 600) {
  if (!file || !/^image\//.test(file.type)) throw new Error('not-image');
  if (file.size > 20 * 1024 * 1024) throw new Error('too-big');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const side = Math.min(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.getContext('2d').drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob-failed'))), 'image/png');
  });
}

function setFont(ctx, weight, size, family) {
  ctx.font = `${weight} ${size}px ${family}`;
}

// সাইটের মতোই বাংলা সংখ্যা Noto Serif Bengali-তে, বাকি লেখা Hind Siliguri-তে।
// (Hind Siliguri-র হালকা ওজনে "১" ছোট ও অস্পষ্ট দেখায়।)
const DIGIT_SPLIT = /([০-৯]+)/;

function mixedRuns(text, weight, size) {
  return text
    .split(DIGIT_SPLIT)
    .filter(Boolean)
    .map((part) => ({
      part,
      font: /^[০-৯]+$/.test(part)
        ? `${weight >= 600 ? 700 : 500} ${size}px ${SERIF}`
        : `${weight} ${size}px ${SANS}`,
    }));
}

function measureMixed(ctx, text, weight, size) {
  let total = 0;
  for (const run of mixedRuns(text, weight, size)) {
    ctx.font = run.font;
    total += ctx.measureText(run.part).width;
  }
  return total;
}

function drawMixed(ctx, text, x, y, align, weight, size) {
  const width = measureMixed(ctx, text, weight, size);
  let cursor = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x;
  ctx.textAlign = 'left';
  for (const run of mixedRuns(text, weight, size)) {
    ctx.font = run.font;
    ctx.fillText(run.part, cursor, y);
    cursor += ctx.measureText(run.part).width;
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// বাংলা যুক্তাক্ষর না ভেঙে অক্ষর-গুচ্ছ আলাদা করে
function graphemes(text) {
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(text), (s) => s.segment);
    }
  } catch {}
  return Array.from(text);
}

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  const parts = graphemes(text);
  while (parts.length > 1 && ctx.measureText(parts.join('') + '…').width > maxW) parts.pop();
  return parts.join('') + '…';
}

function rectsIntersect(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function circleRect(x, y, r) {
  return { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
}

// প্রতিটি বিন্দুর পাশে নাম বসানো। ঘন জায়গায় নাম একটু দূরে বসে, সঙ্গে ছোট টানা রেখা থাকে।
// দরকারে লেখা ধাপে ধাপে ছোট হয়। কিছুতেই না এঁটে গেলে null (তখন নম্বর পদ্ধতি)।
function placeNameLabels(ctx, dots, bounds) {
  const sizes = [30, 28, 26, 24, 22];
  for (const fs of sizes) {
    const result = tryPlaceLabels(ctx, dots, bounds, fs);
    if (result) return { labels: result, fontSize: fs };
  }
  return null;
}

function tryPlaceLabels(ctx, dots, bounds, fs) {
  setFont(ctx, 600, fs, SANS);
  const dotRects = dots.map((d) => circleRect(d.x, d.y, 17));
  const placed = [];
  const crowd = (d) => dots.filter((o) => o !== d && Math.hypot(o.x - d.x, o.y - d.y) < 130).length;
  const order = [...dots].sort((a, b) => crowd(b) - crowd(a) || a.y - b.y || a.x - b.x);
  const rings = [20, 44, 72, 104, 140];
  const angles = [];
  for (let a = 0; a < 360; a += 30) angles.push((a * Math.PI) / 180);
  for (const d of order) {
    const w = ctx.measureText(d.label).width;
    let best = null;
    for (const dist of rings) {
      for (const ang of angles) {
        const cx = Math.cos(ang);
        const sy = Math.sin(ang);
        const px = d.x + cx * dist;
        const py = d.y + sy * dist;
        const align = cx > 0.3 ? 'left' : cx < -0.3 ? 'right' : 'center';
        let baseline;
        if (sy < -0.3) baseline = py;
        else if (sy > 0.3) baseline = py + fs * 0.95;
        else baseline = py + fs * 0.37;
        const left = align === 'left' ? px : align === 'right' ? px - w : px - w / 2;
        const rect = { x0: left - 4, x1: left + w + 4, y0: baseline - fs * 0.93, y1: baseline + fs * 0.33 };
        if (rect.x0 < bounds.x0 || rect.x1 > bounds.x1 || rect.y0 < bounds.y0 || rect.y1 > bounds.y1) continue;
        if (placed.some((q) => rectsIntersect(q.rect, rect))) continue;
        if (dotRects.some((o, i) => dots[i] !== d && rectsIntersect(o, rect))) continue;
        if (rectsIntersect(circleRect(d.x, d.y, 14), rect)) continue;
        const cost = dist + (align === 'center' ? 6 : 0);
        if (!best || cost < best.cost) best = { x: px, y: baseline, align, rect, text: d.label, cost, dist };
      }
      if (best) break;
    }
    if (!best) return null;
    if (best.dist > 30) {
      const nx = Math.min(Math.max(d.x, best.rect.x0 + 4), best.rect.x1 - 4);
      const ny = Math.min(Math.max(d.y, best.rect.y0), best.rect.y1);
      best.leader = { x0: d.x, y0: d.y, x1: nx, y1: ny };
    }
    placed.push(best);
  }
  return placed;
}

// নম্বর-বৃত্তগুলো একটার গায়ে আরেকটা পড়লে ঠেলে আলাদা করে
function spreadBadges(items, r, bounds) {
  const minDist = r * 2 + 4;
  for (let iter = 0; iter < 160; iter++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          if (dist < 0.01) {
            dx = 1;
            dy = 0;
            dist = 1;
          }
          const push = (minDist - dist) / 2 + 0.5;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
          moved = true;
        }
      }
    }
    for (const item of items) {
      item.x = Math.min(Math.max(item.x, bounds.x0 + r), bounds.x1 - r);
      item.y = Math.min(Math.max(item.y, bounds.y0 + r), bounds.y1 - r);
    }
    if (!moved) break;
  }
}

function wrapLines(ctx, text, maxW, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxW || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fitText(ctx, kept[maxLines - 1] + '…', maxW);
    return kept;
  }
  return lines;
}

function drawHaloText(ctx, text, x, y, align, colors) {
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 9;
  ctx.strokeStyle = colors.halo;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = colors.white;
  ctx.fillText(text, x, y);
}

// মূল ফাংশন: কার্ডের canvas ফেরত দেয়
export async function renderCard({ name, photo, selectedIds, theme = 'sabuj', showUpazilaNames = true }) {
  const COLORS = THEMES[theme] || THEMES.sabuj;
  await loadCardFonts();

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  const selected = PLACES.filter((p) => selectedIds.includes(p.id));
  const total = PLACES.length;
  const selCount = selected.length;
  const percent = total ? Math.round((selCount / total) * 100) : 0;
  const visitedUpazilas = new Set(selected.map((p) => p.upazila));
  const pinned = selected.filter((p) => p.lat != null && p.lng != null);
  const unpinned = selected.filter((p) => p.lat == null || p.lng == null);

  // জমি
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ---------- উপরের অংশ: ছবি, শিরোনাম, নাম, গণনা ----------
  const hasPhoto = !!photo;
  const frame = 180;
  if (hasPhoto) {
    ctx.save();
    roundRectPath(ctx, M, 72, frame, frame, 40);
    ctx.clip();
    ctx.drawImage(photo, M, 72, frame, frame);
    ctx.restore();
    roundRectPath(ctx, M + 4, 76, frame - 8, frame - 8, 36);
    ctx.lineWidth = 8;
    ctx.strokeStyle = COLORS.green;
    ctx.stroke();
  }
  const textX = hasPhoto ? M + frame + 40 : M;

  // ডানের বড় সংখ্যা
  const countMain = toBn(selCount);
  const countSub = `/${toBn(total)}`;
  setFont(ctx, 500, 52, SERIF);
  const subW = ctx.measureText(countSub).width;
  setFont(ctx, 700, 130, SERIF);
  const mainW = ctx.measureText(countMain).width;
  const countLeft = CARD_W - M - subW - mainW - 8;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.greenDark;
  ctx.fillText(countMain, countLeft, 236);
  setFont(ctx, 500, 52, SERIF);
  ctx.fillStyle = COLORS.faint;
  ctx.fillText(countSub, countLeft + mainW + 8, 236);

  // শিরোনাম (জায়গা অনুযায়ী ছোট হয়)
  const titleMaxW = countLeft - textX - 28;
  let titleSize = hasPhoto ? 84 : 92;
  setFont(ctx, 700, titleSize, SANS);
  while (titleSize > 40 && ctx.measureText('আমার শেরপুর').width > titleMaxW) {
    titleSize -= 2;
    setFont(ctx, 700, titleSize, SANS);
  }
  ctx.fillStyle = COLORS.greenDark;
  ctx.fillText('আমার শেরপুর', textX, 206);

  setFont(ctx, 400, 32, SANS);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('শেরপুর ভ্রমণ ম্যাপ', textX, 104);

  const personName = sanitizeName(name);
  if (personName) {
    setFont(ctx, 500, 44, SANS);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(fitText(ctx, personName, titleMaxW + 20), textX, 264);
  }

  // ---------- ম্যাপ ও নাম বা নম্বর ----------
  const namesLayout = (() => {
    setFont(ctx, 400, 26, SANS);
    const unpinnedLines = unpinned.length
      ? wrapLines(ctx, `ম্যাপে মার্কার নেই: ${unpinned.map((p) => p.short).join(', ')}`, CARD_W - 2 * M, 2)
      : [];
    const extra = unpinnedLines.length ? unpinnedLines.length * 34 + 10 : 0;
    const mapBottom = CONTENT_BOTTOM - PROGRESS_H - 18 - extra - 14;
    return { unpinnedLines, mapBottom };
  })();

  function mapBox(mapBottom) {
    const mapTop = CONTENT_TOP;
    const mapH = Math.max(mapBottom - mapTop, 300);
    const s = mapH / MAP_HEIGHT;
    return { s, ox: (CARD_W - MAP_WIDTH * s) / 2, oy: mapTop, mapH, mapBottom: mapTop + mapH };
  }

  function toCard(box, place) {
    const pt = project(place.lat, place.lng);
    return { x: box.ox + pt.x * box.s, y: box.oy + pt.y * box.s };
  }

  let box = mapBox(namesLayout.mapBottom);
  let dots = pinned.map((p) => ({ id: p.id, label: p.short, ...toCard(box, p) }));
  const placedNames = placeNameLabels(ctx, dots, {
    x0: 24,
    x1: CARD_W - 24,
    y0: CONTENT_TOP - 6,
    y1: box.mapBottom + 20,
  });
  const labels = placedNames ? placedNames.labels : null;
  const labelFont = placedNames ? placedNames.fontSize : 30;
  const namesMode = labels !== null;

  let numbered = null; // নম্বর পদ্ধতির তথ্য
  let listLayout = null;
  if (!namesMode) {
    const n = selected.length;
    const cols = n <= 12 ? 2 : n <= 24 ? 3 : 4;
    const fontSize = n <= 12 ? 28 : n <= 24 ? 25 : 22;
    const rowH = n <= 12 ? 42 : n <= 24 ? 38 : 34;
    const rows = Math.ceil(n / cols);
    const listH = rows * rowH + 8;
    const mapBottom = CONTENT_BOTTOM - PROGRESS_H - 18 - listH - 14;
    box = mapBox(mapBottom);
    listLayout = { cols, fontSize, rowH, rows, listTop: box.mapBottom + 14 };
    numbered = selected.map((p, i) => ({ place: p, number: i + 1 }));
    dots = pinned.map((p) => {
      const pos = toCard(box, p);
      return { id: p.id, ox: pos.x, oy: pos.y, x: pos.x, y: pos.y, number: numbered.find((q) => q.place.id === p.id).number };
    });
    spreadBadges(dots, 19, { x0: 24, x1: CARD_W - 24, y0: CONTENT_TOP - 6, y1: box.mapBottom + 10 });
  }

  // উপজেলার আকৃতি
  ctx.save();
  ctx.translate(box.ox, box.oy);
  ctx.scale(box.s, box.s);
  for (const u of UPAZILA_SHAPES) {
    const path = new Path2D(u.path);
    ctx.fillStyle = visitedUpazilas.has(u.id) ? COLORS.green : COLORS.beige;
    ctx.fill(path);
    ctx.lineWidth = 3 / box.s;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COLORS.bg;
    ctx.stroke(path);
  }
  ctx.restore();

  // উপজেলার নাম: কোনো বিন্দু বা লেখার ওপর পড়লে বাদ
  const busyRects = [];
  if (namesMode) {
    dots.forEach((d) => busyRects.push(circleRect(d.x, d.y, 24)));
    labels.forEach((l) => busyRects.push(l.rect));
  } else {
    dots.forEach((d) => busyRects.push(circleRect(d.x, d.y, 26)));
  }
  setFont(ctx, 500, 26, SANS);
  ctx.textAlign = 'center';
  for (const u of showUpazilaNames ? UPAZILA_SHAPES : []) {
    const nudge = LABEL_NUDGE[u.id] || [0, 0];
    const cx = box.ox + (u.labelX + nudge[0]) * box.s;
    const cy = box.oy + (u.labelY + nudge[1]) * box.s;
    const w = ctx.measureText(u.name).width;
    const rect = { x0: cx - w / 2 - 6, x1: cx + w / 2 + 6, y0: cy - 26, y1: cy + 10 };
    if (busyRects.some((r) => rectsIntersect(r, rect))) continue;
    ctx.fillStyle = visitedUpazilas.has(u.id) ? COLORS.onGreen : COLORS.muted;
    ctx.fillText(u.name, cx, cy);
  }

  if (namesMode) {
    // দূরে বসা নামের জন্য ছোট টানা রেখা
    ctx.lineCap = 'round';
    for (const l of labels) {
      if (!l.leader) continue;
      ctx.beginPath();
      ctx.moveTo(l.leader.x0, l.leader.y0);
      ctx.lineTo(l.leader.x1, l.leader.y1);
      ctx.lineWidth = 6;
      ctx.strokeStyle = COLORS.halo;
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = COLORS.white;
      ctx.stroke();
    }
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.red;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = COLORS.white;
      ctx.stroke();
    }
    setFont(ctx, 600, labelFont, SANS);
    for (const l of labels) drawHaloText(ctx, l.text, l.x, l.y, l.align, COLORS);
  } else {
    // টানা রেখা (আসল অবস্থান থেকে সরে গেলে), তারপর ছোট বিন্দু, তারপর নম্বর
    for (const d of dots) {
      if (Math.hypot(d.x - d.ox, d.y - d.oy) > 6) {
        ctx.beginPath();
        ctx.moveTo(d.ox, d.oy);
        ctx.lineTo(d.x, d.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.leader;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(d.ox, d.oy, 5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.red;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.white;
        ctx.stroke();
      }
    }
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 19, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.red;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = COLORS.white;
      ctx.stroke();
      setFont(ctx, 700, 22, SERIF);
      ctx.fillStyle = COLORS.white;
      ctx.textAlign = 'center';
      ctx.fillText(toBn(d.number), d.x, d.y + 8);
    }
    // নামের তালিকা
    const colW = (CARD_W - 2 * M) / listLayout.cols;
    selected.forEach((p, i) => {
      const col = Math.floor(i / listLayout.rows);
      const row = i % listLayout.rows;
      const x = M + col * colW;
      const y = listLayout.listTop + row * listLayout.rowH + listLayout.fontSize + 2;
      const label = `${toBn(i + 1)}.`;
      const labelW = measureMixed(ctx, label, 700, listLayout.fontSize);
      ctx.fillStyle = COLORS.red;
      drawMixed(ctx, label, x, y, 'left', 700, listLayout.fontSize);
      setFont(ctx, 500, listLayout.fontSize, SANS);
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(fitText(ctx, p.short, colW - labelW - 22), x + labelW + 8, y);
    });
  }

  if (namesMode && namesLayout.unpinnedLines.length) {
    setFont(ctx, 400, 26, SANS);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.muted;
    namesLayout.unpinnedLines.forEach((line, i) => {
      ctx.fillText(line, M, box.mapBottom + 14 + 26 + i * 34);
    });
  }

  // ---------- অগ্রগতির বার ----------
  const barY = CONTENT_BOTTOM - PROGRESS_H + 6;
  roundRectPath(ctx, M, barY, CARD_W - 2 * M, 16, 8);
  ctx.fillStyle = COLORS.beige;
  ctx.fill();
  if (percent > 0) {
    const fillW = Math.max(16, ((CARD_W - 2 * M) * percent) / 100);
    roundRectPath(ctx, M, barY, fillW, 16, 8);
    ctx.fillStyle = COLORS.green;
    ctx.fill();
  }

  const leftText = `${toBn(percent)}% শেরপুর ঘোরা হয়েছে`;
  const rightText = `${toBn(selCount)}টি স্থান · ${toBn(UPAZILAS.length)}টির মধ্যে ${toBn(visitedUpazilas.size)}টি উপজেলা`;
  const textY = barY + 16 + 50;
  ctx.fillStyle = COLORS.greenDark;
  drawMixed(ctx, leftText, M, textY, 'left', 700, 40);
  const leftW = measureMixed(ctx, leftText, 700, 40);
  let rightSize = 28;
  while (rightSize > 20 && measureMixed(ctx, rightText, 400, rightSize) > CARD_W - 2 * M - leftW - 30) {
    rightSize -= 1;
  }
  ctx.fillStyle = COLORS.muted;
  drawMixed(ctx, rightText, CARD_W - M, textY, 'right', 400, rightSize);

  // ---------- নিচের ব্র্যান্ড ----------
  ctx.beginPath();
  ctx.moveTo(M, 1240);
  ctx.lineTo(CARD_W - M, 1240);
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.line;
  ctx.stroke();

  setFont(ctx, 700, 40, SANS);
  const brand = 'Khuji Sherpur';
  const brandW = ctx.measureText(brand).width;
  setFont(ctx, 400, 36, SANS);
  const urlText = ' · khujisherpur.com';
  const urlW = ctx.measureText(urlText).width;
  const startX = (CARD_W - brandW - urlW) / 2;
  ctx.textAlign = 'left';
  setFont(ctx, 700, 40, SANS);
  ctx.fillStyle = COLORS.greenDark;
  ctx.fillText(brand, startX, 1298);
  setFont(ctx, 400, 36, SANS);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(urlText, startX + brandW, 1298);

  setFont(ctx, 400, 20, SANS);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.faint;
  ctx.fillText(MAP_CREDIT, CARD_W / 2, 1334);

  return canvas;
}
