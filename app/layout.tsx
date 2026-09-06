import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ink Verde — Ideas for a changing world',
  description: 'Independent journalism on climate, economics, technology, Africa and the ideas shaping tomorrow.',
  openGraph: { title: 'Ink Verde', description: 'Ideas for a changing world', type: 'website' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
