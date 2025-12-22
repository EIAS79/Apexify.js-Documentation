'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/50',
    },
    {
      name: 'Rich Text Rendering',
      description: 'Enhanced text renderer with custom fonts, text on paths, decorations, gradients, glow effects, and full rotation support.',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
    },
    {
      name: 'Chart Generation',
      description: 'Create beautiful bar charts, pie charts, and line charts with customizable styling and data visualization options.',
      icon: ChartBarIcon,
      gradient: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/50',
    },
    {
      name: 'Video Processing',
      description: '30+ video features including frame extraction, effects, merging, stabilization, and professional color correction.',
      icon: PlayIcon,
      gradient: 'from-red-500 to-orange-500',
      glow: 'shadow-red-500/50',
    },
    {
      name: 'TypeScript First',
      description: 'Built with TypeScript for type safety and excellent developer experience. Full type definitions included.',
      icon: CodeBracketIcon,
      gradient: 'from-indigo-500 to-blue-500',
      glow: 'shadow-indigo-500/50',
    },
    {
      name: 'High Performance',
      description: 'Powered by Rust and optimized for speed. Handle large images and complex operations with ease.',
      icon: BoltIcon,
      gradient: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/50',
    },
  ];

  const capabilities = [
    { text: 'Canvas Creation with Gradients & Patterns', icon: '🎨' },
    { text: 'Shape Drawing (8+ shapes: rectangle, circle, heart, star, polygon)', icon: '🔷' },
    { text: 'Professional Image Filters & Effects', icon: '✨' },
    { text: 'Text Rendering with Advanced Effects', icon: '📝' },
    { text: 'Chart Generation (Bar, Pie, Line)', icon: '📊' },
    { text: 'GIF Creation from Image Sequences', icon: '🎬' },
    { text: 'Video Processing (30+ Features)', icon: '🎥' },
    { text: 'Image Stitching & Collage Making', icon: '🖼️' },
    { text: 'Background Removal & Color Detection', icon: '🎯' },
    { text: 'Batch Operations & Chain Operations', icon: '⚡' },
    { text: 'Custom Line Drawing with Smooth Paths', icon: '📈' },
    { text: 'Multiple Output Formats (PNG, JPEG, WebP, AVIF)', icon: '💾' },
  ];

  const stats = [
    { value: '30+', label: 'Video Features' },
    { value: '22+', label: 'Image Filters' },
    { value: '8+', label: 'Shape Types' },
    { value: '100%', label: 'TypeScript' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background with Radial Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Dynamic gradient that follows mouse */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-30 transition-all duration-1000 ease-out"
          style={{
            left: `${mousePosition.x - 400}px`,
            top: `${mousePosition.y - 400}px`,
            background: 'radial-gradient(circle, rgba(30, 58, 138, 0.25), rgba(15, 23, 42, 0.3), rgba(0, 0, 0, 0.4), transparent 70%)',
          }}
        />
        
        {/* Static radial gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-950/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-slate-950/40 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-[700px] h-[700px] bg-black/50 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Animated badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-8 backdrop-blur-sm transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <SparklesIcon className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-300 font-medium">v5.1.0 - Now with 30+ Video Features</span>
          </div>

          {/* Main heading with glow effect */}
          <h1 className={`text-6xl md:text-8xl lg:text-9xl font-extrabold mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_30px_rgba(30,58,138,0.6)]">
              Apexify.js
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-2xl md:text-3xl lg:text-4xl font-bold text-gray-200 mb-4 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            The Ultimate Canvas Library
          </p>
          <p className={`text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Create stunning visuals with professional-grade canvas rendering, image processing, 
            and text effects. Built with TypeScript & Rust for blazing-fast performance.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              href="/docs#Getting-Started"
              className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-900/70 hover:scale-105"
            >
              <RocketLaunchIcon className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              Get Started
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://www.npmjs.com/package/apexify.js"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-white border-2 border-gray-600 hover:border-gray-400 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 hover:scale-105"
            >
              <CpuChipIcon className="mr-2 h-5 w-5" />
              View on npm
            </a>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </section>

      {/* Installation Stats Section */}
      <section 
        id="stats-section"
        data-section
        className={`relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-gray-900/30 to-transparent transition-all duration-1000 ${
          visibleSections.has('stats-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Trusted by Developers Worldwide
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  Join thousands of developers who rely on Apexify.js for their projects
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                    20k+
                  </div>
                  <div className="text-gray-400 mb-1">Total Downloads</div>
                  <div className="text-sm text-gray-500">Growing every day</div>
                </div>
                
                <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    2+
                  </div>
                  <div className="text-gray-400 mb-1">Years Active</div>
                  <div className="text-sm text-gray-500">Consistently maintained</div>
                </div>
                
                <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    100%
                  </div>
                  <div className="text-gray-400 mb-1">Uptime</div>
                  <div className="text-sm text-gray-500">Always available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features-section"
        data-section
        className={`relative py-32 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('features-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create professional graphics and visual content
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-transparent transition-all duration-500 hover:scale-105"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg ${feature.glow}`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                    {feature.name}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section 
        id="capabilities-section"
        data-section
        className={`relative py-32 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('capabilities-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                What You Can Build
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {capabilities.map((capability, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 hover:scale-105 group"
                  >
                    <span className="text-2xl flex-shrink-0 group-hover:scale-125 transition-transform duration-300">
                      {capability.icon}
                    </span>
                    <p className="text-gray-300 group-hover:text-white transition-colors">{capability.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Apexify.js - Comparison Section */}
      <section 
        id="comparison-section"
        data-section
        className={`relative py-32 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('comparison-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Why Choose Apexify.js?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See how we compare to other canvas and image processing libraries
            </p>
          </div>

          <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Feature</th>
                    <th className="text-center py-4 px-6">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-white font-bold">Apexify.js</span>
                        <span className="text-green-400">✓</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-6 text-gray-400">node-canvas</th>
                    <th className="text-center py-4 px-6 text-gray-400">sharp</th>
                    <th className="text-center py-4 px-6 text-gray-400">jimp</th>
                    <th className="text-center py-4 px-6 text-gray-400">fabric.js</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">Performance (Rust-based)</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">Memory Efficiency (Optimized RAM)</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">TypeScript Support</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">Video Processing (30+ Features)</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">Image Filters (22+ Professional)</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">Chart Generation</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">GIF Creation</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">Active Maintenance</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400/50 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">24/7 Owner Support</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <XCircleIcon className="h-6 w-6 text-red-400/50 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-4">
                <BoltIcon className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Performance Optimizations</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
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

      {/* Owner Support Section */}
      <section 
        id="support-section"
        data-section
        className={`relative py-32 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('support-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Always Supported, Never Abandoned
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Unlike many npm packages that get deprecated or left unmaintained, Apexify.js is actively developed and supported
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 rounded-2xl p-8 hover:border-green-500/40 transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/30">
                <HeartIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Owner Always Responds</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Need help? Found a bug? The package owner personally responds to every issue, question, and feature request. 
                No automated responses or ignored tickets.
              </p>
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <ClockIcon className="h-5 w-5" />
                <span>24/7 Support Available</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Constantly Updated</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Regular updates with new features, bug fixes, and performance improvements. We don't leave the package 
                unmaintained for months - expect frequent releases and improvements.
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <ArrowRightIcon className="h-5 w-5" />
                <span>Active Development</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Bug Fixes & Security</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Critical bugs are fixed within hours, not weeks. Security vulnerabilities are patched immediately. 
                Your projects stay safe and functional.
              </p>
              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                <ShieldCheckIcon className="h-5 w-5" />
                <span>Rapid Response Time</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border border-yellow-500/20 rounded-2xl p-8 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/30">
                <BoltIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">New Features Regularly</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                We're constantly adding new features based on community feedback. From video processing to advanced 
                filters, Apexify.js keeps evolving to meet your needs.
              </p>
              <div className="flex items-center gap-2 text-yellow-400 font-semibold">
                <RocketLaunchIcon className="h-5 w-5" />
                <span>Feature-Rich Updates</span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center p-8 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/20 rounded-2xl">
            <p className="text-lg text-gray-300 mb-4">
              <strong className="text-white">Never deprecated. Never abandoned. Always improving.</strong>
            </p>
            <p className="text-gray-400">
              Choose a package that's here to stay and grow with your projects
            </p>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section 
        id="get-started-section"
        data-section
        className={`relative py-32 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
          visibleSections.has('get-started-section') 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join thousands of developers building amazing visuals with Apexify.js
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                <RocketLaunchIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Install in Seconds</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Get started with a single npm install. No complex setup or configuration needed.
              </p>
              <div className="text-blue-400 font-semibold">npm install apexify.js →</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <CodeBracketIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">TypeScript Ready</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Full TypeScript support with comprehensive type definitions and IntelliSense.
              </p>
              <div className="text-purple-400 font-semibold">100% Type Safe →</div>
            </div>

            <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/40 transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-500/30">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Comprehensive Docs</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Detailed documentation with examples, guides, and API references for every feature.
              </p>
              <div className="text-pink-400 font-semibold">Explore Docs →</div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/docs#Getting-Started"
              className="group inline-flex items-center px-10 py-5 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
            >
              <RocketLaunchIcon className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
              Start Building Now
              <ArrowRightIcon className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 mt-32 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Apexify.js
                </span>
              </Link>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                The ultimate TypeScript canvas library for Node.js. Create stunning visuals with professional-grade rendering and image processing.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/EIAS79/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                  aria-label="GitHub"
                >
                  <svg className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a
                  href="https://www.npmjs.com/package/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                  aria-label="npm"
                >
                  <svg className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.666H5.334v-4H3.999v4H1.335V8.667h5.331v5.333zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.337v4h-1.335v-4h-1.33v4h-2.671V8.667h8.003v5.333z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
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

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/EIAS79/apexify.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.npmjs.com/package/apexify.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    npm Package
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/EIAS79/apexify.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Report Issue
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Apexify.js. Built with{' '}
                <span className="text-red-500 animate-pulse inline-block">❤️</span>{' '}
                by the community
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  v5.1.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group ${
          showScrollTop 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUpIcon className="h-6 w-6 text-white group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
}
