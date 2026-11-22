"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import WorkingSection from "./WorkingSection";

interface FloatingNode {
  id: string;
  label: string;
  x: string;
  y: string;
  delay: string;
}

const FLOATING_NODES: FloatingNode[] = [
  { id: "spec", label: "SPEC Tier", x: "30%", y: "54%", delay: "0s" },
  { id: "bisect", label: "Git Bisect", x: "22%", y: "76%", delay: "1.2s" },
  { id: "ddmin", label: "ddmin Delta", x: "8%", y: "77%", delay: "2.4s" },
  { id: "ast", label: "AST Tier", x: "74%", y: "53%", delay: "1.8s" },
  { id: "exec", label: "EXEC Tier", x: "68%", y: "74%", delay: "0.8s" },
  { id: "defense", label: "Anti-Goodhart", x: "70%", y: "87%", delay: "2.8s" },
];

export default function BugsmithTargetLanding() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Exact slat count matching the reference design (12 slats)
    const SLAT_COUNT = 12;
    let time = 0;

    // Ambient floating star-dust particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.4 + 0.6,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: -Math.random() * 0.25 - 0.08,
      alpha: Math.random() * 0.45 + 0.15,
    }));

    const render = () => {
      time += 0.015;

      ctx.clearRect(0, 0, width, height);

      // Deep void black
      ctx.fillStyle = "#07070a";
      ctx.fillRect(0, 0, width, height);

      const slatWidth = width / SLAT_COUNT;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // 1. Render vertical slats with staggered undulating wave
      for (let i = 0; i < SLAT_COUNT; i++) {
        const slatX = i * slatWidth;
        const normalizedSlat = i / (SLAT_COUNT - 1);

        // Sinusoidal wave propagation with phase shift
        const wave1 = Math.sin(normalizedSlat * Math.PI * 2.2 - time * 1.2);
        const wave2 = Math.cos(normalizedSlat * Math.PI * 1.4 + time * 0.8);
        const mouseShift = (mx - 0.5) * 0.1 * Math.sin(normalizedSlat * Math.PI);

        // Keep the wave centered in the lower half (y: 70% to 80%)
        // so it cradles the central orb and keeps the hero text crystal clear with high contrast
        const waveCenterY = height * (0.72 + wave1 * 0.12 + wave2 * 0.04 + mouseShift + (my - 0.5) * 0.03);

        // Broad, rich flame ribbon thickness
        const ribbonThickness = height * (0.38 + Math.abs(wave1) * 0.06);

        const topY = waveCenterY - ribbonThickness / 2;
        const bottomY = waveCenterY + ribbonThickness / 2;

        // Multi-stop incandescent light gradient with soft celestial falloff
        const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
        grad.addColorStop(0.0, "rgba(7, 7, 10, 0)");
        grad.addColorStop(0.16, "rgba(220, 50, 0, 0.05)");
        grad.addColorStop(0.30, "rgba(255, 75, 0, 0.24)");
        grad.addColorStop(0.42, "rgba(255, 120, 0, 0.68)");
        grad.addColorStop(0.48, "rgba(255, 195, 50, 0.90)");
        grad.addColorStop(0.50, "rgba(255, 252, 235, 0.98)"); // Brilliant white-gold crest
        grad.addColorStop(0.52, "rgba(255, 195, 50, 0.90)");
        grad.addColorStop(0.58, "rgba(255, 120, 0, 0.68)");
        grad.addColorStop(0.70, "rgba(255, 75, 0, 0.24)");
        grad.addColorStop(0.84, "rgba(220, 50, 0, 0.05)");
        grad.addColorStop(1.0, "rgba(7, 7, 10, 0)");

        ctx.fillStyle = grad;
        ctx.fillRect(slatX, 0, slatWidth, height);

        // Warm ambient orange floor glow
        const bottomGlow = ctx.createLinearGradient(0, height * 0.82, 0, height);
        bottomGlow.addColorStop(0, "rgba(255, 80, 0, 0)");
        bottomGlow.addColorStop(1, "rgba(255, 70, 0, 0.14)");
        ctx.fillStyle = bottomGlow;
        ctx.fillRect(slatX, height * 0.82, slatWidth, height * 0.18);

        // 1px Subtle vertical slat dividers
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(slatX, 0);
        ctx.lineTo(slatX, height);
        ctx.stroke();
      }

      // 2. Subtle ambient floating star-dust particles
      ctx.fillStyle = "#ffffff";
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#07070a] text-white overflow-hidden selection:bg-orange-500 selection:text-black">
      {/* 1. Canvas Background Layer: Slat Wave & Ambient Atmosphere */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* 2. Top Navigation Bar */}
      <header className="relative z-30 w-full px-6 sm:px-10 md:px-14 h-24 flex items-center justify-between">
        {/* Brand Logo (Enlarged) */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-orange-500/90 shadow-[0_0_14px_#ff6600]" />
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 shadow-[0_0_8px_#ffaa00]" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white group-hover:text-white transition">
            Bugsmith<span className="text-orange-500">.</span>
          </span>
        </Link>

        {/* Centered Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-normal text-zinc-400 tracking-wide">
          <Link href="/" className="text-white hover:text-white transition">
            Home
          </Link>
          <a href="#how-it-works" className="hover:text-white transition">
            Pipeline
          </a>
          <a href="#stage-02" className="hover:text-white transition">
            Architecture
          </a>
          <a href="#stage-04" className="hover:text-white transition">
            Verification
          </a>
          <a href="#stage-05" className="hover:text-white transition">
            Forensics
          </a>
          <a href="#stage-06" className="hover:text-white transition">
            DPO Pairs
          </a>
          <Link href="/working" className="hover:text-white transition">
            Working
          </Link>
        </nav>

        {/* Right CTA Button (Enlarged & Updated to Try it now) */}
        <div className="flex items-center flex-shrink-0 pr-1 sm:pr-4">
          <Link
            href="/repair"
            className="whitespace-nowrap px-6 sm:px-7 py-2.5 rounded-full text-sm font-semibold tracking-wide bg-white/95 hover:bg-white text-black transition shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:scale-[1.03] active:scale-[0.98]"
          >
            Try it now
          </Link>
        </div>
      </header>

      {/* 3. Hero Section (Aligned to Reference Design) */}
      <main className="relative z-20 flex flex-col items-center justify-start pt-6 sm:pt-10 px-4 text-center max-w-4xl mx-auto">
        {/* Badge Pill: [Get early access] v1.0 (Enlarged) */}
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md mb-8 shadow-md">
          <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_12px_rgba(255,100,0,0.5)]">
            Get early access
          </span>
          <span className="text-sm text-zinc-200 font-mono tracking-tight font-medium pr-1">
            v1.0
          </span>
        </div>

        {/* Main Display Headline (1:1 identical to reference video) */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-[-0.03em] leading-[1.12] text-white mb-5">
          Meet! Bugsmith<br />
          <span className="font-normal text-white/95">
            Built for a verified code future.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-md sm:max-w-xl text-zinc-400 text-sm sm:text-[15px] leading-relaxed font-normal mb-8 px-4">
          Empowering engineering teams with stratified git-forensic agents,
          deterministic bisect, and anti-goodhart verification—built for autonomous scale.
        </p>

        {/* Dual Pill Action Buttons (Enlarged) */}
        <div className="flex items-center gap-4 sm:gap-5 mb-12">
          <Link
            href="/repair"
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-bold bg-white text-black hover:bg-zinc-100 transition shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:scale-[1.04] active:scale-[0.98]"
          >
            Get Started
          </Link>
          <a
            href="#how-it-works"
            className="whitespace-nowrap px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-semibold bg-white/[0.08] hover:bg-white/[0.16] text-white border border-white/20 backdrop-blur-md transition hover:scale-[1.04] active:scale-[0.98]"
          >
            Learn more
          </a>
        </div>

        {/* 4. Lower Visual Focal Point: Central Eclipse Orb & Constellation Nodes */}
        <div className="relative w-full max-w-3xl h-60 sm:h-72 flex items-center justify-center">
          {/* Subtle Constellation Lines & Coordinate Crosshairs */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <span className="absolute left-[18%] top-[35%] text-zinc-500 font-mono text-[9px]">+</span>
            <span className="absolute right-[20%] top-[30%] text-zinc-500 font-mono text-[9px]">+</span>
            <span className="absolute left-[34%] bottom-[18%] text-zinc-500 font-mono text-[9px]">+</span>
            <span className="absolute right-[32%] bottom-[15%] text-zinc-500 font-mono text-[9px]">+</span>
          </div>

          {/* Central Eclipse Orb */}
          <div className="relative group cursor-pointer z-10">
            {/* Outer Deep Radial Glow */}
            <div className="absolute -inset-10 rounded-full bg-gradient-to-t from-orange-600/35 via-amber-500/20 to-transparent blur-2xl opacity-80 group-hover:opacity-100 transition duration-700" />

            {/* Dark Celestial Sphere */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#08080c] border border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.95),inset_0_0_20px_rgba(0,0,0,0.85)] flex items-center justify-center overflow-hidden">
              {/* Internal Glowing Eclipse Lens / Aperture */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
                {/* Interlocking Glowing Ring 1 */}
                <div className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[2.5px] border-amber-400/90 shadow-[0_0_18px_#ff7700] -translate-x-1.5 opacity-90 animate-pulse" />
                {/* Interlocking Glowing Ring 2 */}
                <div className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[2.5px] border-orange-500/90 shadow-[0_0_22px_#ff5500] translate-x-1.5 opacity-90" />
                {/* Center Core Light Flare */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-200 via-orange-400 to-transparent blur-[0.5px] shadow-[0_0_12px_#ffffff]" />
              </div>
            </div>
          </div>

          {/* Floating Constellation Badges */}
          {FLOATING_NODES.map((node) => (
            <div
              key={node.id}
              className="absolute hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.6)] cursor-default transition-all duration-300 hover:border-orange-500/50 hover:shadow-[0_0_14px_rgba(255,100,0,0.3)]"
              style={{
                left: node.x,
                top: node.y,
                animation: `floatAmbient 4s ease-in-out infinite`,
                animationDelay: node.delay,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#ff6600]" />
              <span className="text-[11px] font-mono tracking-tight text-zinc-300">
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* 5. Working of Bugsmith Pipeline Section */}
      <WorkingSection />

      {/* 6. High-Tech Glass Footer */}
      <footer className="relative z-20 w-full border-t border-white/[0.08] bg-[#050508] py-12 px-6 sm:px-10 lg:px-16 text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border border-orange-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <span className="font-semibold text-white tracking-tight text-sm">
              Bugsmith<span className="text-orange-500">.</span>
            </span>
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-500 font-mono">Stratified Git-Forensic Swarm</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-zinc-400">
            <a href="#how-it-works" className="hover:text-white transition">Pipeline</a>
            <a href="#stage-02" className="hover:text-white transition">Agents</a>
            <a href="#stage-05" className="hover:text-white transition">Forensics</a>
            <Link href="/repair" className="hover:text-white transition">Repair Workspace</Link>
          </div>

          <div className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Bugsmith Systems. Deterministic Zero-LLM Grading.
          </div>
        </div>
      </footer>

      {/* Embedded CSS for smooth ambient float animation */}
      <style jsx global>{`
        @keyframes floatAmbient {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}
