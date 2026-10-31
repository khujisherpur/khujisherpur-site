/** @type {import('next').NextConfig} */

// সব পেজে যে নিরাপত্তা-হেডার যাবে। সাইট ক্যামেরা, মাইক্রোফোন বা লোকেশন ব্যবহার করে না, তাই সেগুলো বন্ধ রাখা হলো।
const securityHeaders = [
  // ব্রাউজার ফাইলের ধরন নিজে নিজে অনুমান করবে না
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // অন্য কোনো সাইট খুঁজি শেরপুরকে নিজের পেজের ভেতরে (iframe) বসাতে পারবে না
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // অন্য সাইটে যাওয়ার সময় শুধু ডোমেইন যায়, পুরো লিংক নয়
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  // এক বছর ধরে ব্রাউজার শুধু https দিয়ে সাইটে ঢুকবে
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

const nextConfig = {
  // রেসপন্সে "X-Powered-By: Next.js" না পাঠানো
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
module.exports = nextConfig;
