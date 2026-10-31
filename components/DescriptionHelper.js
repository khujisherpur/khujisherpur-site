'use client';
import { minCharsFor } from '../lib/descriptionCheck';

const toBn = (n) => Number(n).toLocaleString('bn-BD');

const CONTENT = {
  service: {
    label: 'আপনার পরিচয় ও কাজের বিবরণ',
    tips: [
      'আপনি কী কাজ করেন ও কোন কাজগুলো ভালো পারেন',
      'কত বছরের অভিজ্ঞতা আছে',
      'কোন কোন এলাকায় সেবা দেন',
      'কেন আপনাকে ডাকবেন (যেমন: সময়মতো কাজ, ন্যায্য মজুরি)',
    ],
    placeholder:
      'যেমন: আমি রহিম, শেরপুরে ৫ বছর ধরে ইলেকট্রিশিয়ানের কাজ করছি। বাড়ির ওয়্যারিং, ফ্যান-লাইট ও মিটারের কাজ ভালো পারি। শেরপুর সদর ও আশপাশে সেবা দিই। সময়মতো কাজ ও ন্যায্য মজুরি আমার অঙ্গীকার।',
  },
  teacher: {
    label: 'আপনার পরিচয় ও পড়ানোর বিবরণ',
    tips: [
      'কোন বিষয় ও কোন ক্লাস পড়ান',
      'আপনার পড়াশোনা ও পড়ানোর অভিজ্ঞতা',
      'কীভাবে পড়ান (যেমন: সহজ ভাষায়, নিয়মিত পরীক্ষা নিয়ে)',
      'কোন এলাকায় ও কোন সময়ে পড়ান',
    ],
    placeholder:
      'যেমন: আমি করিম, শেরপুর সরকারি কলেজ থেকে গণিতে পড়াশোনা করেছি। ৩ বছর ধরে ৬ষ্ঠ থেকে ১০ম শ্রেণির শিক্ষার্থীদের পড়াই। সহজ ভাষায় বুঝিয়ে পড়াই ও নিয়মিত পরীক্ষা নিই। বিকেল ও সন্ধ্যায় পড়ানোর সময় আছে।',
  },
  ambulance: {
    label: 'আপনার সেবার বিবরণ',
    tips: [
      'গাড়ির অবস্থা ও কী কী সুবিধা আছে (যেমন: অক্সিজেন, ফ্রিজিং বক্স)',
      'কোন এলাকায় বা কতদূর পর্যন্ত যান',
      'ডাকলে কত সময়ে পৌঁছাতে পারেন',
      'কীভাবে যোগাযোগ করবেন',
    ],
    placeholder:
      'যেমন: আমার অ্যাম্বুলেন্সে অক্সিজেন ও স্ট্রেচার আছে। শেরপুর থেকে ময়মনসিংহ ও ঢাকা পর্যন্ত রোগী নিয়ে যাই। ফোন করলে শহরের ভেতরে ১৫ মিনিটে পৌঁছে যাই। জরুরি প্রয়োজনে সরাসরি ফোন করুন।',
  },
  rent: {
    label: 'বাসা বা দোকানের বিবরণ',
    tips: [
      'কোথায় (এলাকা ও আশপাশের পরিচিত জায়গা)',
      'কয়টা রুম ও কী কী সুবিধা (বিদ্যুৎ, পানি, গ্যাস, ছাদ ইত্যাদি)',
      'কাদের জন্য (পরিবার, ব্যাচেলর, ছাত্র, ব্যবসা) ও কবে থেকে খালি',
      'অগ্রিম ও অন্যান্য খরচ',
    ],
    placeholder:
      'যেমন: শেরপুর সদরে পুরাতন বাজারের কাছে দোতলায় ২ রুমের বাসা ভাড়া দেওয়া হবে। বিদ্যুৎ, পানি ও গ্যাসের সংযোগ আছে। ছোট পরিবারের জন্য উপযুক্ত। আগামী মাসের ১ তারিখ থেকে খালি। অগ্রিম ও অন্য খরচের কথা ফোনে জানাব।',
  },
  'buy-sell': {
    label: 'পণ্যের বিবরণ',
    tips: [
      'পণ্যের নাম, ব্র্যান্ড ও মডেল',
      'কতদিন ব্যবহার করা হয়েছে ও এখন কেমন অবস্থায় আছে',
      'কোনো সমস্যা বা মেরামতের কথা থাকলে সৎভাবে লিখুন',
      'কোথায় এসে দেখা বা নেওয়া যাবে',
    ],
    placeholder:
      'যেমন: স্যামসাং গ্যালাক্সি এ১৫ ফোন, ৬ মাস ব্যবহার করা। ডিসপ্লে ও ব্যাটারি ভালো আছে, বক্স ও চার্জার সঙ্গে দেব। শেরপুর সদরে এসে দেখে নিতে পারবেন।',
  },
  job: {
    label: 'কাজের বিবরণ',
    tips: [
      'কাজের মূল দায়িত্ব কী কী',
      'কোন যোগ্যতা বা অভিজ্ঞতা লাগবে',
      'কাজের সময় ও জায়গা',
      'কীভাবে আবেদন বা যোগাযোগ করবেন',
    ],
    placeholder:
      'যেমন: আমাদের দোকানের জন্য একজন সেলসম্যান নেওয়া হবে। গ্রাহকের সঙ্গে ভদ্র আচরণ, পণ্য বুঝিয়ে বিক্রি ও হিসাব রাখা কাজের অংশ। সকাল ৯টা থেকে রাত ৮টা পর্যন্ত কাজ। আগ্রহীরা ফোনে যোগাযোগ করুন।',
  },
};

function buildTemplate(kind, c) {
  const name = (c.name || '').trim() || 'আমি';
  const who = (c.name || '').trim() ? `আমি ${c.name.trim()}` : 'আমি';
  const subject = (c.subject || '').trim();
  const years = c.years ? String(c.years).trim() : '';
  const area = (c.area || '').trim();
  const areaText = area ? `${area} ও আশপাশের এলাকায়` : 'শেরপুরে';

  if (kind === 'teacher') {
    return (
      `${who}, ${subject ? `শেরপুরের একজন ${subject}` : 'শেরপুরের একজন শিক্ষক'}। ` +
      (years ? `${years} বছর ধরে পড়াচ্ছি। ` : '') +
      `${areaText} শিক্ষার্থীদের পড়াই। সহজ ভাষায় বুঝিয়ে পড়াই এবং নিয়মিত পড়া ও পরীক্ষার প্রস্তুতির দিকে নজর দিই। ` +
      'বিস্তারিত জানতে ফোন করুন।'
    );
  }
  if (kind === 'rent') {
    const typeText = { house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'জায়গা' }[c.rentType] || 'বাসা';
    const rooms = c.bedrooms && (c.rentType === 'house' || c.rentType === 'mess') ? `${c.bedrooms} রুমের ` : '';
    return (
      `${area ? `${area}, শেরপুরে` : 'শেরপুরে'} ${rooms}${typeText} ভাড়া দেওয়া হবে। ` +
      'কবে থেকে খালি, অগ্রিম কত ও অন্যান্য খরচ কী, তা ফোনে জানিয়ে দেব। ' +
      'ভাড়া নেওয়ার আগে নিজে এসে দেখে নিন। বিস্তারিত জানতে ফোন করুন।'
    );
  }
  if (kind === 'buy-sell') {
    const item = (c.title || '').trim();
    return (
      `${item ? item : 'পণ্যটি'} বিক্রি করা হবে। ` +
      (area ? `${area}-এ এসে দেখে নিতে পারবেন। ` : 'নিজে এসে দেখে নিতে পারবেন। ') +
      'কেনার আগে ভালো করে দেখে ও পরীক্ষা করে নিন। দাম ও অন্য কিছু জানতে সরাসরি ফোন করুন।'
    );
  }
  if (kind === 'job') {
    const employer = (c.ownerName || '').trim();
    const post = (c.title || '').trim();
    return (
      `${employer ? `${employer}-এ` : 'আমাদের প্রতিষ্ঠানে'} ${post ? `${post} পদে` : 'একটি পদে'} লোক নেওয়া হবে। ` +
      (area ? `কাজের জায়গা ${area}। ` : '') +
      'কাজের দায়িত্ব, সময় ও যোগ্যতার বিস্তারিত ফোনে জানানো হবে। আগ্রহীরা আবেদনের নিয়ম অনুযায়ী যোগাযোগ করুন।'
    );
  }
  if (kind === 'ambulance') {
    return (
      `${who}, শেরপুরে অ্যাম্বুলেন্স সেবা দিই। ` +
      (years ? `${years} বছর ধরে এই কাজ করছি। ` : '') +
      `${areaText} রোগী পরিবহন করি। জরুরি প্রয়োজনে সরাসরি ফোন করুন।`
    );
  }
  return (
    `${who}, শেরপুরের একজন ${subject || 'সেবাদাতা'}। ` +
    (years ? `${years} বছরের অভিজ্ঞতা আছে। ` : '') +
    `${areaText} সেবা দিই। সময়মতো ও যত্ন নিয়ে কাজ করি। প্রয়োজনে ফোন করুন।`
  );
}

export default function DescriptionHelper({
  value,
  onChange,
  kind = 'service',
  context = {},
  rounded = false,
}) {
  const c = CONTENT[kind] || CONTENT.service;
  const minChars = minCharsFor(kind);
  const len = (value || '').trim().length;
  const enough = len >= minChars;
  const radius = rounded ? 'rounded-lg' : '';

  function useTemplate() {
    if ((value || '').trim() && !window.confirm('এখন যা লেখা আছে তা মুছে নমুনা বসবে। ঠিক আছে?')) return;
    onChange(buildTemplate(kind, context));
  }

  return (
    <div>
      <label className="block text-sm mb-1.5 text-ink/70">{c.label}</label>
      <div className={`bg-[#EEF1F8] border border-ink/10 ${radius} px-3 py-2.5 mb-2`}>
        <p className="text-xs font-medium text-ink/70 mb-1">ভালো বিবরণে এই ৪টা কথা থাকলে মানুষ সহজে ভরসা পায়:</p>
        <ol className="text-xs text-ink/60 space-y-0.5 list-decimal pl-4">
          {c.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </div>
      <textarea
        required
        rows={5}
        maxLength={2000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-ink/20 ${radius} px-3 py-2.5 outline-none focus:border-green resize-none bg-white`}
        placeholder={c.placeholder}
      />
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <button
          type="button"
          onClick={useTemplate}
          className={`text-xs border border-green text-green px-3 py-1.5 ${rounded ? 'rounded-full' : ''} active:bg-green/10`}
        >
          ✨ নমুনা থেকে শুরু করুন
        </button>
        <span className={`text-xs ${enough ? 'text-green' : 'text-ink/50'}`}>
          {enough ? '✓ ' : ''}
          {toBn(len)} অক্ষর{enough ? '' : ` · কমপক্ষে ${toBn(minChars)} লিখুন`}
        </span>
      </div>
      <p className="text-[11px] text-ink/45 mt-1">নমুনা বসলে নিজের মতো বদলে নিন। যত নির্দিষ্ট করে লিখবেন, তত বেশি মানুষ ভরসা করে ফোন করবেন।</p>
    </div>
  );
}
