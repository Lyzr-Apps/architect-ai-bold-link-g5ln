'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { IframeLoggerInit } from '@/components/IframeLoggerInit'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AgentInterceptorProvider } from '@/components/AgentInterceptorProvider'

export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <>
      <IframeLoggerInit />
      <ErrorBoundary>
        <AgentInterceptorProvider>
          {children}
        </AgentInterceptorProvider>
      </ErrorBoundary>
    </>
  )
}
