export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone, toBn } from '../../../lib/format';
import { formatBloodDate } from '../../../lib/bloodFormat';
import SiteHeader from '../../../components/SiteHeader';
import MessageButton from '../../../components/MessageButton';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;

const getRequest = cache(async (id) => {
  if (typeof id !== 'string' || !UUID_RE.test(id)) return null;
  const { data } = await supabase
    .from('blood_requests')
    .select('id, user_id, blood_group, bags_needed, hospital_or_area, patient_name, patient_problem, hemoglobin, donation_date, donation_time, applicant_name, relation_to_patient, note, contact_phone, alt_phone, status, created_at')
    .eq('id', id)
    .maybeSingle();
  return data || null;
});

export async function generateMetadata({ params }) {
  const request = await getRequest(params.id);
  const robots = { index: false, follow: false };
  if (!request) return { title: 'পাওয়া যায়নি — খুঁজি শেরপুর', robots };
  return {
    title: `${request.blood_group} রক্ত প্রয়োজন — খুঁজি শেরপুর`,
    description: 'শেরপুরে জরুরি রক্তের অনুরোধ।',
    robots,
  };
}

function Row({ label, children }) {
  return (
    <div>
      <p className="text-ink/50">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export default async function BloodRequestDetailPage({ params }) {
  if (typeof params.id !== 'string' || !UUID_RE.test(params.id)) notFound();

  const request = await getRequest(params.id);

  if (!request) {
    return (
      <>
        <SiteHeader lang="bn" simple />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">এই অনুরোধটি খুঁজে পাওয়া যায়নি।</p>
          <a href="/blood" className="text-green underline mt-2 inline-block">ব্লাড পেজে ফিরে যান</a>
        </main>
      </>
    );
  }

  const tooOld = Date.now() - new Date(request.created_at).getTime() > EXPIRY_MS;
  const isActive = request.status === 'active' && !tooOld;
  const statusLabel = request.status === 'fulfilled' ? 'পূরণ হয়েছে' : 'মেয়াদ শেষ';

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 pb-16">
        <a href="/blood" className="inline-block mt-5 text-sm text-ink/50 hover:text-ink">← ব্লাড পেজে ফিরে যান</a>

        <div className="bg-white border-2 border-red-200 rounded-2xl mt-4 overflow-hidden">
          <div className="bg-red-500 text-white px-5 py-3">
            <h1 className="font-semibold text-lg">🩸 জরুরি রক্তের অনুরোধ</h1>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-red-500">{request.blood_group}</span>
              <div>
                <p className="font-semibold text-lg">{toBn(request.bags_needed)} ব্যাগ রক্ত প্রয়োজন</p>
                {!isActive && (
                  <span className="inline-block text-xs bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full mt-1">
                    {statusLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-ink/10 space-y-3 text-sm">
              {isActive && request.patient_problem && (
                <Row label="রোগীর সমস্যা">{request.patient_problem}</Row>
              )}
              <Row label="রক্তের গ্রুপ">{request.blood_group}</Row>
              {request.hemoglobin && <Row label="হিমোগ্লোবিন">{request.hemoglobin}</Row>}
              <Row label="রক্তের পরিমাণ">{toBn(request.bags_needed)} ব্যাগ</Row>
              {request.donation_date && (
                <Row label="রক্তদানের তারিখ">{formatBloodDate(request.donation_date, 'bn')}</Row>
              )}
              {request.donation_time && <Row label="রক্তদানের সময়">{request.donation_time}</Row>}
              <Row label="জায়গা">{request.hospital_or_area}</Row>
              {isActive && request.patient_name && <Row label="রোগীর নাম">{request.patient_name}</Row>}
              {isActive && (
                <Row label="আবেদনকারী">{request.applicant_name} ({request.relation_to_patient})</Row>
              )}
              {isActive && (
                <Row label="ফোন"><span className="font-numeric">{request.contact_phone}</span></Row>
              )}
              {isActive && request.note && (
                <Row label="নোট"><span className="font-normal whitespace-pre-line">{request.note}</span></Row>
              )}
            </div>

            {isActive && (
              <div className="mt-6 space-y-2">
                <a
                  href={`tel:${cleanPhone(request.contact_phone)}`}
                  className="block text-center bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors"
                >
                  📞 কল করুন: <span className="font-numeric">{request.contact_phone}</span>
                </a>
                {request.alt_phone && (
                  <a
                    href={`tel:${cleanPhone(request.alt_phone)}`}
                    className="block text-center border border-ink/20 py-3 rounded-xl hover:bg-paper transition-colors"
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
        </div>
      </main>
    </>
  );
}
