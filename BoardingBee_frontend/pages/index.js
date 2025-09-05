import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <h1>Welcome to BoardingBee Frontend (Next.js)</h1>
  <Link href="/register/" legacyBehavior>
        <a style={{
          marginTop: '2rem',
          padding: '0.8rem 2.2rem',
          background: 'linear-gradient(90deg, #0077B6 0%, #00B4D8 100%)',
          color: '#fff',
          borderRadius: '0.6rem',
          fontWeight: 600,
          fontSize: '1.1rem',
          textDecoration: 'none',
          boxShadow: '0 4px 16px 0 rgba(3, 4, 94, 0.10)',
          transition: 'background 0.2s',
        }}
        >
          Register
        </a>
      </Link>
    </main>
  )
}
