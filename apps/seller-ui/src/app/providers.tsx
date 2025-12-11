'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WebSocketProvider } from '../context/web-socket-context'
import useSeller from '../hooks/useSeller'

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ProviderWithWebSocket>{children}</ProviderWithWebSocket>
    </QueryClientProvider>
  )
}

const ProviderWithWebSocket = ({ children }: { children: React.ReactNode }) => {
  const { seller, isLoading } = useSeller()

  // Prevent infinite API calls
  if (isLoading) return null

  // Only mount websocket when seller exists
  if (!seller) return <>{children}</>

  return (
    <WebSocketProvider seller={seller}>
      {children}
    </WebSocketProvider>
  )
}

export default Provider
