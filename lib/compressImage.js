// ছবি ছোট করে JPEG বানায়: সর্বোচ্চ maxSide পিক্সেল, সর্বোচ্চ maxKB
export async function compressImage(blob, maxSide = 1000, maxKB = 200) {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    const toBlob = (q) =>
      new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));

    let quality = 0.85;
    let out = await toBlob(quality);
    while (out && out.size > maxKB * 1024 && quality > 0.4) {
      quality -= 0.1;
      out = await toBlob(quality);
    }
    // ছোট করা না গেলে বা আগেরটাই ছোট হলে আসল ছবি রাখি
    if (!out || out.size >= blob.size) return blob;
    return out;
  } catch (e) {
    console.error('compress error', e);
    return blob;
  }
}
