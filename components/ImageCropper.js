'use client';
import { useRef, useState, useEffect } from 'react';

const OUTPUT_SIZE = 800;
const TARGET_BYTES = 400 * 1024;
const BOX_SIZE = 280;

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

async function compressToTarget(canvas) {
  let quality = 0.9;
  let blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  while (blob.size > TARGET_BYTES && quality > 0.4) {
    quality -= 0.1;
    blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  }
  return blob;
}

export default function ImageCropper({ file, onCancel, onComplete }) {
  const [img, setImg] = useState(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const bScale = Math.max(BOX_SIZE / image.width, BOX_SIZE / image.height);
      setBaseScale(bScale);
      setImg(image);
      setZoom(1);
      setPos({
        x: (BOX_SIZE - image.width * bScale) / 2,
        y: (BOX_SIZE - image.height * bScale) / 2,
      });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clampPos(p, scale) {
    if (!img) return p;
    const w = img.width * scale;
    const h = img.height * scale;
    return {
      x: clamp(p.x, BOX_SIZE - w, 0),
      y: clamp(p.y, BOX_SIZE - h, 0),
    };
  }

  function handlePointerDown(e) {
    dragState.current = { startX: e.clientX, startY: e.clientY, origPos: pos };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const scale = baseScale * zoom;
    const newPos = {
      x: dragState.current.origPos.x + dx,
      y: dragState.current.origPos.y + dy,
    };
    setPos(clampPos(newPos, scale));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  // জুম বদলালে বক্সের কেন্দ্রবিন্দুকে স্থির রেখে (চার দিক থেকে সমানভাবে) বড়/ছোট করে
  function handleZoomChange(e) {
    if (!img) return;
    const newZoom = parseFloat(e.target.value);
    const oldScale = baseScale * zoom;
    const newScale = baseScale * newZoom;

    const center = BOX_SIZE / 2;
    const imgPointX = (center - pos.x) / oldScale;
    const imgPointY = (center - pos.y) / oldScale;

    const newPos = {
      x: center - imgPointX * newScale,
      y: center - imgPointY * newScale,
    };

    setZoom(newZoom);
    setPos(clampPos(newPos, newScale));
  }

  async function handleConfirm() {
    if (!img) return;
    setSaving(true);
    const scale = baseScale * zoom;

    const cropX = -pos.x / scale;
    const cropY = -pos.y / scale;
    const cropSize = BOX_SIZE / scale;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const blob = await compressToTarget(canvas);
    setSaving(false);
    onComplete(blob);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-5 max-w-sm w-full">
        <p className="text-sm font-medium mb-1">ছবি সমন্বয় করুন</p>
        <p className="text-xs text-ink/50 mb-3">টেনে সরান বা স্লাইডার দিয়ে জুম করুন</p>

        <div
          className="mx-auto overflow-hidden bg-ink/5 touch-none select-none relative rounded-full"
          style={{ width: BOX_SIZE, height: BOX_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {img && (
            <img
              src={img.src}
              draggable={false}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: img.width * baseScale * zoom,
                height: img.height * baseScale * zoom,
                cursor: 'grab',
                touchAction: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none border-2 border-marigold rounded-full" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-ink/50">🔍</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={handleZoomChange}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-ink/20 py-2 text-sm hover:bg-paper"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !img}
            className="flex-1 bg-marigold text-ink font-semibold py-2 text-sm hover:bg-marigold/90 disabled:opacity-50"
          >
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
