'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

let mineP = null;
function getMyOrgId() {
  if (!mineP) {
    mineP = supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!data.user) return null;
        const { data: o } = await supabase
          .from('blood_orgs')
          .select('id')
          .eq('owner_user_id', data.user.id)
          .maybeSingle();
        return o ? o.id : null;
      })
      .catch(() => null);
  }
  return mineP;
}

export default function OrgEditButton({ orgId, className = '', label = '✏️ এডিট' }) {
  const [mine, setMine] = useState(false);

  useEffect(() => {
    let alive = true;
    getMyOrgId().then((id) => {
      if (alive) setMine(id === orgId);
    });
    return () => {
      alive = false;
    };
  }, [orgId]);

  if (!mine) return null;
  return (
    <a href="/blood/org" className={className}>
      {label}
    </a>
  );
}
