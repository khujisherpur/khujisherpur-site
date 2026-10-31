'use client';

export default function GlobalError({ reset }) {
  return (
    <html lang="bn">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Hind Siliguri', system-ui, sans-serif",
          background: '#F5F7F4',
          color: '#1B2A4A',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <p style={{ fontSize: 44, margin: 0 }}>⚠️</p>
          <h1 style={{ fontSize: 20, margin: '12px 0 8px' }}>কিছু একটা সমস্যা হয়েছে</h1>
          <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.6, margin: 0 }}>
            সাইটটি খুলতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '12px 0',
              border: 0,
              borderRadius: 12,
              background: '#1c8a4c',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </body>
    </html>
  );
}
