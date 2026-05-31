import type { Metadata } from "next"
import { Nunito, Inter, Caveat } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { AuthProvider } from "@/lib/auth-context"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" })

export const metadata: Metadata = {
  title: "Tiny Mind Play School | Where Little Minds Grow With Joy",
  description: "Tiny Mind Play School offers a warm, nurturing Montessori-inspired environment for children aged 2-6. Book a visit today.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="min-h-screen flex flex-col antialiased bg-soft-white text-olive font-body">
        <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover opacity-40 pointer-events-none" style={{ zIndex: 0 }}>
          <source src="/images/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="relative" style={{ zIndex: 1 }}>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}
