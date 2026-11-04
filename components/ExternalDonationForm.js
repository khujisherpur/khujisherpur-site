'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ExternalDonationForm({ userId, onSaved }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function save() {
    if (!date) return alert('তারিখ দিন');
    if (date > today) return alert('ভবিষ্যতের তারিখ দেওয়া যাবে না');
    setBusy(true);
    const { error } = await supabase.from('blood_donations').insert({
      donor_user_id: userId,
      blood_request_id: null,
      is_external: true,
      donated_at: new Date(date + 'T12:00:00').toISOString(),
    });
    setBusy(false);
    if (error) return alert('সেভ করা যায়নি: ' + error.message);
    setDate('');
    setOpen(false);
    onSaved();
  }

  return (
    <section className="bg-white border border-ink/10 rounded-xl p-3 mt-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full text-sm text-red-600 font-semibold py-1">
          ➕ সাইটের বাইরে দেওয়া রক্তদান যোগ করুন
        </button>
      ) : (
        <div>
          <p className="text-sm font-medium mb-2">কবে রক্ত দিয়েছিলেন?</p>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={save}
              disabled={busy}
              className="bg-red-500 text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              সেভ করুন
            </button>
            <button onClick={() => setOpen(false)} className="border border-ink/20 text-sm py-2.5 rounded-lg">
              বাতিল
            </button>
          </div>
          <p className="text-[11px] text-ink/50 mt-2">
            এটা শুধু ৯০ দিনের টাইমার ও আপনার মোট দানে গোনা হবে। লিডারবোর্ডে গোনা হবে না।
          </p>
        </div>
      )}
    </section>
  );
}
