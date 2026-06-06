'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '@/lib/loading-context';

const LOADING_MESSAGES = [
  'Loading Adventures...',
  'Preparing Little Discoveries...',
  'Setting Up Tiny Treasures...',
  'Getting Ready to Play...',
  'Almost There, Little One...',
];

// ── SVG child builder (stick-figure style with pastel outfits) ──
function ChildCharacter({
  shirtColor,
  hairColor,
  skinColor,
  delay,
  x,
}: {
  shirtColor: string;
  hairColor: string;
  skinColor: string;
  delay: number;
  x: number;
}) {
  return (
    <motion.g transform={`translate(${x}, 0)`}>
      {/* Body bounce */}
      <motion.g
        animate={{ y: [0, -6, 0, -3, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
      >
        {/* Head */}
        <circle cx="0" cy="-28" r="10" fill={skinColor} />
        {/* Hair */}
        <ellipse cx="0" cy="-35" rx="10" ry="6" fill={hairColor} />
        {/* Eyes */}
        <circle cx="-3" cy="-28" r="1.5" fill="#333" />
        <circle cx="3" cy="-28" r="1.5" fill="#333" />
        {/* Smile */}
        <path d="M-3,-24 Q0,-21 3,-24" fill="none" stroke="#333" strokeWidth="1" strokeLinecap="round" />
        {/* Body / shirt */}
        <rect x="-7" y="-18" width="14" height="16" rx="3" fill={shirtColor} />
        {/* Left arm */}
        <motion.g
          style={{ transformOrigin: '-7px -16px' }}
          animate={{ rotate: [-20, 30, -20] }}
          transition={{ duration: 0.4, repeat: Infinity, delay, ease: 'easeInOut' }}
        >
          <rect x="-12" y="-16" width="5" height="12" rx="2" fill={shirtColor} />
          <circle cx="-9.5" cy="-2" r="3" fill={skinColor} />
        </motion.g>
        {/* Right arm */}
        <motion.g
          style={{ transformOrigin: '7px -16px' }}
          animate={{ rotate: [20, -30, 20] }}
          transition={{ duration: 0.4, repeat: Infinity, delay, ease: 'easeInOut' }}
        >
          <rect x="7" y="-16" width="5" height="12" rx="2" fill={shirtColor} />
          <circle cx="9.5" cy="-2" r="3" fill={skinColor} />
        </motion.g>
        {/* Shorts */}
        <rect x="-7" y="-2" width="14" height="8" rx="2" fill="#6B8E68" />
      </motion.g>

      {/* Left leg (running) */}
      <motion.g
        style={{ transformOrigin: '-3px 6px' }}
        animate={{ rotate: [-30, 30, -30] }}
        transition={{ duration: 0.35, repeat: Infinity, delay, ease: 'easeInOut' }}
      >
        <rect x="-6" y="6" width="5" height="14" rx="2" fill={skinColor} />
        <rect x="-7" y="18" width="6" height="4" rx="2" fill="#A0522D" />
      </motion.g>
      {/* Right leg (running, opposite) */}
      <motion.g
        style={{ transformOrigin: '3px 6px' }}
        animate={{ rotate: [30, -30, 30] }}
        transition={{ duration: 0.35, repeat: Infinity, delay, ease: 'easeInOut' }}
      >
        <rect x="1" y="6" width="5" height="14" rx="2" fill={skinColor} />
        <rect x="1" y="18" width="6" height="4" rx="2" fill="#A0522D" />
      </motion.g>
    </motion.g>
  );
}

function RedBall() {
  return (
    <motion.g>
      {/* Ball bouncing + spinning */}
      <motion.g
        animate={{ y: [0, -14, 0, -8, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '0px 0px' }}
        >
          <circle cx="0" cy="0" r="8" fill="#E74C3C" />
          <circle cx="-2" cy="-3" r="2" fill="#F1948A" opacity="0.7" />
          <path d="M-5,2 Q0,6 5,2" fill="none" stroke="#C0392B" strokeWidth="0.8" />
        </motion.g>
      </motion.g>
      {/* Ball shadow */}
      <motion.ellipse
        cx="0"
        cy="10"
        rx="6"
        ry="2"
        fill="rgba(0,0,0,0.1)"
        animate={{ rx: [6, 4, 6, 5, 6] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.g>
  );
}

function GrassBlade({ x, height, delay }: { x: number; height: number; delay: number }) {
  return (
    <motion.path
      d={`M${x},0 Q${x + 3},${-height / 2} ${x + 1},${-height}`}
      fill="none"
      stroke="#8FB580"
      strokeWidth="2"
      strokeLinecap="round"
      animate={{
        d: [
          `M${x},0 Q${x + 3},${-height / 2} ${x + 1},${-height}`,
          `M${x},0 Q${x - 2},${-height / 2} ${x + 2},${-height}`,
          `M${x},0 Q${x + 3},${-height / 2} ${x + 1},${-height}`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

function Cloud({ x, y, scale, duration }: { x: number; y: number; scale: number; duration: number }) {
  return (
    <motion.g
      animate={{ x: [x, x - 400] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      transform={`translate(0, ${y}) scale(${scale})`}
    >
      <ellipse cx="0" cy="0" rx="30" ry="12" fill="white" opacity="0.85" />
      <ellipse cx="-18" cy="4" rx="18" ry="10" fill="white" opacity="0.85" />
      <ellipse cx="16" cy="4" rx="20" ry="10" fill="white" opacity="0.85" />
      <ellipse cx="0" cy="8" rx="25" ry="8" fill="white" opacity="0.9" />
    </motion.g>
  );
}

export default function PageLoader() {
  const { isLoading } = useLoading();
  const [visible, setVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  // 300ms debounce: only show the loader if loading persists beyond 300ms
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isLoading) {
      timer = setTimeout(() => setVisible(true), 300);
    } else {
      setVisible(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  // Rotate messages every 2 seconds
  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #E8F0DC 0%, #F7F2E8 40%, #F7F2E8 100%)',
            fontFamily: 'var(--font-nunito), Nunito, sans-serif',
          }}
        >
          {/* Animation scene */}
          <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
            <svg
              viewBox="0 0 400 200"
              width="100%"
              style={{ overflow: 'visible' }}
              aria-hidden="true"
            >
              {/* Sky gradient */}
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4E7C5" />
                  <stop offset="100%" stopColor="#E8F0DC" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="400" height="140" fill="url(#skyGrad)" rx="16" />

              {/* Clouds */}
              <Cloud x={60} y={25} scale={0.7} duration={25} />
              <Cloud x={200} y={15} scale={0.55} duration={30} />
              <Cloud x={340} y={35} scale={0.6} duration={22} />

              {/* Sun */}
              <motion.g
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '350px 30px' }}
              >
                <circle cx="350" cy="30" r="22" fill="#FFD93D" opacity="0.9" />
                <circle cx="350" cy="30" r="16" fill="#FFE066" />
              </motion.g>

              {/* Ground */}
              <rect x="0" y="140" width="400" height="60" fill="#B7C9A8" rx="0" />
              <rect x="0" y="140" width="400" height="8" fill="#A4B896" rx="0" />

              {/* Grass blades (looping parallax) */}
              <g transform="translate(0, 148)">
                {/* Scrolling grass layer */}
                <motion.g
                  animate={{ x: [0, -80] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  {Array.from({ length: 30 }).map((_, i) => (
                    <GrassBlade
                      key={`g-${i}`}
                      x={i * 18}
                      height={8 + (i % 3) * 4}
                      delay={(i % 5) * 0.15}
                    />
                  ))}
                </motion.g>
              </g>

              {/* Characters group (positioned on the ground) */}
              <g transform="translate(0, 118)">
                {/* Red Ball (ahead of the children) */}
                <g transform="translate(280, -6)">
                  <RedBall />
                </g>

                {/* Child 1 – leads the pack */}
                <ChildCharacter
                  shirtColor="#F9A8C9"
                  hairColor="#5C3D2E"
                  skinColor="#FDDCB5"
                  delay={0}
                  x={230}
                />
                {/* Child 2 – middle */}
                <ChildCharacter
                  shirtColor="#87CEEB"
                  hairColor="#2C1810"
                  skinColor="#E8C49A"
                  delay={0.1}
                  x={180}
                />
                {/* Child 3 – trailing behind */}
                <ChildCharacter
                  shirtColor="#98D89E"
                  hairColor="#C47A3F"
                  skinColor="#FDDCB5"
                  delay={0.2}
                  x={130}
                />
              </g>

              {/* Dust particles (behind children) */}
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`dust-${i}`}
                  cx={110 + i * 12}
                  cy={145}
                  r={2}
                  fill="#D4C9A8"
                  animate={{
                    opacity: [0, 0.6, 0],
                    x: [-5, -15],
                    y: [0, -4],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </svg>
          </div>

          {/* Loading text */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#5A7247',
                  letterSpacing: '0.02em',
                  margin: 0,
                }}
              >
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Bouncing dots */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                style={{
                  display: 'block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#98D89E',
                }}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
