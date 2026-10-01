import './globals.css';
import MaintenanceGate from '../components/MaintenanceGate';

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
    <html
      lang="bn"
      style={{
        '--font-hind': "'Hind Siliguri', system-ui, sans-serif",
        '--font-noto-serif-bn': "'Noto Serif Bengali', Georgia, serif",
      }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@500;600;700&display=swap"
        />
      </head>
      <body className="bg-paper text-ink font-sans antialiased">
        <MaintenanceGate>{children}</MaintenanceGate>
      </body>
    </html>
  );
}
