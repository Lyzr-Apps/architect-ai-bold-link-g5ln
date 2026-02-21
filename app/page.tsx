import dynamic from 'next/dynamic'

export const revalidate = 0

const ArchPlanClient = dynamic(() => import('@/components/ArchPlanClient'), {
  ssr: false,
  loading: () => (
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
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid hsl(20, 18%, 16%)',
            borderTopColor: 'hsl(36, 60%, 31%)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: '8px',
            letterSpacing: '0.02em',
          }}
        >
          ArchPlan AI
        </h1>
        <p style={{ fontSize: '14px', color: 'hsl(35, 15%, 55%)' }}>
          Loading application...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  ),
})

export default function Page() {
  return <ArchPlanClient />
}
