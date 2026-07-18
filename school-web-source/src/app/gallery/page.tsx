"use client"

import { motion } from "framer-motion"
import DomeGallery from "@/components/DomeGallery/DomeGallery"

export default function GalleryPage() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream via-soft-white to-cream">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-2xl mx-auto text-center"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-4">
            Gallery
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">
            Moments of Joy
          </h1>
          <p className="mt-3 text-lg md:text-xl font-hand text-olive/50">
            Capturing beautiful preschool memories
          </p>
          <div className="mt-3 w-16 h-0.5 bg-pistachio/30 mx-auto rounded-full" />
        </motion.div>
      </div>

      <div className="relative w-full h-[70vh] min-h-[480px] md:min-h-[600px] lg:h-[80vh]">
        <DomeGallery
          grayscale={false}
          overlayBlurColor="#5F6B55"
          imageBorderRadius="20px"
          openedImageBorderRadius="24px"
          openedImageWidth="320px"
          openedImageHeight="400px"
          fit={0.45}
          dragSensitivity={25}
          maxVerticalRotationDeg={4}
          enlargeTransitionMs={400}
          dragDampening={3}
        />
      </div>
    </section>
  )
}
