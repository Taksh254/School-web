import type { Metadata } from "next"
import { Nunito, Inter, Caveat } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" })

export const metadata: Metadata = {
  title: "Happy Kids Preschool | Where Little Minds Grow With Joy",
  description: "Happy Kids Preschool offers a warm, nurturing Montessori-inspired environment for children aged 2-6. Book a visit today.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="min-h-screen flex flex-col antialiased bg-soft-white text-olive font-body">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
