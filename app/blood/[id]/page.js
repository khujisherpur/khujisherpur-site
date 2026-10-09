export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone } from '../../../lib/format';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;

const getRequest = cache(async (id) => {
  if (typeof id !== 'string' || !UUID_RE.test(id)) return null;
  const { data } = await supabase
    .from('blood_requests')
    .select('id, blood_group, bags_needed, hospital_or_area, patient_name, applicant_name, relation_to_patient, note, contact_phone, alt_phone, status, created_at')
    .eq('id', id)
    .maybeSingle();
  return data || null;
});

export async function generateMetadata({ params }) {
  const request = await getRequest(params.id);
  // ব্যক্তিগত ফোন নম্বর থাকে, তাই এই পাতা সার্চ ইঞ্জিনে যাবে না
  const robots = { index: false, follow: false };
  if (!request) return { title: 'পাওয়া যায়নি — খুঁজি শেরপুর', robots };
  return {
    title: `${request.blood_group} রক্ত প্রয়োজন — খুঁজি শেরপুর`,
    description: 'শেরপুরে জরুরি রক্তের অনুরোধ।',
    robots,
  };
}

export default async function BloodRequestDetailPage({ params }) {
  // ভুল/অদ্ভুত ঠিকানা ডাটাবেসে না গিয়েই ৪০৪
  if (typeof params.id !== 'string' || !UUID_RE.test(params.id)) notFound();

  const request = await getRequest(params.id);

  if (!request) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">এই অনুরোধটি খুঁজে পাওয়া যায়নি।</p>
        <a href="/blood" className="text-green underline mt-2 inline-block">ব্লাড পেজে ফিরে যান</a>
      </main>
    );
  }

  // ৭ দিনের বেশি পুরোনো অনুরোধ সক্রিয় থাকলেও মেয়াদ-শেষ ধরা হবে
  const tooOld = Date.now() - new Date(request.created_at).getTime() > EXPIRY_MS;
  const isActive = request.status === 'active' && !tooOld;
  const statusLabel = request.status === 'fulfilled' ? 'পূরণ হয়েছে' : 'মেয়াদ শেষ';

  return (
    <main className="max-w-2xl mx-auto px-4">
      <header className="flex items-center justify-between py-6">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" /></a>
      </header>

      <a href="/blood" className="text-sm text-ink/50 hover:text-ink">← ব্লাড পেজে ফিরে যান</a>

      <div className="bg-white border-2 border-red-200 mt-4 p-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold text-red-500">{request.blood_group}</span>
          <div>
            <p className="font-semibold text-lg">{request.bags_needed} ব্যাগ রক্ত প্রয়োজন</p>
            {!isActive && (
              <span className="inline-block text-xs bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full mt-1">
                {statusLabel}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-ink/10 space-y-3 text-sm">
          <div>
            <p className="text-ink/50">স্থান</p>
            <p className="font-medium">{request.hospital_or_area}</p>
          </div>
          {/* রোগী ও আবেদনকারীর তথ্য শুধু সক্রিয় অনুরোধে দেখানো হয় */}
          {isActive && request.patient_name && (
            <div>
              <p className="text-ink/50">রোগীর নাম</p>
              <p className="font-medium">{request.patient_name}</p>
            </div>
          )}
          {isActive && (
            <div>
              <p className="text-ink/50">আবেদনকারী</p>
              <p className="font-medium">{request.applicant_name} ({request.relation_to_patient})</p>
            </div>
          )}
          {isActive && request.note && (
            <div>
              <p className="text-ink/50">নোট</p>
              <p>{request.note}</p>
            </div>
          )}
        </div>

        {isActive && (
          <div className="mt-6 space-y-2">
            <a
              href={`tel:${cleanPhone(request.contact_phone)}`}
              className="block text-center bg-red-500 text-white font-semibold py-2.5 hover:bg-red-600 transition-colors"
            >
              📞 কল করুন: <span className="font-numeric">{request.contact_phone}</span>
            </a>
            {request.alt_phone && (
              <a
                href={`tel:${cleanPhone(request.alt_phone)}`}
                className="block text-center border border-ink/20 py-2.5 hover:bg-paper transition-colors"
              >
                📞 বিকল্প নম্বর: <span className="font-numeric">{request.alt_phone}</span>
              </a>
            )}
          </div>
        )}

        {!isActive && (
          <p className="mt-6 text-xs text-ink/45">
            গোপনীয়তার জন্য এই অনুরোধের নাম ও ফোন নম্বর আর দেখানো হচ্ছে না।
          </p>
        )}
      </div>
    </main>
  );
}
