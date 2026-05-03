'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowRightIcon, 
  SparklesIcon, 
  PhotoIcon, 
  ChartBarIcon, 
  CodeBracketIcon,
  PlayIcon,
  BoltIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  HeartIcon,
  ShieldCheckIcon,
  ArrowUpIcon,
  StarIcon,
  EnvelopeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  ClipboardIcon,
  CheckIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import {
  MotionSection,
  MotionFooter,
  HoverGlowTitle,
  TypewriterCycle,
  heroContainer,
  heroItem,
  heroStatsGrid,
  staggerCard,
} from '@/components/home/HomeMotion';

// Particle Component
function Particle({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <div
      className="particle animate-star-twinkle absolute rounded-full bg-white/30"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`,
      }}
    />
  );
}

// Floating Orb Component - Removed to improve performance

/** Themed ambient layers so sections aren’t “flat black only” */
function SectionAtmosphere({ variant }: { variant: 'emerald' | 'violet' | 'amber' | 'slate' | 'rose' | 'aurora' }) {
  switch (variant) {
    case 'emerald':
      return (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/[0.28] via-transparent to-transparent" aria-hidden />
          <div className="pointer-events-none absolute -top-48 left-[12%] h-[min(56vw,440px)] w-[min(56vw,440px)] rounded-full bg-emerald-500/[0.14] blur-[100px]" aria-hidden />
          <div className="pointer-events-none absolute bottom-0 right-[8%] h-80 w-80 rounded-full bg-teal-400/[0.1] blur-[88px]" aria-hidden />
        </>
      );
    case 'violet':
      return (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-950/[0.22] via-fuchsia-950/[0.06] to-transparent" aria-hidden />
          <div className="pointer-events-none absolute top-1/4 -right-24 h-[420px] w-[420px] rounded-full bg-violet-600/[0.12] blur-[110px]" aria-hidden />
          <div className="pointer-events-none absolute bottom-8 left-[20%] h-64 w-64 rounded-full bg-indigo-500/[0.09] blur-[72px]" aria-hidden />
        </>
      );
    case 'amber':
      return (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-950/[0.18] via-transparent to-orange-950/[0.12]" aria-hidden />
          <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-amber-500/[0.1] blur-[96px]" aria-hidden />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-[min(90vw,520px)] rounded-full bg-orange-600/[0.08] blur-[80px]" aria-hidden />
        </>
      );
    case 'slate':
      return (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/[0.45] via-[#030712]/80 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:48px_48px]" aria-hidden />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[min(120vw,680px)] w-[min(120vw,680px)] rounded-full bg-cyan-500/[0.06] blur-[120px]" aria-hidden />
        </>
      );
    case 'rose':
      return (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-950/[0.2] via-transparent to-emerald-950/[0.15]" aria-hidden />
          <div className="pointer-events-none absolute -top-24 right-[18%] h-80 w-80 rounded-full bg-rose-500/[0.11] blur-[88px]" aria-hidden />
          <div className="pointer-events-none absolute bottom-12 left-[10%] h-72 w-72 rounded-full bg-emerald-500/[0.09] blur-[76px]" aria-hidden />
        </>
      );
    case 'aurora':
      return (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/[0.35] via-violet-950/[0.2] to-fuchsia-950/[0.25]" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[min(95vw,900px)] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500/[0.15] via-violet-500/[0.12] to-fuchsia-500/[0.14] blur-[90px]" aria-hidden />
        </>
      );
    default:
      return null;
  }
}

const HERO_TYPEWRITER_PHRASES = [
  'Charts • GIFs • Video • 22+ filters',
  'Rust-fast rendering on Node',
  'Ship visuals in TypeScript',
  'One library — canvas to MP4',
] as const;

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; delay: number; duration: number }>>([]);
  const [emailCopied, setEmailCopied] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const heroRef = useRef<HTMLDivElement>(null);

  // Generate particles - Reduced for performance
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 1.5,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setMousePosition({ 
          x: (e.clientX / window.innerWidth) * 100, 
          y: (e.clientY / window.innerHeight) * 100 
        });
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('contact@apexify.dev');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', message: '' });
  };

  const features = [
    {
      name: 'Advanced Image Processing',
      description: '22+ professional filters including blur, sharpen, vintage, and cinematic effects. Image masking, distortion, and warping capabilities.',
      icon: PhotoIcon,
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      glow: 'glow-blue',
      hoverGlow: 'hover:glow-blue',
    },
    {
      name: 'Rich Text Rendering',
      description: 'Enhanced text renderer with custom fonts, text on paths, decorations, gradients, glow effects, and full rotation support.',
      icon: SparklesIcon,
      gradient: 'from-purple-500 via-pink-500 to-purple-600',
      glow: 'glow-purple',
      hoverGlow: 'hover:glow-purple',
    },
    {
      name: 'Chart Generation',
      description: 'Create beautiful bar charts, pie charts, and line charts with customizable styling and data visualization options.',
      icon: ChartBarIcon,
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      glow: 'glow-cyan',
      hoverGlow: 'hover:glow-cyan',
    },
    {
      name: 'Video Processing',
      description: '35+ video features including frame extraction, effects, merging, stabilization, and professional color correction.',
      icon: PlayIcon,
      gradient: 'from-red-500 via-orange-500 to-red-600',
      glow: 'glow-pink',
      hoverGlow: 'hover:glow-pink',
    },
    {
      name: 'TypeScript First',
      description: 'Built with TypeScript for type safety and excellent developer experience. Full type definitions included.',
      icon: CodeBracketIcon,
      gradient: 'from-indigo-500 via-blue-500 to-indigo-600',
      glow: 'glow-blue',
      hoverGlow: 'hover:glow-blue',
    },
    {
      name: 'High Performance',
      description: 'Powered by Rust and optimized for speed. Handle large images and complex operations with ease.',
      icon: BoltIcon,
      gradient: 'from-yellow-500 via-amber-500 to-yellow-600',
      glow: 'glow-cyan',
      hoverGlow: 'hover:glow-cyan',
    },
  ];

  const capabilities = [
    { text: 'Canvas Creation with Gradients & Patterns', icon: '🎨', color: 'from-blue-500 to-cyan-500' },
    { text: 'Shape Drawing (8+ shapes: rectangle, circle, heart, star, polygon)', icon: '🔷', color: 'from-purple-500 to-pink-500' },
    { text: 'Professional Image Filters & Effects', icon: '✨', color: 'from-pink-500 to-rose-500' },
    { text: 'Text Rendering with Advanced Effects', icon: '📝', color: 'from-cyan-500 to-blue-500' },
    { text: 'Chart Generation (Bar, Pie, Line)', icon: '📊', color: 'from-green-500 to-emerald-500' },
    { text: 'GIF Creation from Image Sequences', icon: '🎬', color: 'from-orange-500 to-red-500' },
    { text: 'Video Processing (35+ Features)', icon: '🎥', color: 'from-red-500 to-pink-500' },
    { text: 'Image Stitching & Collage Making', icon: '🖼️', color: 'from-indigo-500 to-purple-500' },
    { text: 'Background Removal & Color Detection', icon: '🎯', color: 'from-blue-500 to-indigo-500' },
    { text: 'Batch Operations & Chain Operations', icon: '⚡', color: 'from-yellow-500 to-amber-500' },
    { text: 'Custom Line Drawing with Smooth Paths', icon: '📈', color: 'from-green-500 to-teal-500' },
    { text: 'Multiple Output Formats (PNG, JPEG, WebP, AVIF)', icon: '💾', color: 'from-gray-500 to-slate-500' },
  ];

  const stats = [
    { value: '30+', label: 'Video Features', icon: PlayIcon, gradient: 'from-blue-400 to-cyan-400' },
    { value: '22+', label: 'Image Filters', icon: PhotoIcon, gradient: 'from-purple-400 to-pink-400' },
    { value: '8+', label: 'Shape Types', icon: SparklesIcon, gradient: 'from-green-400 to-emerald-400' },
    { value: '100%', label: 'TypeScript', icon: CodeBracketIcon, gradient: 'from-indigo-400 to-blue-400' },
  ];

  return (
    <div className="home-root-bg min-h-screen text-white overflow-hidden relative">
      {/* Animated Starfield Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Simplified base gradient - Reduced layers for performance */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 50% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              #000000
            `,
          }}
        />
        
        {/* Subtle drifting grid */}
        <div
          className="absolute inset-0 opacity-[0.22] home-grid-animated pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.09) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.09) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Slow-moving color pools — depth without heavy JS */}
        <div
          className="absolute pointer-events-none home-mesh-a"
          style={{
            left: '8%',
            top: '12%',
            width: 'min(72vw, 520px)',
            height: 'min(72vw, 520px)',
            background: 'radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.35), rgba(139, 92, 246, 0.12) 45%, transparent 70%)',
            filter: 'blur(42px)',
          }}
        />
        <div
          className="absolute pointer-events-none home-mesh-b home-mesh-delay"
          style={{
            right: '5%',
            bottom: '18%',
            width: 'min(65vw, 480px)',
            height: 'min(65vw, 480px)',
            background: 'radial-gradient(circle at 70% 60%, rgba(192, 132, 252, 0.28), rgba(236, 72, 153, 0.1) 50%, transparent 68%)',
            filter: 'blur(44px)',
          }}
        />

        {/* Cursor-adjacent bloom */}
        <div
          className="absolute rounded-full opacity-[0.14] pointer-events-none mix-blend-screen"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            width: '280px',
            height: '280px',
            background:
              'radial-gradient(circle, rgba(125, 211, 252, 0.35) 0%, rgba(59, 130, 246, 0.12) 42%, transparent 68%)',
            transform: 'translate3d(-50%, -50%, 0)',
            filter: 'blur(22px)',
            willChange: 'left, top',
            transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), top 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Particles/Stars */}
        <div className="particle-container">
          {particles.map((particle, i) => (
            <Particle key={i} {...particle} />
          ))}
        </div>
      </div>

      <div className="fixed inset-0 z-[1] pointer-events-none home-texture-noise opacity-[0.035]" aria-hidden />

      <Navbar />

      {/* Hero Section - Completely Redesigned */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-28"
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent z-[5]" aria-hidden />
        {/* Hero Content Container */}
        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Animated badge with glow */}
          <motion.div
            variants={heroItem}
            className="group/badge inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-blue-400/45 mb-8 backdrop-blur-md transition-all duration-700 hover:border-cyan-400/50 hover:shadow-[0_0_48px_-8px_rgba(56,189,248,0.55)] hover:scale-[1.02] cursor-default"
            style={{
              boxShadow: '0 0 28px rgba(59, 130, 246, 0.35)',
            }}
          >
            <StarIcon className="h-5 w-5 text-yellow-400 animate-pulse" />
            <span className="text-sm text-blue-300 font-semibold">v5.3.20 — Blend modes, charts, GIF & frame-to-video</span>
            <SparklesIcon className="h-4 w-4 text-cyan-400 animate-pulse" />
          </motion.div>

          {/* Main heading with advanced glow and animation */}
          <motion.h1
            variants={heroItem}
            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[12rem] font-black mb-6 sm:mb-8 leading-none"
          >
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,880px)] h-[min(42vw,320px)] rounded-[2.5rem] border border-white/[0.07] hero-ring-pulse md:h-[min(38vw,380px)]" aria-hidden />
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(96vw,940px)] h-[min(48vw,360px)] rounded-[3rem] border border-violet-500/10 hero-ring-pulse home-mesh-delay opacity-60 md:h-[min(42vw,400px)]" aria-hidden />
            <span 
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4, #3b82f6)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradient 5s ease infinite',
                filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
              }}
            >
              Apexify.js
              {/* Additional glow overlay */}
              <span 
                className="absolute inset-0 blur-lg opacity-30"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4)',
                  backgroundSize: '300% 300%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient 5s ease infinite',
                  zIndex: -1,
                }}
              >
              Apexify.js
              </span>
            </span>
          </motion.h1>

          {/* Subtitle with text glow */}
          <motion.p
            variants={heroItem}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6"
            style={{
              textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            <HoverGlowTitle className="bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
              The Ultimate Canvas Library
            </HoverGlowTitle>
          </motion.p>

          <motion.p
            variants={heroItem}
            className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-base sm:text-lg md:text-xl font-semibold text-cyan-300/95 mb-6 min-h-[2.25rem] mx-auto max-w-3xl px-2"
          >
            <TypewriterCycle phrases={HERO_TYPEWRITER_PHRASES} />
          </motion.p>

          <motion.p
            variants={heroItem}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed px-2"
          >
            Create stunning visuals with professional-grade canvas rendering, image processing, 
            and text effects. Built with <span className="text-blue-400 font-semibold">TypeScript</span> & <span className="text-orange-400 font-semibold">Rust</span> for blazing-fast performance.
          </motion.p>

          {/* Enhanced CTA Buttons */}
          <motion.div
            variants={heroItem}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-20"
          >
            <Link
              href="/docs#Getting-Started"
              className="group/herocta relative inline-flex items-center justify-center px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl text-white overflow-hidden hover-lift w-full sm:w-auto transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)',
              }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-700 group-hover/herocta:translate-x-full group-hover/herocta:opacity-100" aria-hidden />
              <RocketLaunchIcon className="relative z-10 mr-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-150" style={{ willChange: 'transform' }} />
              <span className="relative z-10">Get Started</span>
              <ArrowRightIcon className="relative z-10 ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-150" style={{ willChange: 'transform' }} />
            </Link>
            
            <a
              href="https://www.npmjs.com/package/apexify.js"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl text-white glass border-2 border-gray-600/45 hover:border-cyan-400/35 hover:shadow-[0_0_28px_-6px_rgba(34,211,238,0.25)] backdrop-blur-md hover-lift transition-all duration-300 w-full sm:w-auto hover:bg-white/[0.04]"
              style={{
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.08)',
              }}
            >
              <CpuChipIcon className="mr-3 h-6 w-6 group-hover:rotate-6 transition-transform duration-150" style={{ willChange: 'transform' }} />
              View on npm
            </a>
          </motion.div>

          {/* Enhanced Stats with Icons */}
          <motion.div
            variants={heroStatsGrid}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
              <motion.div
                key={index}
                variants={heroItem}
                  className="group relative glass border border-gray-700/45 rounded-2xl p-8 hover:border-cyan-500/35 transition-all duration-300 hover-lift overflow-hidden hover:shadow-[0_0_32px_-10px_rgba(56,189,248,0.22)]"
                  style={{
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Gradient background on hover */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-8 transition-opacity duration-150`}
                    style={{ willChange: 'opacity' }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-150`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                    <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* Installation Stats Section - Enhanced */}
      <MotionSection
        id="stats-section"
        className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
      >
        <SectionAtmosphere variant="emerald" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="relative glass-strong border border-gray-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 overflow-hidden hover-lift ring-1 ring-white/[0.06] shadow-[0_0_80px_-24px_rgba(16,185,129,0.25)]">
            {/* Static background glows - Reduced blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            
            <div className="relative z-10">
              <motion.div
                className="mb-12 max-w-3xl mx-auto text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400/85 mb-4">
                  Adoption
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                  <HoverGlowTitle className="bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent text-glow-blue">
                    Trusted by Developers Worldwide
                  </HoverGlowTitle>
                </h2>
                <p className="text-xl text-gray-300">
                  Join thousands of developers who rely on Apexify.js for their projects
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {[
                  { value: '20k+', label: 'Total Downloads', sublabel: 'Growing every day', gradient: 'from-green-400 to-emerald-400', border: 'border-green-500/50' },
                  { value: '2+', label: 'Years Active', sublabel: 'Consistently maintained', gradient: 'from-blue-400 to-cyan-400', border: 'border-blue-500/50' },
                  { value: '100%', label: 'Uptime', sublabel: 'Always available', gradient: 'from-purple-400 to-pink-400', border: 'border-purple-500/50' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={staggerCard}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className={`text-center p-8 glass border ${stat.border} rounded-2xl transition-colors duration-150 hover-lift`}
                    style={{
                      boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
                    }}
                    whileHover={{ y: -4 }}
                  >
                    <div className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-3`}>
                      {stat.value}
                  </div>
                    <div className="text-gray-300 mb-2 font-semibold text-base sm:text-lg">{stat.label}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{stat.sublabel}</div>
                </motion.div>
                ))}
                  </div>
                </div>
          </div>
        </div>
      </MotionSection>

      {/* Features Section - Premium Design */}
      <MotionSection
        id="features-section"
        className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
      >
        <SectionAtmosphere variant="violet" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
            <motion.div
              className="max-w-2xl text-center md:text-left"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '0px 0px -12% 0px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-violet-400/85 mb-4">
                Toolkit
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
                <HoverGlowTitle className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Powerful Features
                </HoverGlowTitle>
              </h2>
              <p className="text-xl text-gray-300 md:max-w-xl">
                Everything you need to create professional graphics and visual content
              </p>
            </motion.div>
            <motion.div
              className="hidden md:block h-px flex-1 max-w-md bg-gradient-to-r from-violet-500/40 via-fuchsia-500/25 to-transparent rounded-full self-center"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ originX: 0 }}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
              <motion.div
                key={feature.name}
                custom={index}
                variants={staggerCard}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                  className="group relative glass-strong border border-gray-700/50 rounded-3xl p-8 hover:border-blue-500/30 transition-colors duration-150 hover-lift overflow-hidden ring-1 ring-white/[0.05]"
                style={{
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.2)',
                }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
              >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-3xl bg-gradient-to-r ${feature.gradient} opacity-95`} aria-hidden />
                  {/* Light gradient glow on hover - No blur for performance */}
                  <div 
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-150 -z-10`}
                    style={{ willChange: 'opacity' }}
                  />
                
                <div className="relative z-10">
                    <div 
                      className={`inline-flex p-5 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 transition-transform duration-150 group-hover:scale-105`}
                      style={{
                        boxShadow: `0 0 20px rgba(59, 130, 246, 0.4)`,
                        willChange: 'transform',
                      }}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                  </div>
                    <h3 className="text-2xl font-bold text-white mb-4 transition-colors duration-150 group-hover:text-blue-300">
                    {feature.name}
                  </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </MotionSection>

      {/* Capabilities Section - Enhanced */}
      <MotionSection
        id="capabilities-section"
        className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
      >
        <SectionAtmosphere variant="amber" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="relative glass-strong border border-gray-700/50 rounded-3xl px-8 pt-8 pb-12 md:px-12 md:pt-12 md:pb-14 overflow-hidden ring-1 ring-amber-500/10 shadow-[0_0_70px_-28px_rgba(245,158,11,0.35)]">
            {/* Static background glows - Reduced blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            
            <div className="relative z-10">
              <motion.div
                className="mb-8 sm:mb-12 max-w-4xl mx-auto text-center"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-amber-400/85 mb-4">
                  Possibilities
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black">
                  <HoverGlowTitle className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    What You Can Build
                  </HoverGlowTitle>
                </h2>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {capabilities.map((capability, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={staggerCard}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.12 }}
                    className="group flex items-start gap-4 p-5 glass border border-gray-700/30 hover:border-blue-500/40 rounded-xl transition-colors duration-150 hover-lift"
                    whileHover={{ scale: 1.02, borderColor: 'rgba(96, 165, 250, 0.35)' }}
                  >
                    <span className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-150" style={{ willChange: 'transform' }}>
                      {capability.icon}
                    </span>
                    <p className="text-gray-300 group-hover:text-white transition-colors duration-150 font-medium">{capability.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Why Choose Section - Keep existing design but enhance */}
      <MotionSection
        id="comparison-section"
        className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
      >
        <SectionAtmosphere variant="slate" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            className="mb-16 max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 mb-4">
              Comparison
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <HoverGlowTitle className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why Choose Apexify.js?
              </HoverGlowTitle>
            </h2>
            <p className="text-xl text-gray-300">
              See how we compare to other canvas and image processing libraries
            </p>
          </motion.div>

          <motion.div
            className="relative glass-strong border border-gray-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 overflow-hidden hover-lift backdrop-blur-xl ring-1 ring-cyan-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_80px_-30px_rgba(56,189,248,0.2)]"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Static background glows - Reduced blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            
            <div className="relative z-10 overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full border-collapse min-w-[600px] sm:min-w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-4 lg:px-6 text-gray-300 font-semibold text-xs sm:text-sm">Feature</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6">
                      <div className="inline-flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm">Apexify.js</span>
                        <span className="text-green-400 text-sm sm:text-base">✓</span>
                      </div>
                    </th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6 text-gray-400 text-xs sm:text-sm">node-canvas</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6 text-gray-400 text-xs sm:text-sm">sharp</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6 text-gray-400 text-xs sm:text-sm">jimp</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6 text-gray-400 text-xs sm:text-sm">fabric.js</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {[
                    { feature: 'Performance (Rust-based)', apexify: true, nodeCanvas: true, sharp: true, jimp: false, fabric: false },
                    { feature: 'Memory Efficiency (Optimized RAM)', apexify: true, nodeCanvas: true, sharp: true, jimp: false, fabric: false },
                    { feature: 'TypeScript Support', apexify: true, nodeCanvas: true, sharp: true, jimp: false, fabric: true },
                    { feature: 'Video Processing (35+ Features)', apexify: true, nodeCanvas: false, sharp: false, jimp: false, fabric: false },
                    { feature: 'Image Filters (22+ Professional)', apexify: true, nodeCanvas: false, sharp: true, jimp: true, fabric: false },
                    { feature: 'Chart Generation', apexify: true, nodeCanvas: false, sharp: false, jimp: false, fabric: false },
                    { feature: 'GIF Creation', apexify: true, nodeCanvas: false, sharp: false, jimp: false, fabric: false },
                    { feature: 'Active Maintenance', apexify: true, nodeCanvas: true, sharp: true, jimp: false, fabric: true },
                    { feature: '24/7 Owner Support', apexify: true, nodeCanvas: false, sharp: false, jimp: false, fabric: false },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/20 transition-colors duration-100">
                      <td className="py-3 sm:py-4 px-3 sm:px-4 lg:px-6 text-gray-300 text-xs sm:text-sm">{row.feature}</td>
                      <td className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6">
                        <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mx-auto" />
                    </td>
                      <td className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6">
                        {row.nodeCanvas ? (
                          <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400/50 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400/50 mx-auto" />
                        )}
                    </td>
                      <td className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6">
                        {row.sharp ? (
                          <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400/50 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400/50 mx-auto" />
                        )}
                    </td>
                      <td className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6">
                        {row.jimp ? (
                          <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400/50 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400/50 mx-auto" />
                        )}
                    </td>
                      <td className="text-center py-3 sm:py-4 px-3 sm:px-4 lg:px-6">
                        {row.fabric ? (
                          <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400/50 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400/50 mx-auto" />
                        )}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 glass border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-4">
                <BoltIcon className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Performance Optimizations</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Apexify.js is built on <strong className="text-white">@napi-rs/canvas</strong> (Rust-based) for maximum performance. 
                    We've implemented memory-efficient algorithms, optimized image processing pipelines, and smart caching mechanisms 
                    to ensure minimal RAM usage even with large images and complex operations. Our batch and chain operations reduce 
                    overhead by processing multiple images efficiently.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </MotionSection>

      {/* Owner Support Section - Enhanced */}
      <MotionSection
        id="support-section"
        className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
      >
        <SectionAtmosphere variant="rose" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            className="mb-16 max-w-3xl md:mr-auto md:text-left text-center"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-rose-400/80 mb-4">
              Commitment
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <HoverGlowTitle className="bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Always Supported, Never Abandoned
              </HoverGlowTitle>
            </h2>
            <p className="text-xl text-gray-300">
              Unlike many npm packages that get deprecated or left unmaintained, Apexify.js is actively developed and supported
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {[
              { 
                icon: HeartIcon, 
                title: 'Owner Always Responds', 
                description: 'Need help? Found a bug? The package owner personally responds to every issue, question, and feature request. No automated responses or ignored tickets.', 
                color: 'green', 
                gradient: 'from-green-500 to-emerald-600', 
                textColor: 'text-green-400', 
                borderColor: 'border-green-500/40' 
              },
              { 
                icon: SparklesIcon, 
                title: 'Constantly Updated', 
                description: 'Regular updates with new features, bug fixes, and performance improvements. We don\'t leave the package unmaintained for months - expect frequent releases and improvements.', 
                color: 'blue', 
                gradient: 'from-blue-500 to-cyan-600', 
                textColor: 'text-blue-400', 
                borderColor: 'border-blue-500/40' 
              },
              { 
                icon: ShieldCheckIcon, 
                title: 'Bug Fixes & Security', 
                description: 'Critical bugs are fixed within hours, not weeks. Security vulnerabilities are patched immediately. Your projects stay safe and functional.', 
                color: 'purple', 
                gradient: 'from-purple-500 to-pink-600', 
                textColor: 'text-purple-400', 
                borderColor: 'border-purple-500/40' 
              },
              { 
                icon: BoltIcon, 
                title: 'New Features Regularly', 
                description: 'We\'re constantly adding new features based on community feedback. From video processing to advanced filters, Apexify.js keeps evolving to meet your needs.', 
                color: 'yellow', 
                gradient: 'from-yellow-500 to-amber-600', 
                textColor: 'text-yellow-400', 
                borderColor: 'border-yellow-500/40' 
              },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={idx}
                  custom={idx}
                  variants={staggerCard}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  className={`glass-strong border ${item.borderColor} rounded-2xl p-8 transition-colors duration-150 hover-lift group overflow-hidden`}
                  style={{
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.2)',
                  }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-150`} style={{ boxShadow: `0 0 20px rgba(59, 130, 246, 0.4)`, willChange: 'transform' }}>
                    <IconComponent className="h-8 w-8 text-white" />
              </div>
                  <h3 className="text-2xl font-bold text-white mb-4 transition-colors duration-200 group-hover:text-cyan-200">{item.title}</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">{item.description}</p>
                  <div className={`flex items-center gap-2 ${item.textColor} font-semibold`}>
                <ClockIcon className="h-5 w-5" />
                    <span>{idx === 0 ? '24/7 Support Available' : idx === 1 ? 'Active Development' : idx === 2 ? 'Rapid Response Time' : 'Feature-Rich Updates'}</span>
              </div>
            </motion.div>
              );
            })}
            </div>

          <motion.div
            className="mt-12 text-center p-8 glass border border-green-500/30 rounded-2xl hover-lift"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-lg text-gray-200 mb-4">
              <strong className="text-white text-xl">Never deprecated. Never abandoned. Always improving.</strong>
            </p>
            <p className="text-gray-400">
              Choose a package that's here to stay and grow with your projects
            </p>
          </motion.div>
        </div>
      </MotionSection>

      {/* Get Started Section - Enhanced */}
      <MotionSection
        id="get-started-section"
        className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
      >
        <SectionAtmosphere variant="aurora" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-sky-400/85 mb-4">
              Next step
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <HoverGlowTitle className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Get Started?
              </HoverGlowTitle>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of developers building amazing visuals with Apexify.js
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {[
              { 
                icon: RocketLaunchIcon, 
                title: 'Install in Seconds', 
                description: 'Get started with a single npm install. No complex setup or configuration needed.', 
                color: 'blue', 
                gradient: 'from-blue-500 to-blue-600', 
                textColor: 'text-blue-400', 
                command: 'npm install apexify.js →' 
              },
              { 
                icon: CodeBracketIcon, 
                title: 'TypeScript Ready', 
                description: 'Full TypeScript support with comprehensive type definitions and IntelliSense.', 
                color: 'purple', 
                gradient: 'from-purple-500 to-purple-600', 
                textColor: 'text-purple-400', 
                command: '100% Type Safe →' 
              },
              { 
                icon: SparklesIcon, 
                title: 'Comprehensive Docs', 
                description: 'Detailed documentation with examples, guides, and API references for every feature.', 
                color: 'pink', 
                gradient: 'from-pink-500 to-pink-600', 
                textColor: 'text-pink-400', 
                command: 'Explore Docs →' 
              },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              const borderAccent =
                item.color === 'blue'
                  ? 'border-blue-500/35 ring-blue-500/10'
                  : item.color === 'purple'
                    ? 'border-purple-500/35 ring-purple-500/10'
                    : 'border-pink-500/35 ring-pink-500/10';
              return (
                <motion.div
                  key={idx}
                  custom={idx}
                  variants={staggerCard}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.12 }}
                  className={`glass-strong border rounded-2xl p-8 transition-colors duration-150 hover-lift group ring-1 ${borderAccent}`}
                  style={{
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.2)',
                  }}
                  whileHover={{ y: -8, rotate: idx === 1 ? -1 : idx === 2 ? 1 : 0 }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-150`} style={{ boxShadow: `0 0 20px rgba(59, 130, 246, 0.4)`, willChange: 'transform' }}>
                    <IconComponent className="h-8 w-8 text-white" />
              </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-white">{item.title}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">{item.description}</p>
                  <div className={`${item.textColor} font-semibold`}>{item.command}</div>
                </motion.div>
              );
            })}
            </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.55 }}
          >
            <Link
              href="/docs#Getting-Started"
              className="group inline-flex items-center justify-center px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 text-lg sm:text-xl font-bold rounded-xl sm:rounded-2xl text-white hover-lift w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite',
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(139, 92, 246, 0.4)',
              }}
            >
              <RocketLaunchIcon className="mr-3 h-7 w-7 group-hover:rotate-6 transition-transform duration-150" style={{ willChange: 'transform' }} />
              Start Building Now
              <ArrowRightIcon className="ml-3 h-7 w-7 group-hover:translate-x-1 transition-transform duration-150" style={{ willChange: 'transform' }} />
            </Link>
              </motion.div>
        </div>
      </MotionSection>

   


      {/* Footer - Enhanced */}
      <MotionFooter className="relative border-t border-gray-800/50 mt-16 sm:mt-24 lg:mt-32 bg-gradient-to-b from-transparent via-gray-900/30 to-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="col-span-1 sm:col-span-2 md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Apexify.js
                </span>
              </Link>
              <p className="text-sm sm:text-base text-gray-400 mb-6 max-w-md leading-relaxed">
                The ultimate TypeScript canvas library for Node.js. Create stunning visuals with professional-grade rendering and image processing.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/EIAS79/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl glass border border-gray-700 hover:border-blue-500/40 flex items-center justify-center transition-colors duration-150 hover-lift group"
                  aria-label="GitHub"
                >
                  <svg className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors duration-150" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a
                  href="https://www.npmjs.com/package/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl glass border border-gray-700 hover:border-red-500/40 flex items-center justify-center transition-colors duration-150 hover-lift group"
                  aria-label="npm"
                >
                  <svg className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors duration-150" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.666H5.334v-4H3.999v4H1.335V8.667h5.331v5.333zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.337v4h-1.335v-4h-1.33v4h-2.671V8.667h8.003v5.333z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Documentation</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/docs#Getting-Started" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-gray-400 hover:text-white transition-colors duration-200">
                    All Docs
                  </Link>
                </li>
                <li>
                  <Link href="/docs#Changelog" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/EIAS79/apexify.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-150"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.npmjs.com/package/apexify.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-150"
                  >
                    npm Package
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/EIAS79/apexify.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-150"
                  >
                    Report Issue
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Apexify.js. Built with{' '}
                <span className="text-red-500 animate-pulse inline-block">❤️</span>{' '}
                by the community
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full glass border border-blue-500/30">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  v5.3.20
                </span>
              </div>
            </div>
          </div>
        </div>
      </MotionFooter>

      {/* Enhanced Scroll to Top Button */}
      <motion.button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-4 sm:p-5 rounded-full hover-lift group ${
          showScrollTop 
            ? 'pointer-events-auto' 
            : 'pointer-events-none'
        }`}
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
          backgroundSize: '200% 200%',
          animation: 'gradient 3s ease infinite',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4)',
        }}
        aria-label="Scroll to top"
        initial={false}
        animate={
          showScrollTop
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 16, scale: 0.85 }
        }
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
      >
        <ArrowUpIcon className="h-6 w-6 text-white group-hover:-translate-y-1 transition-transform duration-150" style={{ willChange: 'transform' }} />
      </motion.button>
    </div>
  );
}