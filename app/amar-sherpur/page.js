export const runtime = 'edge';
import AmarSherpur from '../../components/AmarSherpur';
import { SITE_NAME, DEFAULT_OG_IMAGE } from '../../lib/site';

const TITLE = 'আমার শেরপুর — আপনি শেরপুরের কতটা ঘুরেছেন? | খুঁজি শেরপুর';
const DESCRIPTION =
  'শেরপুরের পাঁচ উপজেলার দর্শনীয় স্থানের মধ্যে কোনগুলো ঘুরেছেন, বেছে নিন এবং নিজের শেরপুর ভ্রমণ কার্ড বানান।';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/amar-sherpur' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/amar-sherpur',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'bn_BD',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
};

export default function AmarSherpurPage() {
  return <AmarSherpur />;
}
