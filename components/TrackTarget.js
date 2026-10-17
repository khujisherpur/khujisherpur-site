'use client';
import { useEffect } from 'react';

// এই পেজটি কোন পোস্ট/প্রোফাইলের, তা ট্র্যাকারকে জানায় (কিছুই দেখায় না)
export default function TrackTarget({ type, id }) {
  useEffect(() => {
    window.__trackTarget = { type, id };
    return () => {
      if (window.__trackTarget && window.__trackTarget.id === id) window.__trackTarget = null;
    };
  }, [type, id]);
  return null;
}
