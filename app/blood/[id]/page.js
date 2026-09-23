export const runtime = 'edge';
import { supabase } from '../../../lib/supabaseClient';

export default async function BloodRequestDetailPage({ params }) {
  const { data: request } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!request) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">এই অনুরোধটি খুঁজে পাওয়া যায়নি।</p>
        <a href="/blood" className="text-green underline mt-2 inline-block">ব্লাড পেজে ফিরে যান</a>
      </main>
    );
  }

  const isActive = request.status === 'active';

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
                {request.status === 'fulfilled' ? 'পূরণ হয়েছে' : 'মেয়াদ শেষ'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-ink/10 space-y-3 text-sm">
          <div>
            <p className="text-ink/50">স্থান</p>
            <p className="font-medium">{request.hospital_or_area}</p>
          </div>
          {request.patient_name && (
            <div>
              <p className="text-ink/50">রোগীর নাম</p>
              <p className="font-medium">{request.patient_name}</p>
            </div>
          )}
          <div>
            <p className="text-ink/50">আবেদনকারী</p>
            <p className="font-medium">{request.applicant_name} ({request.relation_to_patient})</p>
          </div>
          {request.note && (
            <div>
              <p className="text-ink/50">নোট</p>
              <p>{request.note}</p>
            </div>
          )}
        </div>

        {isActive && (
          <div className="mt-6 space-y-2">
            <a
              href={`tel:${request.contact_phone}`}
              className="block text-center bg-red-500 text-white font-semibold py-2.5 hover:bg-red-600 transition-colors"
            >
              📞 কল করুন: <span className="font-numeric">{request.contact_phone}</span>
            </a>
            {request.alt_phone && (
              <a
                href={`tel:${request.alt_phone}`}
                className="block text-center border border-ink/20 py-2.5 hover:bg-paper transition-colors"
              >
                📞 বিকল্প নম্বর: <span className="font-numeric">{request.alt_phone}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
