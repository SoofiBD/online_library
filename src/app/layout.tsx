import type { Metadata } from 'next'
import { Spectral, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
})

export const metadata: Metadata = {
  title: 'Biblio',
  description: 'Your reading room',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spectral.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  )
}
