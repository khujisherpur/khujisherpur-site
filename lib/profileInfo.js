// প্রোফাইলের বিবরণের শুরুতে "লেবেল: মান" লাইনে রাখা বাড়তি তথ্য (যেমন শিক্ষকের ক্লাস, ফি)
// আলাদা করে দেয়। ডাটাবেসে নতুন কলাম লাগে না।
const INFO_LABELS = ['পড়ানোর ক্লাস', 'পড়ানোর ধরন', 'মাসিক ফি'];

export function splitProfileInfo(description) {
  const lines = (description || '').split('\n');
  const rows = [];
  let i = 0;
  for (; i < lines.length; i++) {
    const m = lines[i].match(/^(.{2,20}?):\s*(.+)$/);
    if (!m || !INFO_LABELS.includes(m[1].trim())) break;
    rows.push([m[1].trim(), m[2].trim()]);
  }
  const body = rows.length ? lines.slice(i).join('\n').replace(/^\s+/, '') : (description || '');
  return { rows, body };
}
