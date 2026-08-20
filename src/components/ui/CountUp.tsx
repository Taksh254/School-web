"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion"

interface CountUpProps {
  to: number
  from?: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export default function CountUp({
  to,
  from = 0,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-20px" })
  const motionVal = useMotionValue(from)

  const rounded = useTransform(motionVal, (latest) => {
    const formatted = latest.toFixed(decimals)
    return `${prefix}${formatted}${suffix}`
  })

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionVal, to, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return () => controls.stop()
  }, [isInView, to, motionVal, duration])

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
    </span>
  )
}
