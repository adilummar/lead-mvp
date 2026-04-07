"use client";

import { useEffect, useRef } from "react";

// ── Pure-JS confetti — no external library needed ─────────────────────
// Draws colourful particles on a canvas and fades them out over ~4 seconds.

const COLORS = [
  "#16a34a", "#059669", "#10b981", "#34d399",  // greens
  "#facc15", "#f97316", "#ec4899", "#8b5cf6",  // pops
  "#ffffff", "#a7f3d0",
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;  // radius
  color: string;
  angle: number;
  spin: number;
  opacity: number;
  shape: "rect" | "circle";
}

function makeParticles(canvas: HTMLCanvasElement, count = 180): Particle[] {
  const cx = canvas.width / 2;
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 10;
    return {
      x: cx,
      y: canvas.height * 0.35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      r: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      opacity: 1,
      shape: Math.random() > 0.4 ? "rect" : "circle",
    };
  });
}

interface ConfettiProps {
  onDone: () => void;
}

export default function Confetti({ onDone }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d")!;
    const particles = makeParticles(canvas);
    let raf: number;
    let done = false;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allGone = true;
      for (const p of particles) {
        p.vy += 0.25;          // gravity
        p.vx *= 0.99;          // air resistance
        p.x  += p.vx;
        p.y  += p.vy;
        p.angle += p.spin;
        p.opacity -= 0.007;
        if (p.opacity > 0) allGone = false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        }
        ctx.restore();
      }

      if (allGone && !done) {
        done = true;
        onDone();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    />
  );
}
