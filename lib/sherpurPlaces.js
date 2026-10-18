// শেরপুরের দর্শনীয় স্থান। lat/lng না থাকলে (null) ম্যাপে মার্কার বসে না,
// তবে তালিকায় থাকে এবং Google Maps-এর সার্চ লিংক দেখায় (অবস্থান নিশ্চিত দাবি করে না)।
// approx: true মানে পিনটি আনুমানিক। note শুধু আমাদের নিজের জন্য।

export const UPAZILAS = [
  { id: 'sadar', name: 'শেরপুর সদর' },
  { id: 'nakla', name: 'নকলা' },
  { id: 'nalitabari', name: 'নালিতাবাড়ী' },
  { id: 'jhenaigati', name: 'ঝিনাইগাতী' },
  { id: 'sreebardi', name: 'শ্রীবরদী' },
];

export const PLACES = [
  { id: 'orchid', name: 'অর্কিড পর্যটন কেন্দ্র', short: 'অর্কিড', upazila: 'sadar', lat: 25.0400649, lng: 90.0217131 },
  { id: 'raghunath', name: 'রঘুনাথ জিউর মন্দির', short: 'রঘুনাথ মন্দির', upazila: 'sadar', lat: 25.0171659, lng: 90.0175061, note: 'অন্য একটি পিন: 25.0727, 90.0539' },
  { id: 'pounetin', name: 'পৌনে তিন আনি জমিদার বাড়ি', short: 'জমিদার বাড়ি', upazila: 'sadar', lat: 25.020065, lng: 90.0206577 },
  { id: 'maisaheba', name: 'মাইসাহেবা জামে মসজিদ', short: 'মাইসাহেবা', upazila: 'sadar', lat: 25.0202603, lng: 90.0129512 },
  { id: 'dclake', name: 'ডিসি লেক / কালেক্টরেট পার্ক', short: 'ডিসি লেক', upazila: 'sadar', lat: 25.0197, lng: 90.0157 },
  { id: 'shahid', name: 'শহীদ স্মৃতিস্তম্ভ', short: 'শহীদ স্তম্ভ', upazila: 'sadar', lat: 25.010841, lng: 90.017158 },
  { id: 'sheraligazi', name: 'শের আলী গাজীর মাজার', short: 'শের আলী মাজার', upazila: 'sadar', lat: 25.0390157, lng: 90.097611 },
  { id: 'gopinath', name: 'গোপীনাথ ও অন্নপূর্ণা মন্দির', short: 'গোপীনাথ মন্দির', upazila: 'sadar', lat: 25.0200571, lng: 90.0201223 },
  { id: 'batbriksha', name: 'শতবর্ষী বটবৃক্ষ', short: 'বটবৃক্ষ', upazila: 'nakla', lat: null, lng: null },
  { id: 'shimul', name: 'নারায়ণখোলা শিমুল গাছ', short: 'শিমুল গাছ', upazila: 'nakla', lat: 24.90449, lng: 90.208356, approx: true, note: 'ঘাটপাড় ব্রিজের পিন, গাছের নিজস্ব পিন নেই' },
  { id: 'gazidorgah', name: 'গাজীর দরগাহ', short: 'গাজীর দরগাহ', upazila: 'nakla', lat: null, lng: null },
  { id: 'mayakunjo', name: 'মায়াকুঞ্জ', short: 'মায়াকুঞ্জ', upazila: 'nakla', lat: 24.9937, lng: 90.14 },
  { id: 'madhutila', name: 'মধুটিলা ইকো পার্ক', short: 'মধুটিলা', upazila: 'nalitabari', lat: 25.206, lng: 90.154 },
  { id: 'panihata', name: 'পানিহাটা–তারানি পাহাড়', short: 'পানিহাটা', upazila: 'nalitabari', lat: 25.199, lng: 90.25 },
  { id: 'baromari', name: 'বারোমারী মিশন', short: 'বারোমারী', upazila: 'nalitabari', lat: 25.2004, lng: 90.187, approx: true, note: 'পিন বারোমারীর একটি হোস্টেলের' },
  { id: 'nakugaon', name: 'নাকুগাঁও স্থলবন্দর', short: 'নাকুগাঁও', upazila: 'nalitabari', lat: 25.1998, lng: 90.2234 },
  { id: 'rubberdam', name: 'রাবার ড্যাম (ভোগাই নদী)', short: 'রাবার ড্যাম', upazila: 'nalitabari', lat: 25.0563401, lng: 90.2021943 },
  { id: 'durgaprachir', name: 'নালিতাবাড়ী ঐতিহাসিক দুর্গপ্রাচীর', short: 'দুর্গপ্রাচীর', upazila: 'nalitabari', lat: null, lng: null },
  { id: 'sutanal', name: 'সুতানাল দিঘি', short: 'সুতানাল দিঘি', upazila: 'nalitabari', lat: null, lng: null },
  { id: 'nibhriti', name: 'নিভৃতি', short: 'নিভৃতি', upazila: 'nalitabari', lat: 25.2150155, lng: 90.1572218 },
  { id: 'kacharipara', name: 'কাচারিপাড়া ঘাট', short: 'কাচারিপাড়া', upazila: 'nalitabari', lat: 25.093, lng: 90.193, approx: true },
  { id: 'gazni', name: 'গজনী অবকাশ কেন্দ্র', short: 'গজনী', upazila: 'jhenaigati', lat: 25.2469582, lng: 90.044178 },
  { id: 'katakhali', name: 'কাটাখালি সেতু ও মুক্তিযুদ্ধ স্মৃতিস্তম্ভ', short: 'কাটাখালি', upazila: 'jhenaigati', lat: 25.0997, lng: 90.0419 },
  { id: 'smritisoudho', name: 'মুক্তিযুদ্ধ স্মৃতিসৌধ', short: 'স্মৃতিসৌধ', upazila: 'jhenaigati', lat: 25.2286, lng: 90.0678 },
  { id: 'sandhyakura', name: 'সন্ধ্যাকুড়া রাবার বাগান', short: 'সন্ধ্যাকুড়া', upazila: 'jhenaigati', lat: 25.2223224, lng: 90.1060881 },
  { id: 'ghagra', name: 'ঘাগড়া খাঁন বাড়ী মসজিদ', short: 'ঘাগড়া', upazila: 'jhenaigati', lat: 25.1126, lng: 90.037 },
  { id: 'mariamnagar', name: 'মরিয়ম নগর গির্জা', short: 'মরিয়ম নগর', upazila: 'jhenaigati', lat: 25.188241, lng: 90.0901032 },
  { id: 'ainapur', name: 'আইনাপুর রাবার ড্যাম', short: 'আইনাপুর', upazila: 'jhenaigati', lat: 25.206, lng: 90.092 },
  { id: 'honeymoon', name: 'হানিমুন রিসোর্ট', short: 'হানিমুন', upazila: 'jhenaigati', lat: 25.1687905, lng: 90.061553 },
  { id: 'mayabi', name: 'নতুন মায়াবী লেক', short: 'মায়াবী লেক', upazila: 'jhenaigati', lat: 25.2592292, lng: 90.0162106 },
  { id: 'rajarpahar', name: 'রাজার পাহাড়', short: 'রাজার পাহাড়', upazila: 'sreebardi', lat: 25.2565, lng: 89.942 },
  { id: 'babelakona', name: 'বাবেলাকোনা', short: 'বাবেলাকোনা', upazila: 'sreebardi', lat: 25.2803107, lng: 89.943992 },
  { id: 'noyabari', name: 'নয়াবাড়ির টিলা', short: 'নয়াবাড়ি', upazila: 'sreebardi', lat: null, lng: null },
  { id: 'garjaripa', name: 'গড়জরিপা বারদুয়ারী শাহী মসজিদ ও মাজার', short: 'গড়জরিপা', upazila: 'sreebardi', lat: 25.1040999, lng: 90.0107322 },
  { id: 'simanta', name: 'সীমান্ত সড়ক', short: 'সীমান্ত সড়ক', upazila: 'sreebardi', lat: null, lng: null },
  { id: 'hariakona', name: 'হারিয়াকোনা গারো পাহাড়', short: 'হারিয়াকোনা', upazila: 'sreebardi', lat: 25.2914773, lng: 89.9567489 },
  { id: 'baisha', name: 'বৈশা বিল', short: 'বৈশা বিল', upazila: 'sreebardi', lat: 25.1348057, lng: 89.9463528 },
  { id: 'madarpur', name: 'মাদারপুর ব্রিজ', short: 'মাদারপুর', upazila: 'sreebardi', lat: 25.1093512, lng: 89.9695921 },
  { id: 'khalishakuri', name: 'খলিশাকুরি বিল', short: 'খলিশাকুরি', upazila: 'sreebardi', lat: 25.1388046, lng: 89.9634167 },
  { id: 'someshwari', name: 'সোমেশ্বরী নদী', short: 'সোমেশ্বরী', upazila: 'sreebardi', lat: 25.211521, lng: 89.935284, note: 'পিন শ্রীবরদীর সীমানায় পড়ে' },
];

export function upazilaName(id) {
  const u = UPAZILAS.find((x) => x.id === id);
  return u ? u.name : '';
}

// পিন নেই এমন স্থানের জন্য Google Maps সার্চ লিংক
export function mapsSearchUrl(place) {
  const query = `${place.name} ${upazilaName(place.upazila)} শেরপুর`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
