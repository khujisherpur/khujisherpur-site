'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const groups = [
  {
    title: 'হোমপেজ',
    icon: '🏠',
    fields: [
      {
        key: 'tagline',
        label: 'হিরো উপশিরোনাম',
        type: 'textarea',
        placeholder: 'বাসা ভাড়া, চাকরি, নাকি বিশ্বস্ত মিস্ত্রি — যা দরকার সবই পাবেন এখানে।',
        hint: 'ফাঁকা রাখলে ডিফল্ট লেখা দেখাবে। এটা বাংলা ও ইংরেজি দুই ভাষাতেই একই দেখাবে।',
      },
    ],
  },
  {
    title: 'যোগাযোগ',
    icon: '📞',
    fields: [
      { key: 'contact_phone', label: 'ফোন নম্বর', type: 'tel', placeholder: '01XXXXXXXXX' },
      { key: 'contact_email', label: 'ইমেইল', type: 'email', placeholder: 'info@example.com' },
      { key: 'facebook_url', label: 'ফেসবুক পেজ লিংক', type: 'url', placeholder: 'https://facebook.com/...' },
    ],
  },
  {
    title: 'ফুটার',
    icon: '📝',
    fields: [
      {
        key: 'footer_text',
        label: 'ফুটারের লেখা',
        type: 'text',
        placeholder: '© ২০২৬ খুঁজি শেরপুর',
        hint: 'ফাঁকা রাখলে ডিফল্ট কপিরাইট লেখা দেখাবে।',
      },
    ],
  },
];

const allKeys = [
  ...groups.flatMap((g) => g.fields.map((f) => f.key)),
  'auto_approve_posts',
  'maintenance_mode',
  'maintenance_message',
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-green' : 'bg-ink/20'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export default function SettingsTab() {
  const [saved, setSaved] = useState({});
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('site_settings').select('key, value');
    if (err) {
      setError('সেটিংস লোড করা যায়নি: ' + err.message);
      setLoading(false);
      return;
    }
    const map = {};
    allKeys.forEach((k) => (map[k] = ''));
    (data || []).forEach((r) => (map[r.key] = r.value ?? ''));
    setSaved(map);
    setValues(map);
    setLoading(false);
  }

  const changedKeys = useMemo(
    () => allKeys.filter((k) => (values[k] ?? '') !== (saved[k] ?? '')),
    [values, saved]
  );

  function setField(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    const fb = (values.facebook_url || '').trim();
    if (fb && !/^https?:\/\//i.test(fb)) {
      alert('ফেসবুক লিংক http:// বা https:// দিয়ে শুরু হতে হবে');
      return;
    }
    setSaving(true);
    const rows = changedKeys.map((k) => ({
      key: k,
      value: (values[k] ?? '').toString().trim(),
      updated_at: new Date().toISOString(),
    }));
    const { error: err } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (err) {
      alert('সেভ করা যায়নি: ' + err.message);
      return;
    }
    setToast('সেটিংস সেভ হয়েছে');
    load();
  }

  function reset() {
    setValues(saved);
  }

  if (loading) return <p className="text-center text-ink/50 text-sm py-10">লোড হচ্ছে...</p>;
  if (error) {
    return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>;
  }

  const autoApprove = values.auto_approve_posts === 'true';
  const maintenance = values.maintenance_mode === 'true';

  return (
    <div className="pb-24">
      <h2 className="text-lg font-medium mb-1">সাইট সেটিংস</h2>
      <p className="text-xs text-ink/50 mb-4">এখানকার পরিবর্তন সাইটে সাথে সাথে দেখা যাবে।</p>

      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.title} className="bg-white rounded-xl border border-ink/10 border-l-4 border-l-green p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#EEF1F8] flex items-center justify-center text-sm">{g.icon}</span>
              {g.title}
            </h3>
            <div className="space-y-3">
              {g.fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-ink/60 mb-1">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={values[f.key] || ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green resize-none"
                    />
                  ) : (
                    <input
                      type={f.type}
                      value={values[f.key] || ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green"
                    />
                  )}
                  {f.hint && <p className="text-[11px] text-ink/40 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="bg-white rounded-xl border border-ink/10 border-l-4 border-l-marigold p-4">
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#EEF1F8] flex items-center justify-center text-sm">🛡️</span>
            পোস্ট নিয়ন্ত্রণ
          </h3>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">অটো-অ্যাপ্রুভ</p>
              <p className="text-xs text-ink/50 mt-0.5">
                চালু থাকলে নতুন পোস্ট ও প্রোফাইল অ্যাডমিনের অনুমোদন ছাড়াই সাথে সাথে সাইটে দেখাবে।
              </p>
            </div>
            <Toggle checked={autoApprove} onChange={(v) => setField('auto_approve_posts', v ? 'true' : 'false')} />
          </div>
          {autoApprove && (
            <p className="text-xs text-marigold bg-marigold/10 rounded-lg px-3 py-2 mt-3">
              ⚠️ অটো-অ্যাপ্রুভ চালু। স্প্যাম বা ভুয়া পোস্ট এলে নিজে রিজেক্ট করতে হবে।
            </p>
          )}
        </section>
      </div>

<section className={`mt-4 bg-white rounded-xl border border-ink/10 border-l-4 p-4 ${maintenance ? 'border-l-red-500' : 'border-l-ink/20'}`}>
        <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#EEF1F8] flex items-center justify-center text-sm">🛠️</span>
          মেইনটেন্যান্স মোড
        </h3>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">সাইট সাময়িক বন্ধ রাখুন</p>
            <p className="text-xs text-ink/50 mt-0.5">
              চালু থাকলে সবাই রক্ষণাবেক্ষণের পেজ দেখবে। অ্যাডমিন পেজ ও লগইন খোলা থাকবে।
            </p>
          </div>
          <Toggle checked={maintenance} onChange={(v) => setField('maintenance_mode', v ? 'true' : 'false')} />
        </div>
        <div className="mt-3">
          <label className="block text-xs text-ink/60 mb-1">দর্শককে দেখানোর বার্তা (ঐচ্ছিক)</label>
          <textarea
            rows={2}
            value={values.maintenance_message || ''}
            onChange={(e) => setField('maintenance_message', e.target.value)}
            placeholder="যেমন: আজ রাত ১০টা পর্যন্ত কাজ চলবে।"
            className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green resize-none"
          />
        </div>
        {maintenance && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">
            ⚠️ সেভ করলেই সাইট সবার জন্য বন্ধ হয়ে যাবে।
          </p>
        )}
      </section>
      {/* Sticky save bar */}
      {changedKeys.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink/10 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-3 md:pl-64">
          <p className="text-sm text-ink/60 flex-1">{changedKeys.length}টি পরিবর্তন সেভ হয়নি</p>
          <button onClick={reset} disabled={saving} className="text-sm border border-ink/20 px-4 py-2 rounded-lg">
            বাতিল
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="text-sm bg-green text-white font-medium px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
