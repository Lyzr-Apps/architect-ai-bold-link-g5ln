import { NextPage } from 'next'

interface ErrorProps {
  statusCode?: number
}

const ErrorPage: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d0907',
        color: '#ddd5ca',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 600, marginBottom: '8px' }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ fontSize: '14px', color: '#8a7d6b' }}>
          {statusCode === 404
            ? 'Page not found'
            : 'An error occurred'}
        </p>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404
  return { statusCode }
}

export default ErrorPage
