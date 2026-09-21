export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard'],
    },
    sitemap: 'https://khujisherpur-site.pages.dev/sitemap.xml',
  };
}
