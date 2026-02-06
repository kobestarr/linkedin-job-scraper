'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchLoadingStateProps {
  /** Number of jobs found so far (for streaming) */
  foundCount?: number;
  /** Status message override */
  statusMessage?: string;
  /** Configurable cycling messages for white-label clients */
  messages?: string[];
  /** Left readout label (e.g. "TRACK") */
  leftLabel?: string;
  /** Right readout label (e.g. "SCAN") */
  rightLabel?: string;
}

const DEFAULT_MESSAGES = [
  'Scanning LinkedIn...',
  'Finding opportunities...',
  'Analyzing job market...',
  'Matching criteria...',
  'Processing results...',
  'Almost there...',
];

/** Single blip that creeps inward toward center */
interface Blip {
  angle: number;       // current angle (radians)
  radius: number;      // 0 = center, 1 = outer edge
  speed: number;       // inward speed per ms
  wobbleAmp: number;   // angular wobble amplitude
  wobbleFreq: number;  // wobble frequency
  size: number;        // dot radius in px
  phase: number;       // wobble phase offset
}

function spawnBlip(): Blip {
  return {
    angle: Math.random() * Math.PI * 2,
    radius: 0.5 + Math.random() * 0.5,
    speed: 0.00012 + Math.random() * 0.00035,
    wobbleAmp: 0.01 + Math.random() * 0.03,
    wobbleFreq: 0.0006 + Math.random() * 0.0018,
    size: 1.2 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
  };
}

// Green color channels for the Aliens aesthetic
const G = [34, 197, 94] as const;
const gc = (a: number) => `rgba(${G[0]},${G[1]},${G[2]},${a})`;

export function SearchLoadingState({
  foundCount = 0,
  statusMessage,
  messages = DEFAULT_MESSAGES,
  leftLabel = 'TRACK',
  rightLabel = 'SCAN',
}: SearchLoadingStateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const blipsRef = useRef<Blip[]>([]);
  const sweepRef = useRef(0);
  const prevTimeRef = useRef(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // Initialize 14 blips at various distances
  useEffect(() => {
    const blips: Blip[] = [];
    for (let i = 0; i < 14; i++) blips.push(spawnBlip());
    blipsRef.current = blips;
  }, []);

  // Cycle status messages
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((p) => (p + 1) % messages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [messages]);

  // Canvas animation loop
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = prevTimeRef.current ? time - prevTimeRef.current : 16;
    prevTimeRef.current = time;

    // Handle DPR for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(cssH * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = cssW / 2;
    const cy = cssH / 2;
    const maxR = Math.min(cx, cy) - 6;

    ctx.clearRect(0, 0, cssW, cssH);

    // ── Concentric rings ──
    for (let i = 1; i <= 4; i++) {
      const r = (maxR / 4) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = gc(i === 4 ? 0.25 : 0.08);
      ctx.lineWidth = i === 4 ? 1.5 : 0.5;
      ctx.stroke();
    }

    // ── Crosshairs ──
    ctx.strokeStyle = gc(0.06);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.stroke();

    // ── Tick marks around outer ring ──
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const major = i % 3 === 0;
      const inner = maxR - (major ? 7 : 3);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.strokeStyle = gc(major ? 0.25 : 0.1);
      ctx.lineWidth = major ? 1 : 0.5;
      ctx.stroke();
    }

    // ── Sweep line with fading trail ──
    sweepRef.current += dt * 0.0015; // ~0.27 rev/sec
    const sweep = sweepRef.current;

    const trailSteps = 30;
    const trailLen = Math.PI * 0.4; // 72 degree trail
    for (let i = 0; i < trailSteps; i++) {
      const t = i / trailSteps;
      const ta = sweep - t * trailLen;
      const alpha = (1 - t) * 0.12;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ta) * maxR, cy + Math.sin(ta) * maxR);
      ctx.strokeStyle = gc(alpha);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Main sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
    ctx.strokeStyle = gc(0.6);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Outward pulse ring (every 3s) ──
    const pulse = (time % 3000) / 3000;
    const pR = pulse * maxR;
    ctx.beginPath();
    ctx.arc(cx, cy, pR, 0, Math.PI * 2);
    ctx.strokeStyle = gc((1 - pulse) * 0.15);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Blips (jobs approaching) ──
    const blips = blipsRef.current;
    for (let i = 0; i < blips.length; i++) {
      const b = blips[i];

      // Creep inward
      b.radius -= b.speed * dt;

      // Angular wobble for sinister movement
      b.angle += Math.sin(time * b.wobbleFreq + b.phase) * b.wobbleAmp * 0.08;

      // Respawn at edge if reached center
      if (b.radius <= 0.05) {
        blips[i] = spawnBlip();
        continue;
      }

      // Brighter as it gets closer
      const proximity = 1 - b.radius;
      const brightness = 0.2 + proximity * 0.8;
      const bx = cx + Math.cos(b.angle) * (b.radius * maxR);
      const by = cy + Math.sin(b.angle) * (b.radius * maxR);

      // Glow halo
      const gr = b.size * 4;
      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, gr);
      glow.addColorStop(0, gc(brightness * 0.45));
      glow.addColorStop(1, gc(0));
      ctx.beginPath();
      ctx.arc(bx, by, gr, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Sharp dot
      ctx.beginPath();
      ctx.arc(bx, by, b.size, 0, Math.PI * 2);
      ctx.fillStyle = gc(brightness);
      ctx.fill();
    }

    // ── Center dot (you) ──
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = gc(0.9);
    ctx.fill();

    // Center glow
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
    cg.addColorStop(0, gc(0.25));
    cg.addColorStop(1, gc(0));
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Start / stop animation
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const displayMessage = statusMessage || messages[messageIndex];

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-6">
      {/* Radar scope */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-52 h-52 sm:w-64 sm:h-64"
        />
        {/* Corner brackets (Aliens-style HUD frame) */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500/40" />
      </div>

      {/* Digital readout bar */}
      <div className="flex items-center gap-4 font-mono text-xs">
        <span className="text-green-500/60 tracking-widest uppercase">{leftLabel}</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 font-bold tabular-nums text-base">
            {foundCount > 0 ? String(foundCount).padStart(3, '0') : '---'}
          </span>
        </div>
        <span className="text-green-500/60 tracking-widest uppercase">{rightLabel}</span>
      </div>

      {/* Cycling status message */}
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={displayMessage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-green-500/50 font-mono tracking-wide"
          >
            {displayMessage}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Scanline progress bar */}
      <div className="w-52 sm:w-64 h-px bg-green-500/10 overflow-hidden">
        <motion.div
          className="h-full w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)' }}
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
