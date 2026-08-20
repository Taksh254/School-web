"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pathname = usePathname()

  // Skip video entirely on dashboard routes — it's invisible there and wastes resources
  const isDashboard = pathname?.startsWith("/dashboard")

  useEffect(() => {
    if (isDashboard) return
    const video = videoRef.current
    if (!video) return

    // Programmatically mute and play the video to ensure autoplay works
    // seamlessly across all modern browsers (including iOS Safari).
    video.muted = true
    video.playsInline = true
    video.play().catch((err) => {
      console.warn("Background video autoPlay failed or was blocked:", err)
    })
  }, [isDashboard])

  if (isDashboard) return null

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      className="fixed inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <source src="/videos/bg-video.mp4?v=3" type="video/mp4" />
    </video>
  )
}

