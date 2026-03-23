import type { ReactNode } from 'react'
import { Providers } from './providers'

export const metadata = { title: 'RG Standards Studio' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
