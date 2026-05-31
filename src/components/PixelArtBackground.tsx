"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
import { motion, useScroll } from "framer-motion"

const BASE_W = 160
const BASE_H = 100

const C = {
  bg: "#F7F2E8",
  leaf1: "#B7C9A8",
  leaf2: "#9CAF88",
  ground: "#E8D8C3",
  groundHighlight: "#F0E4D4",
  accent: "#5F6B55",
  trunk: "#A0896A",
  trunkShadow: "#7D6A50",
  trunkDark: "#8B7355",
  canopyMain: "#B7C9A8",
  canopyLight: "#C4D6B6",
  canopyDark: "#9CAF88",
  skin: "#FCE4C8",
  skinShadow: "#F0D4B4",
  hair: "#C4956A",
  hairDark: "#B08458",
  shirt: "#D4C5A9",
  shirtShadow: "#C4B599",
  pants: "#C4B896",
  pantsShadow: "#B4A886",
  bookCover: "#C4A882",
  bookPages: "#F5F0E8",
  bookLine: "#A08860",
}

interface Leaf {
  x: number
  y: number
  speedX: number
  speedY: number
  size: number
  color: string
  phase: number
  swing: number
  swingSpeed: number
}

function createLeaf(startY?: number): Leaf {
  return {
    x: Math.random() * (BASE_W + 40) - 20,
    y: startY ?? Math.random() * BASE_H * 0.6,
    speedX: Math.random() * 0.15 + 0.05,
    speedY: Math.random() * 0.08 + 0.03,
    size: Math.random() > 0.5 ? 2 : 1,
    color: Math.random() > 0.5 ? C.leaf1 : C.leaf2,
    phase: Math.random() * Math.PI * 2,
    swing: Math.random() * 0.3 + 0.15,
    swingSpeed: Math.random() * 0.02 + 0.008,
  }
}

function isInCanopy(x: number, y: number): boolean {
  const cx = 52
  const cy = 32
  const rx = 48
  const ry = 26
  const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
  return d <= 1
}

function isInTrunk(x: number, y: number): boolean {
  const top = 58
  const bottom = 86
  if (y < top || y > bottom) return false
  const taper = ((y - top) / (bottom - top)) * 8
  const left = 46 - taper
  const right = 60 + taper
  return x >= left && x <= right
}

function isInRoot(x: number, y: number): boolean {
  if (y < 82 || y > 92) return false
  const rowProgress = (y - 82) / 10
  if (rowProgress < 0.3) {
    const width = 22 + rowProgress * 40
    const cx = 53
    return x >= cx - width / 2 && x <= cx + width / 2
  }
  return x >= 33 && x <= 73
}

function getStaticColor(x: number, y: number): string | null {
  if (y >= 88) return C.ground
  if (y >= 86 && y < 88) return C.groundHighlight
  if (isInRoot(x, y)) return C.trunkDark
  if (isInTrunk(x, y)) {
    if (x < 50) return C.trunkShadow
    if (x > 56) return C.trunkDark
    return C.trunk
  }
  if (isInCanopy(x, y)) {
    const cx = 52
    const cy = 32
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt((dx / 48) ** 2 + (dy / 26) ** 2)
    if (dist < 0.4) return C.canopyDark
    if (dist > 0.85) return C.canopyLight
    if ((Math.floor(x) + Math.floor(y)) % 3 === 0) return C.canopyDark
    return C.canopyMain
  }
  return null
}

let childPixels: [number, number, string][] | null = null

function getChildPixels(): [number, number, string][] {
  if (childPixels) return childPixels
  const pixels: [number, number, string][] = []
  const ox = 62
  const oy = 67

  const d: [number, number, string][] = [
    [0, 0, C.hairDark], [1, 0, C.hair], [2, 0, C.hair], [3, 0, C.hairDark],
    [0, 1, C.hair], [1, 1, C.skin], [2, 1, C.skin], [3, 1, C.hair],
    [0, 2, C.hairDark], [1, 2, C.skin], [2, 2, C.skin], [3, 2, C.hairDark],
    [0, 3, C.shirt], [1, 3, C.shirtShadow], [2, 3, C.shirt], [3, 3, C.shirt],
    [0, 4, C.shirt], [1, 4, C.shirt], [2, 4, C.shirt], [3, 4, C.shirt],
    [1, 5, C.shirtShadow], [2, 5, C.shirt],

    [2, 3, C.bookCover], [3, 3, C.bookCover], [4, 3, C.bookCover],
    [2, 4, C.bookPages], [3, 4, C.bookLine], [4, 4, C.bookPages],
    [2, 5, C.bookCover], [3, 5, C.bookCover], [4, 5, C.bookCover],

    [1, 6, C.pants], [2, 6, C.pantsShadow],
    [1, 7, C.pantsShadow], [2, 7, C.pants],
    [2, 8, C.pants], [3, 8, C.pantsShadow],
    [3, 9, C.pantsShadow],
  ]

  for (const [lx, ly, color] of d) {
    pixels.push([ox + lx, oy + ly, color])
  }

  const armPixels: [number, number, string][] = [
    [ox - 1, 4, C.skin], [ox - 1, 5, C.skin],
  ]
  for (const p of armPixels) pixels.push(p)

  childPixels = pixels
  return childPixels
}

export default function PixelArtBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<OffscreenCanvas | null>(null)
  const leavesRef = useRef<Leaf[]>([])
  const animFrameRef = useRef<number>(0)
  const isInitialized = useRef(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const scrollRef = useRef(0)

  const childPixelsMemo = useMemo(() => getChildPixels(), [])

  const initOffscreen = useCallback(() => {
    if (offscreenRef.current) return
    try {
      offscreenRef.current = new OffscreenCanvas(BASE_W, BASE_H)
    } catch {
      return
    }
    const ctx = offscreenRef.current.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    for (let y = 0; y < BASE_H; y++) {
      for (let x = 0; x < BASE_W; x++) {
        const color = getStaticColor(x, y)
        if (color) {
          ctx.fillStyle = color
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }

    for (const [px, py, color] of childPixelsMemo) {
      ctx.fillStyle = color
      ctx.fillRect(px, py, 1, 1)
    }
  }, [childPixelsMemo])

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      scrollRef.current = v
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  useEffect(() => {
    if (!leavesRef.current.length) {
      leavesRef.current = Array.from({ length: 20 }, () => createLeaf())
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = containerRef.current
    if (!container) return

    initOffscreen()
    const offscreen = offscreenRef.current
    if (!offscreen) return

    let leaves = leavesRef.current

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${Math.round(rect.width)}px`
      canvas.style.height = `${Math.round(rect.height)}px`
    }

    resize()
    window.addEventListener("resize", resize)

    const render = () => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      const pixelScale = Math.max(1, Math.min(Math.floor(rect.width / BASE_W), Math.floor(rect.height / BASE_H)))
      const scale = pixelScale * dpr

      const drawnW = BASE_W * pixelScale
      const drawnH = BASE_H * pixelScale
      const offsetX = Math.round((rect.width - drawnW) / 2)
      const offsetY = Math.round((rect.height - drawnH) / 2)

      const scroll = scrollRef.current
      const treeShift = Math.round(scroll * 10 * pixelScale)
      const leafShift = Math.round(scroll * 20 * pixelScale)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        offscreen,
        offsetX * dpr,
        (offsetY - treeShift) * dpr,
        drawnW * dpr,
        drawnH * dpr,
      )
      ctx.restore()

      const now = performance.now()

      for (let i = 0; i < leaves.length; i++) {
        const l = leaves[i]
        l.y += l.speedY
        l.x += l.speedX + Math.sin(now * l.swingSpeed + l.phase) * l.swing

        if (l.y > BASE_H + 5) {
          leaves[i] = createLeaf(-5)
          continue
        }
        if (l.x > BASE_W + 10 || l.x < -10) {
          leaves[i] = createLeaf(l.y)
          continue
        }

        ctx.fillStyle = l.color
        const sx = Math.round((offsetX + l.x * pixelScale) * dpr)
        const sy = Math.round((offsetY + l.y * pixelScale - leafShift) * dpr)
        const sz = l.size * pixelScale * dpr
        ctx.fillRect(sx, sy, sz, sz)
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [initOffscreen])

  return (
    <motion.div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.15 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "pixelated" }} />
    </motion.div>
  )
}
