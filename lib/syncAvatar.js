import { supabase } from './supabaseClient';

// ছবি ছোট করে (৪০০×৪০০, ~১০০ KB)
async function shrink(blob, maxSide = 400, targetKB = 100) {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const toBlob = (q) => new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));
    let q = 0.85;
    let out = await toBlob(q);
    while (out && out.size > targetKB * 1024 && q > 0.4) {
      q -= 0.1;
      out = await toBlob(q);
    }
    return out || blob;
  } catch (e) {
    return blob;
  }
}

function pathFromUrl(publicUrl) {
  if (!publicUrl) return null;
  const idx = publicUrl.indexOf('/images/');
  return idx === -1 ? null : publicUrl.slice(idx + '/images/'.length);
}

// প্রোফাইলের ছবির আলাদা কপি অ্যাকাউন্টের ছবি হিসেবে বসায়।
// ব্যর্থ হলেও প্রোফাইল সেভে কোনো সমস্যা হয় না (শান্তভাবে ব্যর্থ হয়)।
export async function syncAccountAvatar(userId, blob) {
  try {
    const small = await shrink(blob);
    const path = `${userId}/avatar-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from('images')
      .upload(path, small, { contentType: 'image/jpeg' });
    if (upErr) return false;

    const { data: pub } = supabase.storage.from('images').getPublicUrl(path);
    const { data: before } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const { data: updated, error: err } = await supabase
      .from('users')
      .update({ avatar_url: pub.publicUrl })
      .eq('id', userId)
      .select('id');
    if (err || !updated || updated.length === 0) {
      await supabase.storage.from('images').remove([path]);
      return false;
    }

    const oldPath = pathFromUrl(before?.avatar_url);
    if (oldPath) await supabase.storage.from('images').remove([oldPath]);
    return true;
  } catch (e) {
    return false;
  }
}
