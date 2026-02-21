export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'hsl(20, 30%, 4%)',
        color: 'hsl(35, 20%, 90%)',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '64px', fontWeight: 600, marginBottom: '8px' }}>404</h1>
        <p style={{ fontSize: '16px', color: 'hsl(35, 15%, 55%)', marginBottom: '24px' }}>
          Page not found
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: 'hsl(36, 60%, 31%)',
            color: 'hsl(35, 20%, 95%)',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
