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

// CSS keyframe animations injected once — GPU-composited transform/opacity only.
// Replaces 21+ simultaneous Framer Motion RAF loops that were running continuously.
const ANIMATION_STYLES = `
  @keyframes tm-bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}70%{transform:translateY(-3px)}}
  @keyframes tm-arm-l{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(30deg)}}
  @keyframes tm-arm-r{0%,100%{transform:rotate(20deg)}50%{transform:rotate(-30deg)}}
  @keyframes tm-leg-l{0%,100%{transform:rotate(-30deg)}50%{transform:rotate(30deg)}}
  @keyframes tm-leg-r{0%,100%{transform:rotate(30deg)}50%{transform:rotate(-30deg)}}
  @keyframes tm-cloud{0%{transform:translateX(0)}100%{transform:translateX(-400px)}}
  @keyframes tm-grass{0%{transform:translateX(0)}100%{transform:translateX(-80px)}}
  @keyframes tm-sun{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
  @keyframes tm-ball-y{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}70%{transform:translateY(-8px)}}
  @keyframes tm-ball-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes tm-dust{0%{opacity:0;transform:translate(0,0)}50%{opacity:0.6;transform:translate(-10px,-4px)}100%{opacity:0;transform:translate(-15px,-4px)}}
  @keyframes tm-dot{0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
  @media(prefers-reduced-motion:reduce){
    @keyframes tm-bounce{0%,100%{transform:none}}
    @keyframes tm-arm-l,@keyframes tm-arm-r,@keyframes tm-leg-l,@keyframes tm-leg-r{0%,100%{transform:none}}
    @keyframes tm-cloud,@keyframes tm-grass{0%,100%{transform:none}}
  }
`;

function ChildFigure({ shirtColor, hairColor, skinColor, delay, x }: {
  shirtColor: string; hairColor: string; skinColor: string; delay: number; x: number;
}) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <g style={{ animation: `tm-bounce 0.6s ${delay}s ease-in-out infinite` }}>
        <circle cx="0" cy="-28" r="10" fill={skinColor} />
        <ellipse cx="0" cy="-35" rx="10" ry="6" fill={hairColor} />
        <circle cx="-3" cy="-28" r="1.5" fill="#333" />
        <circle cx="3" cy="-28" r="1.5" fill="#333" />
        <path d="M-3,-24 Q0,-21 3,-24" fill="none" stroke="#333" strokeWidth="1" strokeLinecap="round" />
        <rect x="-7" y="-18" width="14" height="16" rx="3" fill={shirtColor} />
        <g style={{ transformOrigin: '-7px -16px', animation: `tm-arm-l 0.4s ${delay}s ease-in-out infinite` }}>
          <rect x="-12" y="-16" width="5" height="12" rx="2" fill={shirtColor} />
          <circle cx="-9.5" cy="-2" r="3" fill={skinColor} />
        </g>
        <g style={{ transformOrigin: '7px -16px', animation: `tm-arm-r 0.4s ${delay}s ease-in-out infinite` }}>
          <rect x="7" y="-16" width="5" height="12" rx="2" fill={shirtColor} />
          <circle cx="9.5" cy="-2" r="3" fill={skinColor} />
        </g>
        <rect x="-7" y="-2" width="14" height="8" rx="2" fill="#6B8E68" />
      </g>
      <g style={{ transformOrigin: '-3px 6px', animation: `tm-leg-l 0.35s ${delay}s ease-in-out infinite` }}>
        <rect x="-6" y="6" width="5" height="14" rx="2" fill={skinColor} />
        <rect x="-7" y="18" width="6" height="4" rx="2" fill="#A0522D" />
      </g>
      <g style={{ transformOrigin: '3px 6px', animation: `tm-leg-r 0.35s ${delay}s ease-in-out infinite` }}>
        <rect x="1" y="6" width="5" height="14" rx="2" fill={skinColor} />
        <rect x="1" y="18" width="6" height="4" rx="2" fill="#A0522D" />
      </g>
    </g>
  );
}

function RedBall() {
  return (
    <g>
      <g style={{ animation: 'tm-ball-y 0.8s ease-in-out infinite' }}>
        <g style={{ transformOrigin: '0 0', animation: 'tm-ball-spin 1.2s linear infinite' }}>
          <circle cx="0" cy="0" r="8" fill="#E74C3C" />
          <circle cx="-2" cy="-3" r="2" fill="#F1948A" opacity="0.7" />
          <path d="M-5,2 Q0,6 5,2" fill="none" stroke="#C0392B" strokeWidth="0.8" />
        </g>
      </g>
      <ellipse cx="0" cy="10" rx="6" ry="2" fill="rgba(0,0,0,0.1)" />
    </g>
  );
}

function Cloud({ x, y, scale, duration }: { x: number; y: number; scale: number; duration: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}
      style={{ animation: `tm-cloud ${duration}s linear infinite` }}>
      <ellipse cx="0" cy="0" rx="30" ry="12" fill="white" opacity="0.85" />
      <ellipse cx="-18" cy="4" rx="18" ry="10" fill="white" opacity="0.85" />
      <ellipse cx="16" cy="4" rx="20" ry="10" fill="white" opacity="0.85" />
      <ellipse cx="0" cy="8" rx="25" ry="8" fill="white" opacity="0.9" />
    </g>
  );
}

export default function PageLoader() {
  const { isLoading } = useLoading();
  const [visible, setVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isLoading) {
      timer = setTimeout(() => setVisible(true), 300);
    } else {
      setVisible(false);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isLoading]);

  useEffect(() => {
    if (!visible) { setMessageIndex(0); return; }
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="page-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(180deg, #E8F0DC 0%, #F7F2E8 40%, #F7F2E8 100%)',
              fontFamily: 'var(--font-nunito), Nunito, sans-serif',
            }}
          >
            <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
              <svg viewBox="0 0 400 200" width="100%" style={{ overflow: 'visible' }} aria-hidden="true">
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4E7C5" />
                    <stop offset="100%" stopColor="#E8F0DC" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="400" height="140" fill="url(#skyGrad)" rx="16" />

                <Cloud x={60} y={25} scale={0.7} duration={25} />
                <Cloud x={200} y={15} scale={0.55} duration={30} />
                <Cloud x={340} y={35} scale={0.6} duration={22} />

                <g style={{ transformOrigin: '350px 30px', animation: 'tm-sun 3s ease-in-out infinite' }}>
                  <circle cx="350" cy="30" r="22" fill="#FFD93D" opacity="0.9" />
                  <circle cx="350" cy="30" r="16" fill="#FFE066" />
                </g>

                <rect x="0" y="140" width="400" height="60" fill="#B7C9A8" />
                <rect x="0" y="140" width="400" height="8" fill="#A4B896" />

                <g transform="translate(0, 148)">
                  <g style={{ animation: 'tm-grass 2s linear infinite' }}>
                    {Array.from({ length: 30 }).map((_, i) => {
                      const h = 8 + (i % 3) * 4;
                      const bx = i * 18;
                      return (
                        <path key={`g-${i}`}
                          d={`M${bx},0 Q${bx + 3},${-h / 2} ${bx + 1},${-h}`}
                          fill="none" stroke="#8FB580" strokeWidth="2" strokeLinecap="round" />
                      );
                    })}
                  </g>
                </g>

                <g transform="translate(0, 118)">
                  <g transform="translate(280, -6)"><RedBall /></g>
                  <ChildFigure shirtColor="#F9A8C9" hairColor="#5C3D2E" skinColor="#FDDCB5" delay={0} x={230} />
                  <ChildFigure shirtColor="#87CEEB" hairColor="#2C1810" skinColor="#E8C49A" delay={0.1} x={180} />
                  <ChildFigure shirtColor="#98D89E" hairColor="#C47A3F" skinColor="#FDDCB5" delay={0.2} x={130} />
                </g>

                {[0, 1, 2].map((i) => (
                  <circle key={`dust-${i}`} cx={110 + i * 12} cy={145} r={2} fill="#D4C9A8"
                    style={{ animation: `tm-dust 0.8s ${i * 0.2}s ease-out infinite` }} />
                ))}
              </svg>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  style={{ fontSize: 18, fontWeight: 700, color: '#5A7247', letterSpacing: '0.02em', margin: 0 }}
                >
                  {LOADING_MESSAGES[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'center' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display: 'block', width: 8, height: 8, borderRadius: '50%', background: '#98D89E',
                  animation: `tm-dot 0.6s ${i * 0.15}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

