"use client"

import { useEffect, useRef } from "react"

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Programmatically mute and play the video to ensure autoplay works 
    // seamlessly across all modern browsers (bypassing strict browser policies).
    video.muted = true
    video.play().catch((err) => {
      console.warn("Background video autoPlay failed or was blocked:", err)
    })
  }, [])

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
      <source src="/images/bg-video.mp4" type="video/mp4" />
      <source src="/0531(1).mp4" type="video/mp4" />
    </video>
  )
}
