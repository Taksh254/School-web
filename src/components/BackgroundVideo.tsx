"use client"

import { useEffect, useRef } from "react"

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let forward = true

    const handleTimeUpdate = () => {
      if (forward) {
        if (video.currentTime >= video.duration - 0.1) {
          forward = false
          video.playbackRate = -1.0
        }
      } else {
        if (video.currentTime <= 0.1) {
          forward = true
          video.playbackRate = 1.0
        }
      }
    }

    video.playbackRate = 1.0
    video.addEventListener("timeupdate", handleTimeUpdate)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="fixed inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <source src="/images/bg-video.mp4" type="video/mp4" />
    </video>
  )
}
