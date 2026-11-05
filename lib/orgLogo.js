const BUCKET = 'images';

export function logoPathFromUrl(url) {
  const m = String(url || '').split(`/object/public/${BUCKET}/`)[1];
  return m ? decodeURIComponent(m.split('?')[0]) : null;
}

// ছবি ছোট করে JPEG বানায়; না পারলে null
export async function compressImage(file, maxSide = 400, maxBytes = 50 * 1024) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    if (!img.width || !img.height) return null;
    let side = maxSide;
    for (let round = 0; round < 6; round++) {
      const scale = Math.min(1, side / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      for (const q of [0.85, 0.7, 0.55, 0.4]) {
        const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));
        if (blob && blob.size <= maxBytes) return blob;
      }
      side = Math.round(side * 0.8);
    }
    return null;
  } catch (e) {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// নিজের ফোল্ডারের সব লোগো মুছে দেয়, শুধু keepPath বাদে
export async function removeOtherLogos(supabase, userId, keepPath, oldUrl) {
  try {
    const dir = `org-logos/${userId}`;
    const names = new Set();
    const { data } = await supabase.storage.from(BUCKET).list(dir, { limit: 100 });
    (data || []).forEach((f) => {
      if (f.name && !f.name.startsWith('.')) names.add(`${dir}/${f.name}`);
    });
    const old = logoPathFromUrl(oldUrl);
    if (old && old.startsWith(dir + '/')) names.add(old);
    if (keepPath) names.delete(keepPath);
    if (names.size) await supabase.storage.from(BUCKET).remove([...names]);
  } catch (e) {}
}
