import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import './DomeGallery.css';

const PRESCHOOL_IMAGES = [
  { src: '/images/IMG20260518114732.jpg', alt: '' },
  { src: '/images/IMG20260518114734.jpg', alt: '' },
  { src: '/images/IMG20260518114919.jpg', alt: '' },
  { src: '/images/IMG20260519102123.jpg', alt: '' },
  { src: '/images/IMG20260519102600.jpg', alt: '' },
  { src: '/images/IMG20260519102701.jpg', alt: '' },
  { src: '/images/IMG20260519102805.jpg', alt: '' },
  { src: '/images/IMG20260519102808.jpg', alt: '' },
  { src: '/images/IMG20260519103145.jpg', alt: '' },
  { src: '/images/IMG20260519103401.jpg', alt: '' },
  { src: '/images/IMG20260519103655.jpg', alt: '' },
  { src: '/images/IMG20260519105231.jpg', alt: '' },
  { src: '/images/IMG20260519105815.jpg', alt: '' },
  { src: '/images/IMG20260519112046.jpg', alt: '' },
  { src: '/images/IMG20260519113433.jpg', alt: '' },
  { src: '/images/IMG20260519113436.jpg', alt: '' },
  { src: '/images/IMG20260519113441.jpg', alt: '' },
  { src: '/images/IMG20260519113442.jpg', alt: '' },
  { src: '/images/IMG20260519114014.jpg', alt: '' },
  { src: '/images/IMG20260519114135.jpg', alt: '' },
  { src: '/images/IMG20260519114138.jpg', alt: '' },
  { src: '/images/IMG20260520110409.jpg', alt: '' },
  { src: '/images/IMG20260520110720.jpg', alt: '' },
  { src: '/images/IMG20260520111056.jpg', alt: '' },
  { src: '/images/IMG20260521101946.jpg', alt: '' },
  { src: '/images/IMG20260521103356.jpg', alt: '' },
  { src: '/images/IMG20260521103425.jpg', alt: '' },
  { src: '/images/IMG20260521103457.jpg', alt: '' },
  { src: '/images/IMG20260521103650.jpg', alt: '' },
  { src: '/images/IMG20260521103820.jpg', alt: '' },
  { src: '/images/IMG20260521103847.jpg', alt: '' },
  { src: '/images/IMG20260521103858.jpg', alt: '' },
  { src: '/images/IMG20260521104152.jpg', alt: '' },
  { src: '/images/IMG20260521104206.jpg', alt: '' },
  { src: '/images/IMG20260521104246.jpg', alt: '' },
  { src: '/images/IMG20260521104305.jpg', alt: '' },
  { src: '/images/IMG20260521104517.jpg', alt: '' },
  { src: '/images/IMG20260521104727.jpg', alt: '' },
  { src: '/images/IMG20260521104743.jpg', alt: '' },
  { src: '/images/IMG20260521110022.jpg', alt: '' },
  { src: '/images/IMG20260521111037.jpg', alt: '' },
  { src: '/images/IMG20260521111141.jpg', alt: '' },
  { src: '/images/IMG20260521111142.jpg', alt: '' },
  { src: '/images/IMG20260521111143.jpg', alt: '' },
  { src: '/images/IMG20260521111147.jpg', alt: '' },
  { src: '/images/IMG20260521111736.jpg', alt: '' },
  { src: '/images/IMG20260521120217.jpg', alt: '' },
  { src: '/images/IMG20260521120218.jpg', alt: '' },
  { src: '/images/IMG20260521120313.jpg', alt: '' },
  { src: '/images/IMG20260521120315.jpg', alt: '' },
  { src: '/images/IMG20260521120358.jpg', alt: '' },
  { src: '/images/IMG20260521120400.jpg', alt: '' },
  { src: '/images/IMG20260521120512.jpg', alt: '' },
  { src: '/images/IMG20260521120513.jpg', alt: '' },
  { src: '/images/IMG20260522103321.jpg', alt: '' },
  { src: '/images/IMG20260522103337.jpg', alt: '' },
  { src: '/images/IMG20260522103339.jpg', alt: '' },
  { src: '/images/IMG20260522103353.jpg', alt: '' },
  { src: '/images/IMG20260522103406.jpg', alt: '' },
  { src: '/images/IMG20260522103408.jpg', alt: '' },
  { src: '/images/IMG20260522103425.jpg', alt: '' },
  { src: '/images/IMG20260522103446.jpg', alt: '' },
  { src: '/images/IMG20260522103508.jpg', alt: '' },
  { src: '/images/IMG20260522103533.jpg', alt: '' },
  { src: '/images/IMG20260522103540.jpg', alt: '' },
  { src: '/images/IMG20260522105703.jpg', alt: '' },
  { src: '/images/IMG20260522105839.jpg', alt: '' },
  { src: '/images/IMG20260522110028.jpg', alt: '' },
  { src: '/images/IMG20260522110106.jpg', alt: '' },
  { src: '/images/IMG20260522110436.jpg', alt: '' },
  { src: '/images/IMG_20260518_171337.jpg', alt: '' },
  { src: '/images/IMG_20260519_111244.jpg', alt: '' },
  { src: '/images/IMG_20260519_111349.jpg', alt: '' },
  { src: '/images/IMG_20260519_115241.jpg', alt: '' },
  { src: '/images/IMG_20260521_112009.jpg', alt: '' },
  { src: '/images/IMG_20260521_112042.jpg', alt: '' },
  { src: '/images/IMG_20260521_112148.jpg', alt: '' },
  { src: '/images/IMG_20260521_164425.jpg', alt: '' },
];

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const normalizeAngle = d => ((d % 360) + 360) % 360;
const wrapAngleSigned = deg => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el, name, fallback) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool, seg) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }));
  }
  if (pool.length > totalSlots) {
    console.warn(
      `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`
    );
  }

  const normalizedImages = pool.map(image => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: image.src || '', alt: image.alt || '' };
  });

  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
    rotation: (Math.sin(i * 137.5) * 1.5).toFixed(1)
  }));
}

function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery({
  images = PRESCHOOL_IMAGES,
  fit = 0.5,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = '#120F17',
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth = '250px',
  openedImageHeight = '350px',
  imageBorderRadius = '30px',
  openedImageBorderRadius = '30px',
  grayscale = true
}) {
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const sphereRef = useRef(null);
  const frameRef = useRef(null);
  const viewerRef = useRef(null);
  const scrimRef = useRef(null);
  const focusedElRef = useRef(null);
  const originalTilePositionRef = useRef(null);

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [swipeStartX, setSwipeStartX] = useState(null);
  const [showDragTooltip, setShowDragTooltip] = useState(false);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);
  const autoRotateRAF = useRef(null);
  const autoRotatePaused = useRef(false);
  const lastAutoRotateTime = useRef(0);
  const autoRotateSpeed = useRef(0);

  const particles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${(i * 7 + 13) % 100}%`,
      top: `${(i * 13 + 7) % 100}%`,
      delay: `${((i * 3) % 8)}s`,
      duration: `${12 + ((i * 5) % 10)}s`,
      size: `${12 + ((i * 7) % 12)}px`,
      type: i % 3 === 0 ? 'leaf' : i % 3 === 1 ? 'star' : 'petal',
      rotDir: i % 2 === 0 ? 1 : -1,
    }));
  }, []);

  const scrollLockedRef = useRef(false);
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return;
    scrollLockedRef.current = true;
    document.body.classList.add('dg-scroll-lock');
  }, []);
  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return;
    if (rootRef.current?.getAttribute('data-enlarging') === 'true') return;
    scrollLockedRef.current = false;
    document.body.classList.remove('dg-scroll-lock');
  }, []);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const updateItemDepths = useCallback((yDeg) => {
    const sphere = sphereRef.current;
    if (!sphere) return;
    const itemsList = sphere.children;
    const len = itemsList.length;
    const unit = 180 / segments;
    for (let i = 0; i < len; i++) {
      const item = itemsList[i];
      const offsetX = parseFloat(item.getAttribute('data-offset-x') || 0);
      const sizeX = parseFloat(item.getAttribute('data-size-x') || 2);
      
      const rotateY = unit * (offsetX + (sizeX - 1) / 2);
      const angleRad = ((rotateY + yDeg) * Math.PI) / 180;
      const cosVal = Math.cos(angleRad);
      
      const opacity = 0.8 + (cosVal >= 0 ? 0.2 : 0.35) * cosVal;
      const blur = cosVal < 0 ? 2.5 * -cosVal : 0;
      
      const imgContainer = item.querySelector('.item__image');
      if (imgContainer) {
        imgContainer.style.opacity = opacity.toFixed(2);
        imgContainer.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
      }
    }
  }, [segments]);

  const applyTransform = useCallback((xDeg, yDeg) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
    updateItemDepths(yDeg);
  }, [updateItemDepths]);

  const startAutoRotate = useCallback(() => {
    if (autoRotateRAF.current) return;
    lastAutoRotateTime.current = performance.now();
    const TARGET_SPEED = 7.2;
    const EASE_IN = 0.04;
    const EASE_OUT = 0.1;
    const STOP_THRESHOLD = 0.002;
    const step = (now) => {
      const dt = Math.min(now - lastAutoRotateTime.current, 100);
      lastAutoRotateTime.current = now;
      if (autoRotatePaused.current) {
        autoRotateSpeed.current -= autoRotateSpeed.current * EASE_OUT;
        if (Math.abs(autoRotateSpeed.current) < STOP_THRESHOLD) {
          autoRotateSpeed.current = 0;
          autoRotateRAF.current = requestAnimationFrame(step);
          return;
        }
      } else {
        autoRotateSpeed.current += (TARGET_SPEED - autoRotateSpeed.current) * EASE_IN;
      }
      if (autoRotateSpeed.current !== 0) {
        const delta = autoRotateSpeed.current * (dt / 1000);
        rotationRef.current.y = wrapAngleSigned(rotationRef.current.y + delta);
        applyTransform(rotationRef.current.x, rotationRef.current.y);
      }
      autoRotateRAF.current = requestAnimationFrame(step);
    };
    autoRotateRAF.current = requestAnimationFrame(step);
  }, []);

  const lockedRadiusRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width),
        h = Math.max(1, cr.height);
      const minDim = Math.min(w, h),
        maxDim = Math.max(w, h),
        aspect = w / h;
      let basis;
      switch (fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = basis * fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, minRadius, maxRadius);
      lockedRadiusRef.current = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`);
      root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
      applyTransform(rotationRef.current.x, rotationRef.current.y);

      const enlargedOverlay = viewerRef.current?.querySelector('.enlarge');
      if (enlargedOverlay && frameRef.current && mainRef.current) {
        const frameR = frameRef.current.getBoundingClientRect();
        const mainR = mainRef.current.getBoundingClientRect();

        const hasCustomSize = openedImageWidth && openedImageHeight;
        if (hasCustomSize) {
          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`;
          document.body.appendChild(tempDiv);
          const tempRect = tempDiv.getBoundingClientRect();
          document.body.removeChild(tempDiv);

          const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2;

          enlargedOverlay.style.left = `${centeredLeft}px`;
          enlargedOverlay.style.top = `${centeredTop}px`;
        } else {
          enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
          enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
          enlargedOverlay.style.width = `${frameR.width}px`;
          enlargedOverlay.style.height = `${frameR.height}px`;
        }
      }
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [
    fit,
    fitBasis,
    minRadius,
    maxRadius,
    padFactor,
    overlayBlurColor,
    grayscale,
    imageBorderRadius,
    openedImageBorderRadius,
    openedImageWidth,
    openedImageHeight
  ]);

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
    startAutoRotate();

    // Auto-rotate for 2 seconds on mount, then pause and show drag tooltip for 3 seconds
    const rotateTimeout = setTimeout(() => {
      autoRotatePaused.current = true;
      setShowDragTooltip(true);

      const tooltipTimeout = setTimeout(() => {
        setShowDragTooltip(false);
      }, 3000);

      return () => clearTimeout(tooltipTimeout);
    }, 2000);

    return () => {
      clearTimeout(rotateTimeout);
      if (autoRotateRAF.current) cancelAnimationFrame(autoRotateRAF.current);
    };
  }, [startAutoRotate]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx, vy) => {
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;
      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null;
          autoRotatePaused.current = false;
          return;
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null;
          autoRotatePaused.current = false;
          return;
        }
        const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return;
        stopInertia();
        autoRotatePaused.current = true;
        const evt = event;
        draggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: evt.clientX, y: evt.clientY };
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;
        const evt = event;
        const dxTotal = evt.clientX - startPosRef.current.x;
        const dyTotal = evt.clientY - startPosRef.current.y;
        if (!movedRef.current) {
          const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
          if (dist2 > 16) movedRef.current = true;
        }
        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg
        );
        const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);
        if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }
        if (last) {
          draggingRef.current = false;
          let [vMagX, vMagY] = velocity;
          const [dirX, dirY] = direction;
          let vx = vMagX * dirX;
          let vy = vMagY * dirY;
          if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement;
            vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
            vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
          }
          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
            startInertia(vx, vy);
          } else {
            autoRotatePaused.current = false;
          }
          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      }
    },
    { target: mainRef, eventOptions: { passive: true } }
  );

  const openItemFromElement = useCallback(
    el => {
      if (openingRef.current) return;
      openingRef.current = true;
      openStartedAtRef.current = performance.now();
      lockScroll();
      autoRotatePaused.current = true;

      const parent = el.parentElement;
      focusedElRef.current = el;
      el.setAttribute('data-focused', 'true');
      const offsetX = getDataNumber(parent, 'offsetX', 0);
      const offsetY = getDataNumber(parent, 'offsetY', 0);
      const sizeX = getDataNumber(parent, 'sizeX', 2);
      const sizeY = getDataNumber(parent, 'sizeY', 2);
      const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
      const parentY = normalizeAngle(parentRot.rotateY);
      const globalY = normalizeAngle(rotationRef.current.y);
      let rotY = -(parentY + globalY) % 360;
      if (rotY < -180) rotY += 360;
      const rotX = -parentRot.rotateX - rotationRef.current.x;
      parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
      parent.style.setProperty('--rot-x-delta', `${rotX}deg`);
      
      const refDiv = document.createElement('div');
      refDiv.className = 'item__image item__image--reference';
      refDiv.style.opacity = '0';
      refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
      parent.appendChild(refDiv);

      void refDiv.offsetHeight;

      const tileR = refDiv.getBoundingClientRect();
      const mainR = mainRef.current?.getBoundingClientRect();
      const frameR = frameRef.current?.getBoundingClientRect();

      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        openingRef.current = false;
        focusedElRef.current = null;
        parent.removeChild(refDiv);
        unlockScroll();
        return;
      }

      originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
      el.style.visibility = 'hidden';
      el.style.zIndex = 0;
      
      const overlay = document.createElement('div');
      overlay.className = 'enlarge';
      overlay.style.position = 'absolute';
      overlay.style.left = frameR.left - mainR.left + 'px';
      overlay.style.top = frameR.top - mainR.top + 'px';
      overlay.style.width = frameR.width + 'px';
      overlay.style.height = frameR.height + 'px';
      overlay.style.opacity = '0';
      overlay.style.zIndex = '30';
      overlay.style.willChange = 'transform, opacity';
      overlay.style.transformOrigin = 'top left';
      overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;
      
      const rawSrc = parent.dataset.src || el.querySelector('img')?.src || '';
      const img = document.createElement('img');
      img.src = rawSrc;
      overlay.appendChild(img);
      viewerRef.current.appendChild(overlay);
      
      const tx0 = tileR.left - frameR.left;
      const ty0 = tileR.top - frameR.top;
      const sx0 = tileR.width / frameR.width;
      const sy0 = tileR.height / frameR.height;

      const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
      const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

      overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;

      setTimeout(() => {
        if (!overlay.parentElement) return;
        overlay.style.opacity = '1';
        overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
        rootRef.current?.setAttribute('data-enlarging', 'true');
      }, 16);

      const wantsResize = openedImageWidth || openedImageHeight;
      
      const transitionEndCallback = () => {
        const itemIdx = parseInt(parent.dataset.index, 10);
        setLightboxIndex(itemIdx);
        overlay.remove();
        if (refDiv) refDiv.remove();
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        el.style.visibility = '';
        focusedElRef.current = null;
        openingRef.current = false;
      };

      if (wantsResize) {
        const onFirstEnd = ev => {
          if (ev.propertyName !== 'transform') return;
          overlay.removeEventListener('transitionend', onFirstEnd);
          const prevTransition = overlay.style.transition;
          overlay.style.transition = 'none';
          const tempWidth = openedImageWidth || `${frameR.width}px`;
          const tempHeight = openedImageHeight || `${frameR.height}px`;
          overlay.style.width = tempWidth;
          overlay.style.height = tempHeight;
          const newRect = overlay.getBoundingClientRect();
          overlay.style.width = frameR.width + 'px';
          overlay.style.height = frameR.height + 'px';
          void overlay.offsetWidth;
          overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
          const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
          requestAnimationFrame(() => {
            overlay.style.left = `${centeredLeft}px`;
            overlay.style.top = `${centeredTop}px`;
            overlay.style.width = tempWidth;
            overlay.style.height = tempHeight;
          });
          const cleanupSecond = ev2 => {
            if (ev2.propertyName !== 'width' && ev2.propertyName !== 'height') return;
            overlay.removeEventListener('transitionend', cleanupSecond);
            overlay.style.transition = prevTransition;
            transitionEndCallback();
          };
          overlay.addEventListener('transitionend', cleanupSecond);
        };
        overlay.addEventListener('transitionend', onFirstEnd);
      } else {
        const onEnd = ev => {
          if (ev.propertyName !== 'transform') return;
          overlay.removeEventListener('transitionend', onEnd);
          transitionEndCallback();
        };
        overlay.addEventListener('transitionend', onEnd);
      }
    },
    [enlargeTransitionMs, lockScroll, openedImageHeight, openedImageWidth, segments, unlockScroll]
  );

  const handleCloseLightbox = useCallback(() => {
    const elIdx = lightboxIndex;
    if (elIdx === null) return;

    setLightboxIndex(null);

    const parent = sphereRef.current?.querySelector(`[data-index="${elIdx}"]`);
    const el = parent?.querySelector('.item__image');
    
    if (!parent || !el) {
      rootRef.current?.removeAttribute('data-enlarging');
      autoRotatePaused.current = false;
      unlockScroll();
      return;
    }

    const tileR = el.getBoundingClientRect();
    const mainR = mainRef.current?.getBoundingClientRect();
    const rootRect = rootRef.current?.getBoundingClientRect();
    const frameR = frameRef.current?.getBoundingClientRect();

    if (!tileR || !mainR || !rootRect || !frameR) {
      rootRef.current?.removeAttribute('data-enlarging');
      autoRotatePaused.current = false;
      unlockScroll();
      return;
    }

    const originalPosRelativeToRoot = {
      left: tileR.left - rootRect.left,
      top: tileR.top - rootRect.top,
      width: tileR.width,
      height: tileR.height
    };

    const hasCustomSize = openedImageWidth && openedImageHeight;
    let centeredLeft, centeredTop, centeredWidth, centeredHeight;

    if (hasCustomSize) {
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`;
      document.body.appendChild(tempDiv);
      const tempRect = tempDiv.getBoundingClientRect();
      document.body.removeChild(tempDiv);

      centeredLeft = frameR.left - rootRect.left + (frameR.width - tempRect.width) / 2;
      centeredTop = frameR.top - rootRect.top + (frameR.height - tempRect.height) / 2;
      centeredWidth = tempRect.width;
      centeredHeight = tempRect.height;
    } else {
      centeredLeft = frameR.left - rootRect.left;
      centeredTop = frameR.top - rootRect.top;
      centeredWidth = frameR.width;
      centeredHeight = frameR.height;
    }

    const animatingOverlay = document.createElement('div');
    animatingOverlay.className = 'enlarge-closing';
    animatingOverlay.style.cssText = `position:absolute;left:${centeredLeft}px;top:${centeredTop}px;width:${centeredWidth}px;height:${centeredHeight}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;

    const img = document.createElement('img');
    img.src = items[elIdx].src;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    animatingOverlay.appendChild(img);

    rootRef.current.appendChild(animatingOverlay);
    void animatingOverlay.getBoundingClientRect();

    el.style.visibility = 'hidden';

    requestAnimationFrame(() => {
      animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
      animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
      animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
      animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
      animatingOverlay.style.opacity = '0';
    });

    const cleanup = () => {
      animatingOverlay.remove();
      el.style.visibility = '';
      rootRef.current?.removeAttribute('data-enlarging');
      autoRotatePaused.current = false;
      unlockScroll();
    };
    animatingOverlay.addEventListener('transitionend', cleanup, { once: true });
  }, [lightboxIndex, items, openedImageWidth, openedImageHeight, enlargeTransitionMs, unlockScroll]);

  const handleNextLightbox = useCallback(() => {
    setLightboxIndex(prev => (prev === null ? null : (prev + 1) % items.length));
  }, [items.length]);

  const handlePrevLightbox = useCallback(() => {
    setLightboxIndex(prev => (prev === null ? null : (prev - 1 + items.length) % items.length));
  }, [items.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const activeItem = items[lightboxIndex];
    if (!activeItem) return;

    const unit = 180 / segments;
    const rotateY = unit * (activeItem.x + (activeItem.sizeX - 1) / 2);
    const targetY = wrapAngleSigned(-rotateY);

    rotationRef.current = { x: 0, y: targetY };
    applyTransform(0, targetY);
  }, [lightboxIndex, items, segments, applyTransform]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNextLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrevLightbox();
      } else if (e.key === 'Escape') {
        handleCloseLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, handleNextLightbox, handlePrevLightbox, handleCloseLightbox]);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      setSwipeStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (swipeStartX === null || !e.changedTouches || e.changedTouches.length === 0) return;
    const diffX = e.changedTouches[0].clientX - swipeStartX;
    const swipeThreshold = 50;
    if (diffX > swipeThreshold) {
      handlePrevLightbox();
    } else if (diffX < -swipeThreshold) {
      handleNextLightbox();
    }
    setSwipeStartX(null);
  };

  const onTileClick = useCallback(
    e => {
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  const onTilePointerUp = useCallback(
    e => {
      if (e.pointerType !== 'touch') return;
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  useEffect(() => {
    return () => {
      document.body.classList.remove('dg-scroll-lock');
      if (autoRotateRAF.current) cancelAnimationFrame(autoRotateRAF.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="sphere-root"
      style={{
        ['--segments-x']: segments,
        ['--segments-y']: segments,
        ['--overlay-blur-color']: overlayBlurColor,
        ['--tile-radius']: imageBorderRadius,
        ['--enlarge-radius']: openedImageBorderRadius,
        ['--image-filter']: grayscale ? 'grayscale(1)' : 'none'
      }}
    >
      {/* Ambient particles */}
      <div className="dg-particles-container">
        {particles.map(p => (
          <div
            key={p.id}
            className={`dg-particle dg-particle--${p.type}`}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
              '--rotation-direction': p.rotDir,
            }}
          />
        ))}
      </div>

      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div
                key={`${it.x},${it.y},${i}`}
                className="item"
                data-index={i}
                data-src={it.src}
                data-offset-x={it.x}
                data-offset-y={it.y}
                data-size-x={it.sizeX}
                data-size-y={it.sizeY}
                style={{
                  ['--offset-x']: it.x,
                  ['--offset-y']: it.y,
                  ['--item-size-x']: it.sizeX,
                  ['--item-size-y']: it.sizeY
                }}
              >
                <div
                  className="item__image"
                  role="button"
                  tabIndex={0}
                  aria-label={it.alt || 'Open image'}
                  onClick={onTileClick}
                  onPointerUp={onTilePointerUp}
                  onMouseEnter={() => { autoRotatePaused.current = true; }}
                  onMouseLeave={() => { if (!draggingRef.current && lightboxIndex === null) autoRotatePaused.current = false; }}
                  style={{ 
                    transform: `rotate(${it.rotation}deg)`,
                    ['--tile-rotation']: `${it.rotation}deg`
                  }}
                >
                  <img src={it.src} draggable={false} alt={it.alt} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />

        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && (
        <div className="dg-lightbox-overlay">
          <div className="dg-lightbox-scrim" onClick={handleCloseLightbox} />
          
          <button className="dg-lightbox-btn dg-lightbox-btn--close" onClick={handleCloseLightbox} aria-label="Close lightbox">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button className="dg-lightbox-btn dg-lightbox-btn--prev" onClick={handlePrevLightbox} aria-label="Previous image">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div 
            className="dg-lightbox-content"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              key={lightboxIndex}
              src={items[lightboxIndex].src} 
              alt={items[lightboxIndex].alt} 
              className="dg-lightbox-img" 
            />
            <div className="dg-lightbox-caption">
              {lightboxIndex + 1} / {items.length}
            </div>
          </div>

          <button className="dg-lightbox-btn dg-lightbox-btn--next" onClick={handleNextLightbox} aria-label="Next image">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Drag to Explore Floating Tooltip */}
      <AnimatePresence>
        {showDragTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 px-5 py-2.5 rounded-full bg-olive/90 backdrop-blur-md text-white text-xs font-semibold shadow-lift tracking-wide border border-white/20"
          >
            <span className="text-sm">✋</span>
            <span>Drag to explore</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
