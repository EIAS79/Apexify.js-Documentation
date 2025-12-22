'use client';

import Link from 'next/link';
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
  StarIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';

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

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; delay: number; duration: number }>>([]);
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
    setIsVisible(true);
    
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

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set(prev).add(entry.target.id));
        }
      });
    }, observerOptions);

    const timer = setTimeout(() => {
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section) => {
        observer.observe(section);
      });
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
      description: '30+ video features including frame extraction, effects, merging, stabilization, and professional color correction.',
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
    { text: 'Video Processing (30+ Features)', icon: '🎥', color: 'from-red-500 to-pink-500' },
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
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

        {/* Static grid - No animation for better performance */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Minimal static orbs - Reduced for performance */}
        <div
          className="absolute rounded-full opacity-8 pointer-events-none"
          style={{
            left: '20%',
            top: '20%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent)',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(30px)',
          }}
        />
        <div
          className="absolute rounded-full opacity-8 pointer-events-none"
          style={{
            left: '80%',
            top: '60%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent)',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(30px)',
          }}
        />
        
        {/* Minimal mouse-following effect - Very light for performance */}
        <div
          className="absolute rounded-full opacity-10 pointer-events-none"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent)',
            transform: 'translate3d(-50%, -50%, 0)',
            filter: 'blur(20px)',
            willChange: 'left, top',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Particles/Stars */}
        <div className="particle-container">
          {particles.map((particle, i) => (
            <Particle key={i} {...particle} />
          ))}
        </div>
      </div>

      <Navbar />

      {/* Hero Section - Completely Redesigned */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-36"
      >
        {/* Hero Content Container */}
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Animated badge with glow */}
          <div 
            className={`inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-blue-500/50 mb-8 backdrop-blur-md transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
            }}
          >
            <StarIcon className="h-5 w-5 text-yellow-400 animate-pulse" />
            <span className="text-sm text-blue-300 font-semibold">v5.1.0 - Now with 30+ Video Features</span>
            <SparklesIcon className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>

          {/* Main heading with advanced glow and animation */}
          <h1 
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[12rem] font-black mb-6 sm:mb-8 transition-all duration-1000 delay-200 leading-none ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
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
          </h1>

          {/* Subtitle with text glow */}
          <p 
            className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            <span className="bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
              The Ultimate Canvas Library
            </span>
          </p>

          <p 
            className={`text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed px-2 transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Create stunning visuals with professional-grade canvas rendering, image processing, 
            and text effects. Built with <span className="text-blue-400 font-semibold">TypeScript</span> & <span className="text-orange-400 font-semibold">Rust</span> for blazing-fast performance.
          </p>

          {/* Enhanced CTA Buttons */}
          <div 
            className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-20 transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link
              href="/docs#Getting-Started"
              className="group relative inline-flex items-center justify-center px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl text-white overflow-hidden hover-lift w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)',
              }}
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              <RocketLaunchIcon className="relative z-10 mr-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-150" style={{ willChange: 'transform' }} />
              <span className="relative z-10">Get Started</span>
              <ArrowRightIcon className="relative z-10 ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-150" style={{ willChange: 'transform' }} />
            </Link>
            
            <a
              href="https://www.npmjs.com/package/apexify.js"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl text-white glass border-2 border-gray-600/50 hover:border-gray-400/60 backdrop-blur-md hover-lift transition-colors duration-150 w-full sm:w-auto"
              style={{
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
              }}
            >
              <CpuChipIcon className="mr-3 h-6 w-6 group-hover:rotate-6 transition-transform duration-150" style={{ willChange: 'transform' }} />
              View on npm
            </a>
          </div>

          {/* Enhanced Stats with Icons */}
          <div 
            className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index}
                  className="group relative glass border border-gray-700/50 rounded-2xl p-8 hover:border-blue-500/40 transition-colors duration-150 hover-lift overflow-hidden"
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce opacity-50"
          style={{ animationDuration: '2s' }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </div>
      </section>

      {/* Installation Stats Section - Enhanced */}
      <section 
        id="stats-section"
        data-section
        className={`relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          visibleSections.has('stats-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative glass-strong border border-gray-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 overflow-hidden hover-lift">
            {/* Static background glows - Reduced blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                  <span className="bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent text-glow-blue">
                    Trusted by Developers Worldwide
                  </span>
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Join thousands of developers who rely on Apexify.js for their projects
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {[
                  { value: '20k+', label: 'Total Downloads', sublabel: 'Growing every day', gradient: 'from-green-400 to-emerald-400', border: 'border-green-500/50' },
                  { value: '2+', label: 'Years Active', sublabel: 'Consistently maintained', gradient: 'from-blue-400 to-cyan-400', border: 'border-blue-500/50' },
                  { value: '100%', label: 'Uptime', sublabel: 'Always available', gradient: 'from-purple-400 to-pink-400', border: 'border-purple-500/50' },
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className={`text-center p-8 glass border ${stat.border} rounded-2xl transition-colors duration-150 hover-lift`}
                    style={{
                      boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-3`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-300 mb-2 font-semibold text-base sm:text-lg">{stat.label}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{stat.sublabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Design */}
      <section 
        id="features-section"
        data-section
        className={`relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          visibleSections.has('features-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to create professional graphics and visual content
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="group relative glass-strong border border-gray-700/50 rounded-3xl p-8 hover:border-blue-500/30 transition-colors duration-150 hover-lift overflow-hidden"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.2)',
                  }}
                >
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Section - Enhanced */}
      <section 
        id="capabilities-section"
        data-section
        className={`relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          visibleSections.has('capabilities-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative glass-strong border border-gray-700/50 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Static background glows - Reduced blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-2xl -z-10 opacity-50" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center mb-8 sm:mb-12">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  What You Can Build
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {capabilities.map((capability, index) => (
                  <div 
                    key={index} 
                    className="group flex items-start gap-4 p-5 glass border border-gray-700/30 hover:border-blue-500/40 rounded-xl transition-colors duration-150 hover-lift"
                  >
                    <span className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-150" style={{ willChange: 'transform' }}>
                      {capability.icon}
                    </span>
                    <p className="text-gray-300 group-hover:text-white transition-colors duration-150 font-medium">{capability.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section - Keep existing design but enhance */}
      <section 
        id="comparison-section"
        data-section
        className={`relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          visibleSections.has('comparison-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why Choose Apexify.js?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              See how we compare to other canvas and image processing libraries
            </p>
          </div>

          <div className="relative glass-strong border border-gray-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 overflow-hidden hover-lift">
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
                    { feature: 'Video Processing (30+ Features)', apexify: true, nodeCanvas: false, sharp: false, jimp: false, fabric: false },
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
          </div>
        </div>
      </section>

      {/* Owner Support Section - Enhanced */}
      <section 
        id="support-section"
        data-section
        className={`relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          visibleSections.has('support-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Always Supported, Never Abandoned
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Unlike many npm packages that get deprecated or left unmaintained, Apexify.js is actively developed and supported
            </p>
          </div>

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
                <div 
                  key={idx}
                  className={`glass-strong border ${item.borderColor} rounded-2xl p-8 transition-colors duration-150 hover-lift group overflow-hidden`}
                  style={{
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-150`} style={{ boxShadow: `0 0 20px rgba(59, 130, 246, 0.4)`, willChange: 'transform' }}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">{item.description}</p>
                  <div className={`flex items-center gap-2 ${item.textColor} font-semibold`}>
                    <ClockIcon className="h-5 w-5" />
                    <span>{idx === 0 ? '24/7 Support Available' : idx === 1 ? 'Active Development' : idx === 2 ? 'Rapid Response Time' : 'Feature-Rich Updates'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center p-8 glass border border-green-500/30 rounded-2xl hover-lift">
            <p className="text-lg text-gray-200 mb-4">
              <strong className="text-white text-xl">Never deprecated. Never abandoned. Always improving.</strong>
            </p>
            <p className="text-gray-400">
              Choose a package that's here to stay and grow with your projects
            </p>
          </div>
        </div>
      </section>

      {/* Get Started Section - Enhanced */}
      <section 
        id="get-started-section"
        data-section
        className={`relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          visibleSections.has('get-started-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Get Started?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of developers building amazing visuals with Apexify.js
            </p>
          </div>

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
              return (
                <div 
                  key={idx}
                  className={`glass-strong border border-${item.color}-500/30 rounded-2xl p-8 transition-colors duration-150 hover-lift group`}
                  style={{
                    boxShadow: '0 0 30px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-150`} style={{ boxShadow: `0 0 20px rgba(59, 130, 246, 0.4)`, willChange: 'transform' }}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">{item.description}</p>
                  <div className={`${item.textColor} font-semibold`}>{item.command}</div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
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
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="relative border-t border-gray-800/50 mt-16 sm:mt-24 lg:mt-32 bg-gradient-to-b from-transparent via-gray-900/30 to-black">
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
                  v5.1.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-4 sm:p-5 rounded-full hover-lift group ${
          showScrollTop 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
          backgroundSize: '200% 200%',
          animation: 'gradient 3s ease infinite',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4)',
        }}
        aria-label="Scroll to top"
      >
        <ArrowUpIcon className="h-6 w-6 text-white group-hover:-translate-y-1 transition-transform duration-150" style={{ willChange: 'transform' }} />
      </button>
    </div>
  );
}