'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MessagesLink({ lang = 'bn' }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid) return;
      const { data: rows } = await supabase
        .from('conversations')
        .select('owner_id, owner_unread, starter_unread')
        .or(`owner_id.eq.${uid},starter_id.eq.${uid}`);
      const n = (rows || []).reduce(
        (s, r) => s + (r.owner_id === uid ? r.owner_unread : r.starter_unread),
        0
      );
      setUnread(n);
    })();
  }, []);

  return (
    <a
      href="/dashboard/messages"
      className="col-span-2 bg-white border border-ink/10 rounded-xl p-3 flex items-center gap-2.5 active:bg-paper"
    >
      <span className="w-9 h-9 rounded-lg bg-[#EEF1F8] flex items-center justify-center flex-shrink-0">💬</span>
      <span className="text-sm font-medium leading-tight">{lang === 'bn' ? 'আমার বার্তা' : 'My Messages'}</span>
      {unread > 0 && (
        <span className="ml-auto bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {unread} {lang === 'bn' ? 'নতুন' : 'new'}
        </span>
      )}
    </a>
  );
}
