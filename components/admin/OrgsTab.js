'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function OrgsTab() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from('blood_orgs')
      .select('id, name, address, upazila, phone, is_approved, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) alert('লোড করা যায়নি: ' + error.message);
    setOrgs(data || []);
    setLoading(false);
  }

  async function setApproval(id, approve) {
    if (!approve && !confirm('এই সংস্থাকে তালিকা থেকে সরাতে চান?')) return;
    setBusyId(id);
    const { error } = await supabase.rpc('approve_blood_org', { org_id: id, approve });
    setBusyId(null);
    if (error) {
      alert('বদলানো যায়নি: ' + error.message);
      return;
    }
    load();
  }

  const pending = orgs.filter((o) => !o.is_approved);
  const approved = orgs.filter((o) => o.is_approved);
  const shown = filter === 'pending' ? pending : approved;

  if (loading) return <p className="text-sm text-ink/50">লোড হচ্ছে...</p>;

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">রক্ত সংস্থা ব্যবস্থাপনা</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('pending')}
          className={`text-sm px-3 py-1.5 rounded-full border ${filter === 'pending' ? 'bg-green text-white border-green' : 'border-ink/20'}`}
        >
          অপেক্ষমাণ ({pending.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`text-sm px-3 py-1.5 rounded-full border ${filter === 'approved' ? 'bg-green text-white border-green' : 'border-ink/20'}`}
        >
          অনুমোদিত ({approved.length})
        </button>
      </div>

      {shown.length === 0 && (
        <p className="text-sm text-ink/50 bg-white border border-ink/10 p-4">
          {filter === 'pending' ? 'কোনো অপেক্ষমাণ সংস্থা নেই।' : 'কোনো অনুমোদিত সংস্থা নেই।'}
        </p>
      )}

      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o.id} className="bg-white border border-ink/10 p-3">
            <p className="font-medium">{o.name}</p>
            <p className="text-xs text-ink/60 mt-1">📍 {[o.address, o.upazila].filter(Boolean).join(', ')}</p>
            <p className="text-xs text-ink/60 mt-0.5">📞 {o.phone}</p>
            <div className="flex gap-2 mt-3">
              {!o.is_approved ? (
                <button
                  onClick={() => setApproval(o.id, true)}
                  disabled={busyId === o.id}
                  className="text-xs bg-green text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                >
                  ✅ অনুমোদন
                </button>
              ) : (
                <button
                  onClick={() => setApproval(o.id, false)}
                  disabled={busyId === o.id}
                  className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-md disabled:opacity-50"
                >
                  তালিকা থেকে সরান
                </button>
              )}
              <a href={`tel:${o.phone}`} className="text-xs border border-ink/20 px-3 py-1.5 rounded-md">
                📞 কল
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
