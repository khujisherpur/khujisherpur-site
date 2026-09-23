import { Hind_Siliguri, Noto_Serif_Bengali } from 'next/font/google';
import './globals.css';

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
});

const notoSerifBn = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: ['500', '600', '700'],
  variable: '--font-noto-serif-bn',
});

export const metadata = {
  title: 'খুঁজি শেরপুর | শেরপুরে যা খুঁজছেন, এক জায়গায় খুঁজে নিন',
  description:
    'শেরপুর জেলায় বাসা ভাড়া, মেস ভাড়া, চাকরি বিজ্ঞপ্তি, ইলেকট্রিশিয়ান ও প্লাম্বার — সব এক জায়গায় খুঁজুন।',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${hind.variable} ${notoSerifBn.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
