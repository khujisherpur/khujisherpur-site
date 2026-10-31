export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabase } from '../../../lib/supabaseClient';
import PhotoLightbox from '../../../components/PhotoLightbox';
import ReportButton from '../../../components/ReportButton';
import FavoriteButton from '../../../components/FavoriteButton';
import TrackTarget from '../../../components/TrackTarget';
import ProfileMenu from '../../../components/ProfileMenu';
import SiteHeader from '../../../components/SiteHeader';
import MessageButton from '../../../components/MessageButton';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../../../lib/site';
import { formatPrice, parsePrice, timeAgo, toBn, cleanPhone, waLink } from '../../../lib/format';

const MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

// "২ জন" / "5" -> 2 / 5 (বাংলা অঙ্কেও চলে), সংখ্যা না পেলে null
function leadingNumber(raw) {
  const en = String(raw || '').replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));
  const m = en.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : null;
  return n && n > 0 && n < 10000 ? n : null;
}

// ফর্মের "চাকরির ধরন" -> Google for Jobs-এর নির্ধারিত শব্দ
const EMPLOYMENT_TYPES = {
  'ফুল-টাইম': 'FULL_TIME',
  'পার্ট-টাইম': 'PART_TIME',
  'চুক্তিভিত্তিক': 'CONTRACTOR',
  'ইন্টার্ন': 'INTERN',
};

// ফর্মের "বেতনের ধরন" -> Google for Jobs-এর unitText; "আলোচনা সাপেক্ষে" বা অজানা হলে এখানে নেই
const SALARY_UNITS = {
  'মাসিক': 'MONTH',
  'দৈনিক': 'DAY',
  'সাপ্তাহিক': 'WEEK',
  'ঘণ্টায়': 'HOUR',
};
const SALARY_NEGOTIABLE = 'আলোচনা সাপেক্ষে';

// "2026-10-02" -> "২ অক্টোবর ২০২৬"
function formatDateBn(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${toBn(parseInt(m[3], 10))} ${MONTHS_BN[parseInt(m[2], 10) - 1]} ${toBn(m[1])}`;
}

// একই জায়গার নাম দুইবার না দেখাতে: বাংলা "য়"-এর দুই রকম লেখা ও অদৃশ্য চিহ্ন এক ধরে মেলানো
function uniqPlaces(list) {
  const seen = new Set();
  const out = [];
  for (const v of list) {
    const k = String(v || '')
      .normalize('NFC')
      .replace(/[\u200c\u200d]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

// পোস্ট করার সময় সিস্টেম যেসব লাইন বিবরণের মাথায় বসায় সেগুলো আলাদা করে নিই
// (deadline এখানে শুধু পুরোনো পোস্টের জন্য, নতুন পোস্টে আলাদা কলাম আছে)
// চাকরির ফর্ম বিবরণের মাথায় "লেবেল: মান" লাইন বসায়, সেগুলো আলাদা করে তথ্য-তালিকায় দেখাই
const JOB_FIELD_KEYS = {
  'পদসংখ্যা': 'positions',
  'চাকরির ধরন': 'jobType',
  'আবেদনের জন্য': 'gender',
  'শিক্ষাগত যোগ্যতা': 'education',
  'অভিজ্ঞতা': 'experience',
  'বয়সসীমা': 'ageLimit',
  'বেতনের ধরন': 'salaryUnit',
  'আবেদন পদ্ধতি': 'applyMethod',
  'প্রয়োজনীয় কাগজপত্র': 'documents',
  'অতিরিক্ত সুবিধা': 'benefits',
};
const JOB_FIELD_RE = new RegExp(`^(${Object.keys(JOB_FIELD_KEYS).join('|')}):\\s*(.+)$`);

// isJob সত্য হলে তবেই চাকরির লাইনগুলো আলাদা হয়, নইলে অন্য ক্যাটাগরির লেখা অক্ষত থাকে
function parseDescription(desc, isJob = false) {
  const lines = String(desc || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let deadline = null;
  let condition = null;
  let rooms = null;
  let amenities = null;
  let mapLink = null;
  const job = {};
  const bodyLines = [];
  for (const line of lines) {
    const dm = line.match(/^আবেদনের শেষ তারিখ:\s*(\d{4}-\d{2}-\d{2})/);
    if (dm) { deadline = dm[1]; continue; }
    // শুধু বিবরণের শুরুর অংশে (মালিকের নিজের লেখার আগে) থাকা চাকরির লাইন
    if (isJob && bodyLines.length === 0) {
      const jm = line.match(JOB_FIELD_RE);
      if (jm) { job[JOB_FIELD_KEYS[jm[1]]] = jm[2].trim(); continue; }
    }
    if (/^কন্ডিশন:/.test(line)) { condition = line.replace(/^কন্ডিশন:\s*/, ''); continue; }
    if (/^সুযোগ-সুবিধা:/.test(line)) { amenities = line.replace(/^সুযোগ-সুবিধা:\s*/, ''); continue; }
    if (/^গুগল ম্যাপ:/.test(line)) { mapLink = line.replace(/^গুগল ম্যাপ:\s*/, ''); continue; }
    if (!rooms && bodyLines.length === 0 && /(বেডরুম|বাথরুম|বর্গফুট)/.test(line) && line.length < 60) {
      rooms = line;
      continue;
    }
    bodyLines.push(line);
  }
  const roomsInfo = rooms
    ? {
        beds: (rooms.match(/(\S+)\s*বেডরুম/) || [])[1] || null,
        baths: (rooms.match(/(\S+)\s*বাথরুম/) || [])[1] || null,
        sqft: (rooms.match(/(\S+)\s*বর্গফুট/) || [])[1] || null,
      }
    : null;
  return {
    deadline,
    condition,
    rooms,
    roomsInfo,
    amenities,
    mapLink,
    job,
    bodyLines,
    body: bodyLines.join(' ').replace(/\s+/g, ' ').trim(),
  };
}

// আবেদনের শেষ তারিখ (বাংলাদেশ সময়ে দিনের শেষ) পেরিয়ে গেছে কিনা
function isDeadlinePassed(deadline) {
  if (!deadline) return false;
  return new Date(`${deadline}T23:59:59+06:00`).getTime() < Date.now();
}

function placeOf(listing) {
  return uniqPlaces([listing.area, listing.upazila]).join(', ');
}

function buildTitle(listing, slug) {
  const place = placeOf(listing);
  const t0 = (listing.title || '').trim();
  const hasPlace = [listing.area, listing.upazila].some((v) => v && t0.includes(v.trim()));
  const base = hasPlace || !place ? t0 : `${t0}, ${place}`;
  const price = formatPrice(listing.price_or_salary, 'bn');

  let mid = base;
  if (slug === 'job') {
    if (listing.owner_name) mid = `${base} — ${listing.owner_name}`;
  } else if (price) {
    mid = `${base} — ${price}`;
  }
  // চাকরির টাইটেলে "শেরপুরে চাকরি" থাকলে মানুষ যা খোঁজে তার সঙ্গে মেলে
  return slug === 'job' ? `${mid} | শেরপুরে চাকরি | খুঁজি শেরপুর` : `${mid} | খুঁজি শেরপুর`;
}

function buildDescription(listing, slug, parsed) {
  const place = placeOf(listing);
  const price = formatPrice(listing.price_or_salary, 'bn');
  const catName = categoryLabels[slug]?.bn?.name || 'বিজ্ঞাপন';
  const parts = [];

  if (slug === 'job') {
    parts.push(`${listing.owner_name ? `${listing.owner_name}, ` : ''}${place}।`);
    if (parsed.job?.positions) parts.push(`পদসংখ্যা ${parsed.job.positions}।`);
    if (parsed.job?.education) parts.push(`যোগ্যতা: ${parsed.job.education}।`);
    const unit = parsed.job?.salaryUnit;
    if (unit === SALARY_NEGOTIABLE) parts.push('বেতন আলোচনা সাপেক্ষে।');
    else if (price) parts.push(`বেতন ${price}${unit ? ` (${unit})` : ''}।`);
    if (parsed.deadline) parts.push(`আবেদনের শেষ তারিখ ${formatDateBn(parsed.deadline)}।`);
  } else if (slug === 'rent') {
    const lbl = { house: 'বাসা', shop: 'দোকান', mess: 'মেস' }[listing.rent_type];
    parts.push(`${lbl ? `${lbl} ` : ''}ভাড়ার বিজ্ঞাপন, ${place}।`);
    if (parsed.rooms) parts.push(`${parsed.rooms}।`);
    if (price) parts.push(`ভাড়া ${price}।`);
  } else if (slug === 'buy-sell') {
    parts.push(`${place}।`);
    if (parsed.condition) parts.push(`${parsed.condition}।`);
    if (price) parts.push(`মূল্য ${price}।`);
  } else {
    const priceLabel = { venue: 'ভাড়া', teacher: 'টিউশন ফি' }[slug] || 'মূল্য';
    parts.push(`${catName}, ${place}।`);
    if (price) parts.push(`${priceLabel} ${price}।`);
  }

  // ইউজারের নিজের লেখা পরিষ্কার ও যথেষ্ট বড় হলেই সামান্য অংশ, নইলে সাধারণ আহ্বান
  if (parsed.body.length >= 40) parts.push(`${parsed.body.slice(0, 60).trim()}…`);
  else parts.push('ছবি ও ফোন নম্বরসহ বিস্তারিত দেখুন।');

  return parts.join(' ').slice(0, 155);
}

export async function generateMetadata({ params }) {
  const { data: listing } = await supabase
    .from('listings')
    .select('title, area, upazila, price_or_salary, description, photos, rent_type, owner_name, deadline, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'active')
    .gt('expiry_date', new Date().toISOString())
    .maybeSingle();

  if (!listing) {
    return { title: 'পোস্ট পাওয়া যায়নি | খুঁজি শেরপুর', robots: { index: false } };
  }

  const slug = listing.categories?.slug;
  const parsed = parseDescription(listing.description, slug === 'job');
  // নতুন কলাম আগে, না থাকলে পুরোনো পোস্টের বিবরণ থেকে
  parsed.deadline = listing.deadline || parsed.deadline;
  const title = buildTitle(listing, slug);
  const description = buildDescription(listing, slug, parsed);
  const image = listing.photos?.[0];
  const images = image ? [image] : [DEFAULT_OG_IMAGE];

  // ?fbclid= ইত্যাদি যোগ হওয়া লিংকও একই পাতা বলে গণ্য হবে
  const canonical = `/listing/${params.id}`;

  // আবেদনের মেয়াদ-পেরোনো চাকরি সার্চ ফলাফলে আনার দরকার নেই
  const expiredJob = slug === 'job' && isDeadlinePassed(parsed.deadline);

  return {
    title,
    description,
    alternates: { canonical },
    ...(expiredJob ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'bn_BD',
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

const text = {
  bn: {
    back: '← তালিকায় ফিরে যান', desc: 'বিবরণ', noDesc: 'কোনো বিবরণ দেওয়া হয়নি।',
    details: 'বিস্তারিত', category: 'ক্যাটাগরি', location: 'এলাকা', type: 'ধরন', owner: 'মালিক', employer: 'প্রতিষ্ঠান', posted: 'পোস্ট করা হয়েছে',
    deadline: 'আবেদনের শেষ তারিখ',
    salaryNegotiable: 'বেতন আলোচনা সাপেক্ষে',
    salaryPer: { 'মাসিক': 'মাসে', 'দৈনিক': 'দিনে', 'সাপ্তাহিক': 'সপ্তাহে', 'ঘণ্টায়': 'ঘণ্টায়' },
    positions: 'পদসংখ্যা', jobType: 'চাকরির ধরন', gender: 'আবেদনের জন্য',
    education: 'শিক্ষাগত যোগ্যতা', experience: 'অভিজ্ঞতা', ageLimit: 'বয়সসীমা',
    applyMethod: 'আবেদন পদ্ধতি', documents: 'প্রয়োজনীয় কাগজপত্র', benefits: 'অতিরিক্ত সুবিধা',
    views: 'ভিউ',
    contact: 'যোগাযোগ', phone: 'মোবাইল', whatsapp: 'হোয়াটসঅ্যাপ', email: 'ইমেইল',
    call: 'কল করুন', waBtn: 'WhatsApp',
    noContact: 'এই পোস্টে যোগাযোগের তথ্য দেওয়া হয়নি।',
    deadlinePassed: '⏰ আবেদনের শেষ তারিখ পেরিয়ে গেছে',
    bedrooms: 'বেডরুম', bathrooms: 'বাথরুম', size: 'আয়তন', sqft: 'বর্গফুট', condition: 'কন্ডিশন',
    amenities: 'সুযোগ-সুবিধা', map: '📍 গুগল ম্যাপে দেখুন',
    related: 'আরও দেখুন', seeAll: 'সব দেখুন →',
    house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'অন্যান্য',
  },
  en: {
    back: '← Back to list', desc: 'Description', noDesc: 'No description provided.',
    details: 'Details', category: 'Category', location: 'Location', type: 'Type', owner: 'Owner', employer: 'Employer', posted: 'Posted',
    deadline: 'Application deadline',
    salaryNegotiable: 'Salary negotiable',
    salaryPer: { 'মাসিক': 'month', 'দৈনিক': 'day', 'সাপ্তাহিক': 'week', 'ঘণ্টায়': 'hour' },
    positions: 'Vacancies', jobType: 'Job type', gender: 'Open to',
    education: 'Education', experience: 'Experience', ageLimit: 'Age limit',
    applyMethod: 'How to apply', documents: 'Documents needed', benefits: 'Benefits',
    views: 'views',
    contact: 'Contact', phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email',
    call: 'Call', waBtn: 'WhatsApp',
    noContact: 'No contact information was provided for this post.',
    deadlinePassed: '⏰ The application deadline has passed',
    bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', size: 'Size', sqft: 'sq ft', condition: 'Condition',
    amenities: 'Amenities', map: '📍 View on Google Maps',
    related: 'More to explore', seeAll: 'See all →',
    house: 'House', shop: 'Shop', mess: 'Mess', other: 'Other',
  },
};

// বিবরণের ভেতরের লিংক ক্লিক করার উপযোগী করে
function Linkify({ value }) {
  const parts = String(value).split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="text-green underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// কল ও WhatsApp বোতাম (মূল কার্ড ও আরও-দেখুন কার্ডে একই)
function ContactButtons({ phone, whatsapp, t, small = false, trackId }) {
  const wa = waLink(whatsapp);
  if (!phone && !wa) return null;
  const size = small ? 'py-2 text-xs' : 'py-3 text-sm';
  return (
    <div className="flex gap-2" {...(trackId ? { 'data-track-type': 'listing', 'data-track-id': trackId } : {})}>
      {phone && (
        <a
          href={`tel:${cleanPhone(phone)}`}
          className={`flex-1 text-center font-semibold rounded-xl bg-marigold text-ink ${size}`}
        >
          📞 {t.call}
        </a>
      )}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-center font-semibold rounded-xl bg-[#25D366] text-white ${size}`}
        >
          💬 {t.waBtn}
        </a>
      )}
    </div>
  );
}

// JSON-LD নিরাপদ করা: '<' চিহ্ন এস্কেপ, যাতে </script> ঢোকানো না যায়
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram|headless/i;

export default async function ListingDetailPage({ params }) {
  const lang = getLang();
  const t = text[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);

  const { data: listing } = await supabase
    .from('listings')
    .select('id, user_id, category_id, title, area, upazila, union_name, price_or_salary, description, photos, rent_type, owner_name, posted_at, expiry_date, view_count, contact_phone, whatsapp, contact_email, deadline, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'active')
    .gt('expiry_date', new Date().toISOString())
    .maybeSingle();

  if (!listing) notFound();

  // বট ও লিংক-প্রিভিউয়ের ভিউ গোনা হয় না
  const ua = headers().get('user-agent') || '';
  const counted = !BOT_UA.test(ua);
  if (counted) {
    await supabase.rpc('increment_listing_view', { lid: listing.id });
  }

  const slug = listing.categories?.slug;
  const isJob = slug === 'job';
  const parsed = parseDescription(listing.description, isJob);
  // নতুন কলাম আগে, না থাকলে পুরোনো পোস্টের বিবরণ থেকে
  const deadline = listing.deadline || parsed.deadline;
  parsed.deadline = deadline;
  const deadlinePassed = isJob && isDeadlinePassed(deadline);

  const label = categoryLabels[slug];
  const categoryName = label ? label[lang].name : '';
  const photos = listing.photos || [];
  const where = uniqPlaces([listing.area, listing.union_name, listing.upazila]).join(', ');
  const price = formatPrice(listing.price_or_salary, lang);
  // চাকরিতে বেতন কত সময়ের জন্য: "৳ ১৫,০০০ / মাসে" বা "বেতন আলোচনা সাপেক্ষে"
  const salaryUnit = isJob ? parsed.job.salaryUnit : null;
  const salaryNegotiable = salaryUnit === SALARY_NEGOTIABLE;
  const per = salaryUnit ? t.salaryPer[salaryUnit] : null;
  const priceShown = salaryNegotiable ? t.salaryNegotiable : price && per ? `${price} / ${per}` : price;
  const views = (listing.view_count || 0) + (counted ? 1 : 0);

  // বিবরণে শুধু মালিকের নিজের লেখা, বাকি তথ্য "বিস্তারিত" তালিকায়
  const shownDescription = parsed.bodyLines.join('\n');

  const hasPhone = !!listing.contact_phone;
  const waUrl = waLink(listing.whatsapp);
  const hasContact = hasPhone || !!waUrl || !!listing.contact_email;

  const amenityList = parsed.amenities
    ? parsed.amenities.split(/[,،;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 12)
    : [];
  const mapLink = parsed.mapLink && /^https?:\/\//.test(parsed.mapLink) ? parsed.mapLink : null;

  // চাকরির তথ্য-সারি: বিবরণ থেকে আলাদা করা লাইনগুলো এখানে সুন্দর তালিকায়
  const jobRows = isJob
    ? [
        { k: t.jobType, v: parsed.job.jobType },
        { k: t.positions, v: parsed.job.positions },
        { k: t.gender, v: parsed.job.gender },
        { k: t.education, v: parsed.job.education },
        { k: t.experience, v: parsed.job.experience },
        { k: t.ageLimit, v: parsed.job.ageLimit },
        { k: t.applyMethod, v: parsed.job.applyMethod },
        { k: t.documents, v: parsed.job.documents },
        { k: t.benefits, v: parsed.job.benefits },
      ]
    : [];

  const rows = [
    { k: t.category, v: categoryName },
    listing.rent_type ? { k: t.type, v: t[listing.rent_type] || listing.rent_type } : null,
    parsed.roomsInfo?.beds ? { k: t.bedrooms, v: parsed.roomsInfo.beds } : null,
    parsed.roomsInfo?.baths ? { k: t.bathrooms, v: parsed.roomsInfo.baths } : null,
    parsed.roomsInfo?.sqft ? { k: t.size, v: `${parsed.roomsInfo.sqft} ${t.sqft}` } : null,
    parsed.condition ? { k: t.condition, v: parsed.condition } : null,
    { k: t.location, v: where },
    listing.owner_name ? { k: isJob ? t.employer : t.owner, v: listing.owner_name } : null,
    ...jobRows,
    isJob && deadline ? { k: t.deadline, v: lang === 'bn' ? formatDateBn(deadline) : deadline } : null,
    { k: t.posted, v: timeAgo(listing.posted_at, lang) },
  ].filter((r) => r && r.v);

  // আরও দেখুন: একই ক্যাটাগরির অন্য সক্রিয় পোস্ট, একই উপজেলার আগে
  const { data: relatedRaw } = await supabase
    .from('listings')
    .select('id, title, area, upazila, price_or_salary, photos, posted_at, deadline, contact_phone, whatsapp')
    .eq('status', 'active')
    .gt('expiry_date', new Date().toISOString())
    .eq('category_id', listing.category_id)
    .neq('id', listing.id)
    .order('posted_at', { ascending: false })
    .limit(30);

  const related = (relatedRaw || [])
    .filter((r) => !(isJob && isDeadlinePassed(r.deadline)))
    .sort((a, b) => Number(b.upazila === listing.upazila) - Number(a.upazila === listing.upazila))
    .slice(0, 8);

  // স্ট্রাকচার্ড ডেটা: শুধু চাকরির জন্য JobPosting (প্রতিষ্ঠানের নাম থাকলে ও মেয়াদ না ফুরোলে)।
  // ব্যবহারকারীর পোস্ট দোকানের পণ্য নয়, তাই Product ডেটা দেওয়া হয় না (Google ডেলিভারি/রিটার্ন নীতি চায়, যা এখানে নেই)
  const numericPrice = parsePrice(listing.price_or_salary);
  let jsonLd = null;

  if (isJob) {
    if (listing.owner_name && !deadlinePassed) {
      const validThrough = deadline
        ? `${deadline}T23:59:59+06:00`
        : new Date(listing.expiry_date).toISOString();

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: listing.title,
        description: (listing.description || listing.title).slice(0, 5000),
        datePosted: new Date(listing.posted_at).toISOString().slice(0, 10),
        validThrough,
        hiringOrganization: { '@type': 'Organization', name: listing.owner_name },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: listing.area,
            addressRegion: listing.upazila || 'Sherpur',
            addressCountry: 'BD',
          },
        },
        ...(photos[0] ? { image: photos[0] } : {}),
        // ফর্ম থেকে পাওয়া বাড়তি তথ্য: থাকলেই যোগ হয়, না থাকলে বাদ
        ...(EMPLOYMENT_TYPES[parsed.job.jobType] ? { employmentType: EMPLOYMENT_TYPES[parsed.job.jobType] } : {}),
        ...(leadingNumber(parsed.job.positions) ? { totalJobOpenings: leadingNumber(parsed.job.positions) } : {}),
        ...(parsed.job.education ? { educationRequirements: parsed.job.education } : {}),
        ...(parsed.job.experience ? { experienceRequirements: parsed.job.experience } : {}),
        // বেতনের ধরন জানা থাকলেই বেতন যায়; পুরোনো পোস্টে (ধরন অজানা) ভুল তথ্য না দিতে বাদ
        ...(numericPrice && SALARY_UNITS[salaryUnit]
          ? {
              baseSalary: {
                '@type': 'MonetaryAmount',
                currency: 'BDT',
                value: { '@type': 'QuantitativeValue', value: numericPrice, unitText: SALARY_UNITS[salaryUnit] },
              },
            }
          : {}),
      };
    }
  }

  // গুগল ফলাফলে লিংকের নিচে দেখানো পথ: হোম › ক্যাটাগরি › পোস্ট
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
      ...(categoryName
        ? [{ '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE_URL}/category/${slug}` }]
        : []),
      {
        '@type': 'ListItem',
        position: categoryName ? 3 : 2,
        name: listing.title,
        item: `${SITE_URL}/listing/${listing.id}`,
      },
    ],
  };

  return (
    <>
      <SiteHeader lang={lang} />
      {counted && <TrackTarget type="listing" id={listing.id} />}
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <a href={`/category/${slug}`} className="text-sm text-ink/55 hover:text-ink">
          {t.back}
        </a>

        <div className="relative bg-white border border-ink/10 rounded-2xl mt-3 shadow-sm">
          <div className="overflow-hidden rounded-t-2xl">
            {photos.length > 0 ? (
              <div>
                <PhotoLightbox src={photos[0]} alt={`${listing.title} - 1`} size="w-full h-64" rounded={false} />
                {photos.length > 1 && (
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {photos.slice(1).map((url, i) => (
                      <PhotoLightbox
                        key={url}
                        src={url}
                        alt={`${listing.title} - ${i + 2}`}
                        size="w-full h-28"
                        rounded={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-32 bg-[#EEF1F8] flex items-center justify-center text-5xl opacity-70">
                {label?.icon || '📄'}
              </div>
            )}
          </div>

          <ProfileMenu title={listing.title} lang={lang}>
            <FavoriteButton targetType="listing" targetId={listing.id} asMenuItem />
            <ReportButton targetType="listing" targetId={listing.id} asMenuItem />
          </ProfileMenu>

          <div className="p-5">
            <div className="flex items-center gap-2 flex-wrap">
              {categoryName && (
                <span className="text-[11px] bg-[#EEF1F8] text-ink/70 px-2.5 py-1 rounded-full">{categoryName}</span>
              )}
              {listing.rent_type && (
                <span className="text-[11px] bg-marigold/15 text-ink px-2.5 py-1 rounded-full">
                  {t[listing.rent_type] || listing.rent_type}
                </span>
              )}
            </div>

            <h1 className="text-xl font-semibold mt-2 leading-snug">{listing.title}</h1>
            {priceShown && (
              <p className={`${salaryNegotiable ? 'text-lg' : 'text-2xl'} font-semibold text-green font-numeric mt-2`}>
                {priceShown}
              </p>
            )}
            {deadlinePassed && (
              <p className="mt-2 text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2">{t.deadlinePassed}</p>
            )}
            <p className="text-sm text-ink/55 mt-2">
              📍 {where}
              <span className="mx-1.5">·</span>
              {timeAgo(listing.posted_at, lang)}
              <span className="mx-1.5">·</span>👁️ {num(views)} {t.views}
            </p>

            {/* কল ও WhatsApp */}
            {(hasPhone || waUrl) && (
              <div className="mt-4">
                <ContactButtons phone={listing.contact_phone} whatsapp={listing.whatsapp} t={t} />
              </div>
            )}
            <div className="mt-3">
              <MessageButton kind="listing" refId={listing.id} ownerId={listing.user_id} lang={lang} />
            </div>

            {/* যোগাযোগ */}
            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.contact}</h2>
              {hasContact ? (
                <div className="bg-paper rounded-xl divide-y divide-ink/5">
                  {hasPhone && (
                    <a
                      href={`tel:${cleanPhone(listing.contact_phone)}`}
                      className="flex justify-between gap-4 px-3 py-3 text-sm"
                    >
                      <span className="text-ink/55">📞 {t.phone}</span>
                      <span className="font-numeric font-medium text-green">{listing.contact_phone}</span>
                    </a>
                  )}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between gap-4 px-3 py-3 text-sm"
                    >
                      <span className="text-ink/55">💬 {t.whatsapp}</span>
                      <span className="font-numeric font-medium text-green">{listing.whatsapp}</span>
                    </a>
                  )}
                  {listing.contact_email && (
                    <a
                      href={`mailto:${listing.contact_email}`}
                      className="flex justify-between gap-4 px-3 py-3 text-sm"
                    >
                      <span className="text-ink/55">✉️ {t.email}</span>
                      <span className="font-medium text-green break-all text-right">{listing.contact_email}</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink/50 bg-paper rounded-xl px-3 py-3">{t.noContact}</p>
              )}
            </div>

            {/* বিবরণ */}
            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.desc}</h2>
              <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
                {shownDescription ? <Linkify value={shownDescription} /> : t.noDesc}
              </p>
            </div>

            {/* সুযোগ-সুবিধা */}
            {amenityList.length > 0 && (
              <div className="mt-6 pt-5 border-t border-ink/10">
                <h2 className="text-sm font-medium text-ink/60 mb-2">{t.amenities}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {amenityList.map((a) => (
                    <span key={a} className="text-xs bg-[#EEF1F8] text-ink/75 px-3 py-1.5 rounded-full">
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* গুগল ম্যাপ */}
            {mapLink && (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="mt-5 block text-center text-sm font-medium border border-green text-green rounded-xl py-2.5"
              >
                {t.map}
              </a>
            )}

            {/* বিস্তারিত */}
            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.details}</h2>
              <div className="bg-paper rounded-xl divide-y divide-ink/5">
                {rows.map((r) => (
                  <div key={r.k} className="flex justify-between gap-4 px-3 py-2.5 text-sm">
                    <span className="text-ink/55 flex-shrink-0">{r.k}</span>
                    <span className="text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* আরও দেখুন */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-semibold">
                {t.related}
                {categoryName ? ` · ${categoryName}` : ''}
              </h2>
              <a href={`/category/${slug}`} className="text-sm text-green">
                {t.seeAll}
              </a>
            </div>

            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide">
              {related.map((r) => {
                const rPrice = formatPrice(r.price_or_salary, lang);
                const rPlace = uniqPlaces([r.area, r.upazila]).join(', ');
                return (
                  <div
                    key={r.id}
                    className="snap-start flex-shrink-0 w-48 bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <a href={`/listing/${r.id}`} className="block">
                      {r.photos?.[0] ? (
                        <img src={r.photos[0]} alt={r.title || ''} className="w-full h-28 object-cover" />
                      ) : (
                        <div className="w-full h-28 bg-[#EEF1F8] flex items-center justify-center text-3xl opacity-70">
                          {label?.icon || '📄'}
                        </div>
                      )}
                      <div className="p-3 pb-2">
                        <p className="text-sm font-medium leading-snug line-clamp-2">{r.title}</p>
                        {rPrice && <p className="text-sm font-semibold text-green font-numeric mt-1">{rPrice}</p>}
                        <p className="text-[11px] text-ink/50 mt-1 truncate">📍 {rPlace}</p>
                      </div>
                    </a>
                    <div className="px-3 pb-3">
                      <ContactButtons phone={r.contact_phone} whatsapp={r.whatsapp} t={t} small trackId={r.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
        />
      </main>
    </>
  );
}
