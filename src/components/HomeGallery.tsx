"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import DomeGallery from "@/components/DomeGallery/DomeGallery"

export default function HomeGallery() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-soft-white rounded-3xl border border-beige/30 shadow-soft p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-4">
              Gallery
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">
              Moments of Joy
            </h2>
            <p className="mt-3 text-lg md:text-xl font-hand text-olive/50">
              Capturing beautiful preschool memories
            </p>
            <div className="mt-3 w-16 h-0.5 bg-pistachio/30 mx-auto rounded-full" />
          </motion.div>

          <div className="relative w-full h-[60vh] min-h-[400px] md:min-h-[500px] lg:h-[70vh] mt-8">
            <DomeGallery
              grayscale={false}
              overlayBlurColor="#5F6B55"
              imageBorderRadius="20px"
              openedImageBorderRadius="24px"
              openedImageWidth="320px"
              openedImageHeight="400px"
              fit={0.4}
              dragSensitivity={25}
              maxVerticalRotationDeg={4}
              enlargeTransitionMs={400}
              dragDampening={3}
            />
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pistachio text-white font-display font-medium text-sm hover:bg-pistachio/90 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              View Full Gallery <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
