'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  PhotoIcon, 
  SparklesIcon, 
  ChartBarIcon,
  FilmIcon,
  PlayIcon,
  Squares2X2Icon,
  PaintBrushIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { CodeSwitcher } from '@/components/mdx/CodeSwitcher';

type Category = 'all' | 'background' | 'images' | 'text' | 'charts' | 'videos' | 'gifs' | 'extras' | 'mix' | 'advance';

interface GalleryItem {
  id: string;
  title: string;
  category: Category;
  description: string;
  thumbnail: string;
  featured?: boolean;
  code?: {
    ts?: string;
    js?: string;
  };
}

// Sample code snippets - replace with actual code for your gallery items
const sampleCodeTS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter(800, 600);
painter.drawBackground('gradient', {
  colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
  direction: 'diagonal'
});
const image = await painter.toBuffer();
`;

const sampleCodeJS = `const { ApexPainter } = require('apexify.js');

const painter = new ApexPainter(800, 600);
painter.drawBackground('gradient', {
  colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
  direction: 'diagonal'
});
const image = await painter.toBuffer();
`;

const chartCodeTS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter(800, 600);
painter.drawChart({
  type: 'bar',
  data: [20, 35, 50, 30, 45],
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981']
});
const image = await painter.toBuffer();
`;

const chartCodeJS = `const { ApexPainter } = require('apexify.js');

const painter = new ApexPainter(800, 600);
painter.drawChart({
  type: 'bar',
  data: [20, 35, 50, 30, 45],
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981']
});
const image = await painter.toBuffer();
`;

const textCodeTS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter(800, 600);
painter.drawText({
  text: 'Hello Apexify.js',
  x: 400,
  y: 300,
  fontSize: 48,
  color: '#ffffff',
  gradient: {
    colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
    direction: 'horizontal'
  },
  shadow: {
    blur: 10,
    offsetX: 5,
    offsetY: 5,
    color: 'rgba(0, 0, 0, 0.5)'
  }
});
const image = await painter.toBuffer();
`;

const textCodeJS = `const { ApexPainter } = require('apexify.js');

const painter = new ApexPainter(800, 600);
painter.drawText({
  text: 'Hello Apexify.js',
  x: 400,
  y: 300,
  fontSize: 48,
  color: '#ffffff',
  gradient: {
    colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
    direction: 'horizontal'
  },
  shadow: {
    blur: 10,
    offsetX: 5,
    offsetY: 5,
    color: 'rgba(0, 0, 0, 0.5)'
  }
});
const image = await painter.toBuffer();
`;

// Elegant Multi-Layer Background Code
const elegantBackgroundTS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';

const painter = new ApexPainter();

const canvas = await painter.createCanvas({
  width: 1600,
  height: 900,
  bgLayers: [
    {
      type: 'gradient',
      value: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#0f0c29' },
          { stop: 0.25, color: '#302b63' },
          { stop: 0.5, color: '#24243e' },
          { stop: 0.75, color: '#1a1a2e' },
          { stop: 1, color: '#16213e' }
        ],
        startX: 0,
        startY: 0,
        endX: 1600,
        endY: 900,
        rotate: 45
      }
    },
    {
      type: 'gradient',
      value: {
        type: 'radial',
        colors: [
          { stop: 0, color: 'rgba(139, 92, 246, 0.3)' },
          { stop: 0.4, color: 'rgba(59, 130, 246, 0.2)' },
          { stop: 1, color: 'transparent' }
        ],
        startX: 400,
        startY: 300,
        startRadius: 0,
        endX: 1200,
        endY: 600,
        endRadius: 800
      }
    },
    {
      type: 'gradient',
      value: {
        type: 'conic',
        colors: [
          { stop: 0, color: 'rgba(236, 72, 153, 0.15)' },
          { stop: 0.25, color: 'rgba(139, 92, 246, 0.15)' },
          { stop: 0.5, color: 'rgba(59, 130, 246, 0.15)' },
          { stop: 0.75, color: 'rgba(34, 197, 94, 0.15)' },
          { stop: 1, color: 'rgba(236, 72, 153, 0.15)' }
        ],
        centerX: 800,
        centerY: 450,
        startAngle: 0
      }
    },
    {
      type: 'noise',
      intensity: 0.08
    }
  ],
  stroke: {
    width: 8,
    gradient: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#8b5cf6' },
        { stop: 0.5, color: '#3b82f6' },
        { stop: 1, color: '#ec4899' }
      ],
      startX: 0,
      startY: 0,
      endX: 1600,
      endY: 900
    },
    borderRadius: 24,
    style: 'solid'
  },
  shadow: {
    color: 'rgba(139, 92, 246, 0.4)',
    offsetX: 0,
    offsetY: 20,
    blur: 60,
    opacity: 0.8,
    borderRadius: 24
  },
  borderRadius: 24
});

fs.writeFileSync('elegant-background.png', canvas.buffer);`;

const elegantBackgroundJS = `const { ApexPainter } = require('apexify.js');
const fs = require('fs');

const painter = new ApexPainter();

async function createBackground() {
  const canvas = await painter.createCanvas({
    width: 1600,
    height: 900,
    bgLayers: [
      {
        type: 'gradient',
        value: {
          type: 'linear',
          colors: [
            { stop: 0, color: '#0f0c29' },
            { stop: 0.25, color: '#302b63' },
            { stop: 0.5, color: '#24243e' },
            { stop: 0.75, color: '#1a1a2e' },
            { stop: 1, color: '#16213e' }
          ],
          startX: 0,
          startY: 0,
          endX: 1600,
          endY: 900,
          rotate: 45
        }
      },
      {
        type: 'gradient',
        value: {
          type: 'radial',
          colors: [
            { stop: 0, color: 'rgba(139, 92, 246, 0.3)' },
            { stop: 0.4, color: 'rgba(59, 130, 246, 0.2)' },
            { stop: 1, color: 'transparent' }
          ],
          startX: 400,
          startY: 300,
          startRadius: 0,
          endX: 1200,
          endY: 600,
          endRadius: 800
        }
      },
      {
        type: 'gradient',
        value: {
          type: 'conic',
          colors: [
            { stop: 0, color: 'rgba(236, 72, 153, 0.15)' },
            { stop: 0.25, color: 'rgba(139, 92, 246, 0.15)' },
            { stop: 0.5, color: 'rgba(59, 130, 246, 0.15)' },
            { stop: 0.75, color: 'rgba(34, 197, 94, 0.15)' },
            { stop: 1, color: 'rgba(236, 72, 153, 0.15)' }
          ],
          centerX: 800,
          centerY: 450,
          startAngle: 0
        }
      },
      {
        type: 'noise',
        intensity: 0.08
      }
    ],
    stroke: {
      width: 8,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#8b5cf6' },
          { stop: 0.5, color: '#3b82f6' },
          { stop: 1, color: '#ec4899' }
        ],
        startX: 0,
        startY: 0,
        endX: 1600,
        endY: 900
      },
      borderRadius: 24,
      style: 'solid'
    },
    shadow: {
      color: 'rgba(139, 92, 246, 0.4)',
      offsetX: 0,
      offsetY: 20,
      blur: 60,
      opacity: 0.8,
      borderRadius: 24
    },
    borderRadius: 24
  });

  fs.writeFileSync('elegant-background.png', canvas.buffer);
}

createBackground();`;

// Apexify.js Showcase Code
const showcaseTS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';
import path from 'path';

async function generateShowcase() {
  const painter = new ApexPainter();

  const canvas = await painter.createCanvas({
    width: 1920,
    height: 1080,
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#667EEA' },
        { stop: 0.3, color: '#764BA2' },
        { stop: 0.6, color: '#F093FB' },
        { stop: 1, color: '#4FACFE' }
      ],
      startX: 0,
      startY: 0,
      endX: 1920,
      endY: 1080
    },
    noiseBg: { intensity: 0.1 }
  });

  const features = [
    {
      title: 'Canvas Creation',
      description: 'Stunning backgrounds\\nwith gradients & patterns',
      x: 320,
      y: 620
    },
    {
      title: 'Text Rendering',
      description: 'Advanced text with\\ngradients & effects',
      x: 960,
      y: 620
    },
    {
      title: 'Image Processing',
      description: 'Professional filters\\n& transformations',
      x: 1600,
      y: 620
    }
  ];

  const cardCanvases = await Promise.all(
    features.map(() => painter.createCanvas({
      width: 480,
      height: 520,
      gradientBg: {
        type: 'radial',
        colors: [
          { stop: 0, color: 'rgba(255, 255, 255, 0.25)' },
          { stop: 1, color: 'rgba(255, 255, 255, 0.08)' }
        ],
        startX: 240,
        startY: 260,
        startRadius: 0,
        endX: 240,
        endY: 260,
        endRadius: 350
      }
    }))
  );

  let result = await painter.createImage(
    features.map((feature, i) => ({
      source: cardCanvases[i].buffer,
      x: feature.x - 240,
      y: feature.y - 260,
      width: 480,
      height: 520,
      borderRadius: 25,
      stroke: { width: 2, color: 'rgba(255, 255, 255, 0.4)', style: 'solid', borderRadius: 25 },
      shadow: { blur: 40, offsetX: 0, offsetY: 20, color: 'rgba(0, 0, 0, 0.4)' }
    })),
    canvas.buffer
  );

  result = await painter.createText(
    [
      ...features.map(feature => ({
        text: feature.title,
        x: feature.x,
        y: feature.y + 130,
        fontSize: 36,
        fontFamily: 'Arial',
        bold: true,
        color: '#FFFFFF',
        shadow: { blur: 15, offsetX: 0, offsetY: 5, color: 'rgba(0, 0, 0, 0.6)' },
        textAlign: 'center' as const
      })),
      ...features.map(feature => ({
        text: feature.description,
        x: feature.x,
        y: feature.y + 190,
        fontSize: 22,
        fontFamily: 'Arial',
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center' as const,
        lineHeight: 1.6
      })),
      {
        text: 'Apexify.js',
        x: 960,
        y: 150,
        fontSize: 140,
        fontFamily: 'Arial',
        bold: true,
        gradient: {
          type: 'linear',
          colors: [
            { stop: 0, color: '#FFFFFF' },
            { stop: 0.5, color: '#FFD700' },
            { stop: 1, color: '#FF6B6B' }
          ],
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 150
        },
        shadow: { blur: 30, offsetX: 0, offsetY: 15, color: 'rgba(0, 0, 0, 0.6)' },
        textAlign: 'center' as const
      },
      {
        text: 'The Ultimate Canvas & Image Processing Library',
        x: 960,
        y: 280,
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#FFFFFF',
        shadow: { blur: 20, offsetX: 0, offsetY: 8, color: 'rgba(0, 0, 0, 0.5)' },
        textAlign: 'center' as const,
        opacity: 0.95
      }
    ],
    result
  );

  result = await painter.createImage(
    [
      {
        source: 'circle',
        x: 100,
        y: 150,
        width: 120,
        height: 120,
        shape: { fill: true, color: 'rgba(255, 255, 255, 0.12)' },
        shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0, 0, 0, 0.2)' }
      },
      {
        source: 'star',
        x: 80,
        y: 920,
        width: 80,
        height: 80,
        shape: { fill: true, color: 'rgba(255, 107, 107, 0.25)', outerRadius: 40, innerRadius: 20 },
        shadow: { blur: 15, offsetX: 0, offsetY: 8, color: 'rgba(0, 0, 0, 0.2)' }
      }
    ],
    result
  );

  await painter.save(result, {
    filename: 'apexify-showcase.png',
    directory: './output',
    format: 'png'
  });
}

generateShowcase().catch(console.error);`;

const showcaseJS = `const { ApexPainter } = require('apexify.js');
const fs = require('fs');
const path = require('path');

async function generateShowcase() {
  const painter = new ApexPainter();

  const canvas = await painter.createCanvas({
    width: 1920,
    height: 1080,
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#667EEA' },
        { stop: 0.3, color: '#764BA2' },
        { stop: 0.6, color: '#F093FB' },
        { stop: 1, color: '#4FACFE' }
      ],
      startX: 0,
      startY: 0,
      endX: 1920,
      endY: 1080
    },
    noiseBg: { intensity: 0.1 }
  });

  const features = [
    {
      title: 'Canvas Creation',
      description: 'Stunning backgrounds\\nwith gradients & patterns',
      x: 320,
      y: 620
    },
    {
      title: 'Text Rendering',
      description: 'Advanced text with\\ngradients & effects',
      x: 960,
      y: 620
    },
    {
      title: 'Image Processing',
      description: 'Professional filters\\n& transformations',
      x: 1600,
      y: 620
    }
  ];

  const cardCanvases = await Promise.all(
    features.map(() => painter.createCanvas({
      width: 480,
      height: 520,
      gradientBg: {
        type: 'radial',
        colors: [
          { stop: 0, color: 'rgba(255, 255, 255, 0.25)' },
          { stop: 1, color: 'rgba(255, 255, 255, 0.08)' }
        ],
        startX: 240,
        startY: 260,
        startRadius: 0,
        endX: 240,
        endY: 260,
        endRadius: 350
      }
    }))
  );

  let result = await painter.createImage(
    features.map((feature, i) => ({
      source: cardCanvases[i].buffer,
      x: feature.x - 240,
      y: feature.y - 260,
      width: 480,
      height: 520,
      borderRadius: 25,
      stroke: { width: 2, color: 'rgba(255, 255, 255, 0.4)', style: 'solid', borderRadius: 25 },
      shadow: { blur: 40, offsetX: 0, offsetY: 20, color: 'rgba(0, 0, 0, 0.4)' }
    })),
    canvas.buffer
  );

  result = await painter.createText(
    [
      ...features.map(feature => ({
        text: feature.title,
        x: feature.x,
        y: feature.y + 130,
        fontSize: 36,
        fontFamily: 'Arial',
        bold: true,
        color: '#FFFFFF',
        shadow: { blur: 15, offsetX: 0, offsetY: 5, color: 'rgba(0, 0, 0, 0.6)' },
        textAlign: 'center'
      })),
      ...features.map(feature => ({
        text: feature.description,
        x: feature.x,
        y: feature.y + 190,
        fontSize: 22,
        fontFamily: 'Arial',
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        lineHeight: 1.6
      })),
      {
        text: 'Apexify.js',
        x: 960,
        y: 150,
        fontSize: 140,
        fontFamily: 'Arial',
        bold: true,
        gradient: {
          type: 'linear',
          colors: [
            { stop: 0, color: '#FFFFFF' },
            { stop: 0.5, color: '#FFD700' },
            { stop: 1, color: '#FF6B6B' }
          ],
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 150
        },
        shadow: { blur: 30, offsetX: 0, offsetY: 15, color: 'rgba(0, 0, 0, 0.6)' },
        textAlign: 'center'
      },
      {
        text: 'The Ultimate Canvas & Image Processing Library',
        x: 960,
        y: 280,
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#FFFFFF',
        shadow: { blur: 20, offsetX: 0, offsetY: 8, color: 'rgba(0, 0, 0, 0.5)' },
        textAlign: 'center',
        opacity: 0.95
      }
    ],
    result
  );

  result = await painter.createImage(
    [
      {
        source: 'circle',
        x: 100,
        y: 150,
        width: 120,
        height: 120,
        shape: { fill: true, color: 'rgba(255, 255, 255, 0.12)' },
        shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0, 0, 0, 0.2)' }
      },
      {
        source: 'star',
        x: 80,
        y: 920,
        width: 80,
        height: 80,
        shape: { fill: true, color: 'rgba(255, 107, 107, 0.25)', outerRadius: 40, innerRadius: 20 },
        shadow: { blur: 15, offsetX: 0, offsetY: 8, color: 'rgba(0, 0, 0, 0.2)' }
      }
    ],
    result
  );

  await painter.save(result, {
    filename: 'apexify-showcase.png',
    directory: './output',
    format: 'png'
  });
}

generateShowcase().catch(console.error);`;

// Gradient Background Code
const gradientBackgroundTS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';

const painter = new ApexPainter();

const canvas = await painter.createCanvas({
  width: 1600,
  height: 900,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#667eea' },
      { stop: 0.2, color: '#764ba2' },
      { stop: 0.4, color: '#f093fb' },
      { stop: 0.6, color: '#4facfe' },
      { stop: 0.8, color: '#00f2fe' },
      { stop: 1, color: '#4facfe' }
    ],
    startX: 0,
    startY: 0,
    endX: 1600,
    endY: 900,
    rotate: 135
  },
  borderRadius: 20,
  stroke: {
    width: 4,
    color: 'rgba(255, 255, 255, 0.2)',
    style: 'solid',
    borderRadius: 20
  },
  shadow: {
    color: 'rgba(102, 126, 234, 0.3)',
    offsetX: 0,
    offsetY: 20,
    blur: 50,
    opacity: 0.8,
    borderRadius: 20
  }
});

fs.writeFileSync('gradient-background.png', canvas.buffer);`;

const gradientBackgroundJS = `const { ApexPainter } = require('apexify.js');
const fs = require('fs');

const painter = new ApexPainter();

async function createGradient() {
  const canvas = await painter.createCanvas({
    width: 1600,
    height: 900,
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#667eea' },
        { stop: 0.2, color: '#764ba2' },
        { stop: 0.4, color: '#f093fb' },
        { stop: 0.6, color: '#4facfe' },
        { stop: 0.8, color: '#00f2fe' },
        { stop: 1, color: '#4facfe' }
      ],
      startX: 0,
      startY: 0,
      endX: 1600,
      endY: 900,
      rotate: 135
    },
    borderRadius: 20,
    stroke: {
      width: 4,
      color: 'rgba(255, 255, 255, 0.2)',
      style: 'solid',
      borderRadius: 20
    },
    shadow: {
      color: 'rgba(102, 126, 234, 0.3)',
      offsetX: 0,
      offsetY: 20,
      blur: 50,
      opacity: 0.8,
      borderRadius: 20
    }
  });

  fs.writeFileSync('gradient-background.png', canvas.buffer);
}

createGradient();`;

// Pattern Background Code
const patternBackgroundTS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';

const painter = new ApexPainter();

const canvas = await painter.createCanvas({
  width: 1600,
  height: 900,
  gradientBg: {
    type: 'radial',
    colors: [
      { stop: 0, color: '#1e3a8a' },
      { stop: 0.5, color: '#3b82f6' },
      { stop: 1, color: '#1e1b4b' }
    ],
    startX: 800,
    startY: 450,
    startRadius: 0,
    endX: 800,
    endY: 450,
    endRadius: 900
  },
  patternBg: {
    type: 'hexagons',
    color: 'rgba(147, 197, 253, 0.4)',
    secondaryColor: 'rgba(59, 130, 246, 0.2)',
    size: 40,
    spacing: 15,
    opacity: 0.6,
    rotation: 0,
    blendMode: 'overlay'
  },
  borderRadius: 20,
  stroke: {
    width: 4,
    color: 'rgba(147, 197, 253, 0.3)',
    style: 'solid',
    borderRadius: 20
  },
  shadow: {
    color: 'rgba(30, 58, 138, 0.4)',
    offsetX: 0,
    offsetY: 20,
    blur: 50,
    opacity: 0.8,
    borderRadius: 20
  }
});

fs.writeFileSync('pattern-background.png', canvas.buffer);`;

const patternBackgroundJS = `const { ApexPainter } = require('apexify.js');
const fs = require('fs');

const painter = new ApexPainter();

async function createPattern() {
  const canvas = await painter.createCanvas({
    width: 1600,
    height: 900,
    gradientBg: {
      type: 'radial',
      colors: [
        { stop: 0, color: '#1e3a8a' },
        { stop: 0.5, color: '#3b82f6' },
        { stop: 1, color: '#1e1b4b' }
      ],
      startX: 800,
      startY: 450,
      startRadius: 0,
      endX: 800,
      endY: 450,
      endRadius: 900
    },
    patternBg: {
      type: 'hexagons',
      color: 'rgba(147, 197, 253, 0.4)',
      secondaryColor: 'rgba(59, 130, 246, 0.2)',
      size: 40,
      spacing: 15,
      opacity: 0.6,
      rotation: 0,
      blendMode: 'overlay'
    },
    borderRadius: 20,
    stroke: {
      width: 4,
      color: 'rgba(147, 197, 253, 0.3)',
      style: 'solid',
      borderRadius: 20
    },
    shadow: {
      color: 'rgba(30, 58, 138, 0.4)',
      offsetX: 0,
      offsetY: 20,
      blur: 50,
      opacity: 0.8,
      borderRadius: 20
    }
  });

  fs.writeFileSync('pattern-background.png', canvas.buffer);
}

createPattern();`;

// Sales Presentation Slide Code
const salesSlideTS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';

const painter = new ApexPainter();

const W = 3840;
const H = 2000;

async function createSlide() {
  // 1) Background
  const backgroundCanvas = await painter.createCanvas({
    width: W,
    height: H,
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#0B1220' },
        { stop: 0.35, color: '#121C2B' },
        { stop: 0.75, color: '#1B2A3E' },
        { stop: 1, color: '#0A1020' }
      ],
      startX: 0,
      startY: 0,
      endX: W,
      endY: H
    },
    noiseBg: { intensity: 0.02 }
  });

  // 2) Layout panels (glass cards) + accents
  let result = await painter.createImage(
    [
      // Left glass panel (insights)
      {
        source: 'rectangle',
        x: 140,
        y: 640,
        width: 1000,
        height: 1150,
        shape: { fill: true, color: 'rgba(255, 255, 255, 0.04)' },
        borderRadius: 26,
        borderPosition: 'top-right, bottom-right',
        shadow: {
          blur: 40,
          offsetX: 0,
          offsetY: 18,
          color: 'rgba(0, 0, 0, 0.35)'
        }
      },
      // Chart glass panel
      {
        source: 'rectangle',
        x: 1220,
        y: 560,
        width: 2500,
        height: 1260,
        shape: { fill: true, color: 'rgba(255, 255, 255, 0.035)' },
        borderRadius: 28,
        shadow: {
          blur: 50,
          offsetX: 0,
          offsetY: 20,
          color: 'rgba(0, 0, 0, 0.35)'
        }
      },
      // Thin accent line (left)
      {
        source: 'rectangle',
        x: 140,
        y: 640,
        width: 6,
        height: 1150,
        shape: { fill: true, color: 'rgba(96, 165, 250, 0.9)' },
        borderRadius: 10
      },
      // "Total revenue" badge background
      {
        source: 'rectangle',
        x: 220,
        y: 1450,
        width: 840,
        height: 320,
        shape: { fill: true, color: 'rgba(16, 185, 129, 0.08)' },
        borderRadius: 22,
        shadow: {
          blur: 30,
          offsetX: 0,
          offsetY: 12,
          color: 'rgba(16, 185, 129, 0.18)'
        }
      }
    ],
    backgroundCanvas.buffer
  );

  // 3) Data
  const salesData = [
    {
      label: 'Q4',
      value: 125000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#60A5FA' },
          { stop: 1, color: '#2563EB' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    },
    {
      label: 'Q3',
      value: 98000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#34D399' },
          { stop: 1, color: '#059669' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    },
    {
      label: 'Q2',
      value: 112000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#A78BFA' },
          { stop: 1, color: '#7C3AED' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    },
    {
      label: 'Q1',
      value: 87000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#FBBF24' },
          { stop: 1, color: '#D97706' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    }
  ];

  // 4) Chart
  const chartBuffer = await painter.createChart('horizontalBar', salesData, {
    dimensions: {
      width: 2350,
      padding: { top: 120, right: 160, bottom: 120, left: 260 }
    },
    appearance: {
      backgroundColor: 'transparent',
      axisColor: 'rgba(148,163,184,0.55)',
      axisWidth: 3
    },
    labels: {
      title: {
        text: 'Quarterly Revenue Breakdown',
        fontSize: 52,
        color: '#F1F5F9',
        textStyle: { bold: true }
      },
      barLabelDefaults: {
        show: true,
        fontSize: 40,
        defaultColor: '#CBD5E1',
        defaultPosition: 'left',
        textStyle: { bold: true }
      },
      valueLabelDefaults: {
        show: true,
        fontSize: 40,
        defaultColor: '#F8FAFC',
        textStyle: { bold: true }
      }
    },
    axes: {
      x: {
        label: 'Revenue ($)',
        labelColor: '#CBD5E1',
        tickFontSize: 30,
        tickColor: '#94A3B8',
        color: 'rgba(148,163,184,0.55)',
        width: 3,
        range: { min: 0, max: 140000 },
        values: [0, 20000, 40000, 60000, 80000, 100000, 120000, 140000]
      },
      y: {
        label: '',
        labelColor: '#CBD5E1',
        tickFontSize: 32,
        tickColor: '#CBD5E1',
        color: 'rgba(148,163,184,0.55)',
        width: 0
      }
    },
    grid: {
      show: true,
      color: 'rgba(148,163,184,0.12)',
      lineWidth: 2,
      style: 'dashed'
    },
    bars: {
      spacing: 54
    },
    legend: {
      show: false
    }
  });

  // 5) Place chart
  result = await painter.createImage(
    {
      source: chartBuffer,
      x: 1300,
      y: 610,
      width: 2350,
      height: 1180
    },
    result
  );

  // 6) Text layer
  result = await painter.createText(
    [
      {
        text: 'Q4 2025 Sales Performance',
        x: W / 2,
        y: 240,
        fontSize: 124,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#F8FAFC',
        shadow: {
          blur: 26,
          offsetX: 0,
          offsetY: 10,
          color: 'rgba(0, 0, 0, 0.45)'
        },
        textAlign: 'center'
      },
      {
        text: 'Revenue by Quarter Analysis',
        x: W / 2,
        y: 410,
        fontSize: 54,
        fontFamily: 'Helvetica',
        color: '#CBD5E1',
        textAlign: 'center',
        opacity: 0.9
      },
      {
        text: 'Key Insights',
        x: 220,
        y: 740,
        fontSize: 78,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#93C5FD',
        maxWidth: 900
      },
      {
        text: '• Q4 shows exceptional growth\\n• 27% increase vs Q1\\n• Best performing quarter\\n• Exceeding all targets',
        x: 260,
        y: 860,
        fontSize: 56,
        fontFamily: 'Helvetica',
        color: '#E2E8F0',
        lineHeight: 1.8,
        maxWidth: 900
      },
      {
        text: 'Total Revenue',
        x: 260,
        y: 1515,
        fontSize: 62,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#E2E8F0'
      },
      {
        text: '$422,000',
        x: 260,
        y: 1635,
        fontSize: 92,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#34D399'
      },
      {
        text: 'Up 18% from previous year',
        x: 260,
        y: 1755,
        fontSize: 48,
        fontFamily: 'Helvetica',
        color: '#A7F3D0',
        opacity: 0.95
      },
      {
        text: 'Data Source: Sales Analytics Platform | Generated with Apexify.js',
        x: W / 2,
        y: 1935,
        fontSize: 38,
        fontFamily: 'Helvetica',
        color: '#94A3B8',
        textAlign: 'center',
        opacity: 0.65,
        italic: true
      }
    ],
    result
  );

  fs.writeFileSync('sales-slide.png', result);
}

createSlide();`;

const salesSlideJS = `const { ApexPainter } = require('apexify.js');
const fs = require('fs');

const painter = new ApexPainter();

const W = 3840;
const H = 2000;

async function createSlide() {
  // 1) Background
  const backgroundCanvas = await painter.createCanvas({
    width: W,
    height: H,
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#0B1220' },
        { stop: 0.35, color: '#121C2B' },
        { stop: 0.75, color: '#1B2A3E' },
        { stop: 1, color: '#0A1020' }
      ],
      startX: 0,
      startY: 0,
      endX: W,
      endY: H
    },
    noiseBg: { intensity: 0.02 }
  });

  // 2) Layout panels (glass cards) + accents
  let result = await painter.createImage(
    [
      // Left glass panel (insights)
      {
        source: 'rectangle',
        x: 140,
        y: 640,
        width: 1000,
        height: 1150,
        shape: { fill: true, color: 'rgba(255, 255, 255, 0.04)' },
        borderRadius: 26,
        borderPosition: 'top-right, bottom-right',
        shadow: {
          blur: 40,
          offsetX: 0,
          offsetY: 18,
          color: 'rgba(0, 0, 0, 0.35)'
        }
      },
      // Chart glass panel
      {
        source: 'rectangle',
        x: 1220,
        y: 560,
        width: 2500,
        height: 1260,
        shape: { fill: true, color: 'rgba(255, 255, 255, 0.035)' },
        borderRadius: 28,
        shadow: {
          blur: 50,
          offsetX: 0,
          offsetY: 20,
          color: 'rgba(0, 0, 0, 0.35)'
        }
      },
      // Thin accent line (left)
      {
        source: 'rectangle',
        x: 140,
        y: 640,
        width: 6,
        height: 1150,
        shape: { fill: true, color: 'rgba(96, 165, 250, 0.9)' },
        borderRadius: 10
      },
      // "Total revenue" badge background
      {
        source: 'rectangle',
        x: 220,
        y: 1450,
        width: 840,
        height: 320,
        shape: { fill: true, color: 'rgba(16, 185, 129, 0.08)' },
        borderRadius: 22,
        shadow: {
          blur: 30,
          offsetX: 0,
          offsetY: 12,
          color: 'rgba(16, 185, 129, 0.18)'
        }
      }
    ],
    backgroundCanvas.buffer
  );

  // 3) Data
  const salesData = [
    {
      label: 'Q4',
      value: 125000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#60A5FA' },
          { stop: 1, color: '#2563EB' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    },
    {
      label: 'Q3',
      value: 98000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#34D399' },
          { stop: 1, color: '#059669' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    },
    {
      label: 'Q2',
      value: 112000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#A78BFA' },
          { stop: 1, color: '#7C3AED' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    },
    {
      label: 'Q1',
      value: 87000,
      gradient: {
        type: 'linear',
        colors: [
          { stop: 0, color: '#FBBF24' },
          { stop: 1, color: '#D97706' }
        ],
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0
      }
    }
  ];

  // 4) Chart
  const chartBuffer = await painter.createChart('horizontalBar', salesData, {
    dimensions: {
      width: 2350,
      padding: { top: 120, right: 160, bottom: 120, left: 260 }
    },
    appearance: {
      backgroundColor: 'transparent',
      axisColor: 'rgba(148,163,184,0.55)',
      axisWidth: 3
    },
    labels: {
      title: {
        text: 'Quarterly Revenue Breakdown',
        fontSize: 52,
        color: '#F1F5F9',
        textStyle: { bold: true }
      },
      barLabelDefaults: {
        show: true,
        fontSize: 40,
        defaultColor: '#CBD5E1',
        defaultPosition: 'left',
        textStyle: { bold: true }
      },
      valueLabelDefaults: {
        show: true,
        fontSize: 40,
        defaultColor: '#F8FAFC',
        textStyle: { bold: true }
      }
    },
    axes: {
      x: {
        label: 'Revenue ($)',
        labelColor: '#CBD5E1',
        tickFontSize: 30,
        tickColor: '#94A3B8',
        color: 'rgba(148,163,184,0.55)',
        width: 3,
        range: { min: 0, max: 140000 },
        values: [0, 20000, 40000, 60000, 80000, 100000, 120000, 140000]
      },
      y: {
        label: '',
        labelColor: '#CBD5E1',
        tickFontSize: 32,
        tickColor: '#CBD5E1',
        color: 'rgba(148,163,184,0.55)',
        width: 0
      }
    },
    grid: {
      show: true,
      color: 'rgba(148,163,184,0.12)',
      lineWidth: 2,
      style: 'dashed'
    },
    bars: {
      spacing: 54
    },
    legend: {
      show: false
    }
  });

  // 5) Place chart
  result = await painter.createImage(
    {
      source: chartBuffer,
      x: 1300,
      y: 610,
      width: 2350,
      height: 1180
    },
    result
  );

  // 6) Text layer
  result = await painter.createText(
    [
      {
        text: 'Q4 2025 Sales Performance',
        x: W / 2,
        y: 240,
        fontSize: 124,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#F8FAFC',
        shadow: {
          blur: 26,
          offsetX: 0,
          offsetY: 10,
          color: 'rgba(0, 0, 0, 0.45)'
        },
        textAlign: 'center'
      },
      {
        text: 'Revenue by Quarter Analysis',
        x: W / 2,
        y: 410,
        fontSize: 54,
        fontFamily: 'Helvetica',
        color: '#CBD5E1',
        textAlign: 'center',
        opacity: 0.9
      },
      {
        text: 'Key Insights',
        x: 220,
        y: 740,
        fontSize: 78,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#93C5FD',
        maxWidth: 900
      },
      {
        text: '• Q4 shows exceptional growth\\n• 27% increase vs Q1\\n• Best performing quarter\\n• Exceeding all targets',
        x: 260,
        y: 860,
        fontSize: 56,
        fontFamily: 'Helvetica',
        color: '#E2E8F0',
        lineHeight: 1.8,
        maxWidth: 900
      },
      {
        text: 'Total Revenue',
        x: 260,
        y: 1515,
        fontSize: 62,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#E2E8F0'
      },
      {
        text: '$422,000',
        x: 260,
        y: 1635,
        fontSize: 92,
        fontFamily: 'Helvetica',
        bold: true,
        color: '#34D399'
      },
      {
        text: 'Up 18% from previous year',
        x: 260,
        y: 1755,
        fontSize: 48,
        fontFamily: 'Helvetica',
        color: '#A7F3D0',
        opacity: 0.95
      },
      {
        text: 'Data Source: Sales Analytics Platform | Generated with Apexify.js',
        x: W / 2,
        y: 1935,
        fontSize: 38,
        fontFamily: 'Helvetica',
        color: '#94A3B8',
        textAlign: 'center',
        opacity: 0.65,
        italic: true
      }
    ],
    result
  );

  fs.writeFileSync('sales-slide.png', result);
}

createSlide();`;

// Spinning Wheel Animation Code
const spinningWheelTS = `/**
 * Spinning Wheel Animation Example
 * 
 * Demonstrates: Group transforms, GIF creation with onStart/onEnd callbacks,
 * Pie slice shapes, and programmatic frame generation
 */

import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function createSpinningWheel() {
  const wheelSize = 600;
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const radius = wheelSize / 2 - 20;

  const segments = [
    { label: "Prize 1", color: "#FF6B6B" },
    { label: "Prize 2", color: "#4ECDC4" },
    { label: "Prize 3", color: "#45B7D1" },
    { label: "Prize 4", color: "#FFA07A" },
    { label: "Prize 5", color: "#98D8C8" },
    { label: "Prize 6", color: "#F7DC6F" },
    { label: "Prize 7", color: "#BB8FCE" },
    { label: "Prize 8", color: "#85C1E2" },
  ];

  const segmentAngle = (2 * Math.PI) / segments.length;

  const result = await painter.createGIF(undefined, {
    outputFormat: 'file',
    outputFile: './output/spinning_wheel.gif',
    width: wheelSize,
    height: wheelSize,
    delay: 50,
    duration: 3000,
    quality: 10,
    repeat: 0,
    onStart: async (frameCount, painter) => {
      const frames: Array<{ buffer: Buffer; duration: number }> = [];
      const totalRotation = 5 * 360 + Math.random() * 360;
      const finalAngle = Math.random() * 360;
      
      for (let i = 0; i < frameCount; i++) {
        const progress = i / (frameCount - 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRotation = totalRotation * (1 - easeOut) + finalAngle * easeOut;
        
        let canvasBuffer = await painter.createCanvas({
          colorBg: '#1a1a1a',
          width: wheelSize,
          height: wheelSize
        });

        const wheelElements: any[] = [];
        
        for (let j = 0; j < segments.length; j++) {
          const baseStartAngle = (j * segmentAngle) - Math.PI / 2;
          const baseEndAngle = ((j + 1) * segmentAngle) - Math.PI / 2;
          
          wheelElements.push({
            source: 'pieSlice' as const,
            x: centerX - radius,
            y: centerY - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: 'circular',
            shape: {
              fill: true,
              color: segments[j].color,
              startAngle: baseStartAngle,
              endAngle: baseEndAngle,
              centerX: centerX,
              centerY: centerY,
              radius: radius
            },
            shadow: {
              color: 'rgba(110, 219, 246, 0.3)',
              blur: 15,
              offsetX: 5,
              borderRadius: 'circular',
              offsetY: 5,
              opacity: 0.4
            },
            stroke: {
              color: '#FFFFFF',
              width: 3,
              borderRadius: 'circular'
            }
          });
        }

        canvasBuffer.buffer = await painter.createImage(wheelElements, canvasBuffer.buffer, {
          isGrouped: true,
          groupTransform: {
            rotation: currentRotation,
            pivotX: centerX,
            pivotY: centerY
          }
        });

        const rotationRad = (currentRotation * Math.PI) / 180;
        const rotatedLabels: any[] = [];
        for (let j = 0; j < segments.length; j++) {
          const baseStartAngle = (j * segmentAngle) - Math.PI / 2;
          const baseEndAngle = ((j + 1) * segmentAngle) - Math.PI / 2;
          const baseLabelAngle = (baseStartAngle + baseEndAngle) / 2;
          const labelRadius = radius * 0.7;
          const baseLabelX = centerX + Math.cos(baseLabelAngle) * labelRadius;
          const baseLabelY = centerY + Math.sin(baseLabelAngle) * labelRadius;
          const dx = baseLabelX - centerX;
          const dy = baseLabelY - centerY;
          const rotatedX = centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
          const rotatedY = centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
          
          rotatedLabels.push({
            text: segments[j].label,
            x: rotatedX,
            y: rotatedY,
            fontSize: 18,
            fontColor: '#FFFFFF',
            fontName: 'Arial',
            align: 'center',
            baseline: 'middle',
            shadow: {
              color: 'rgba(0, 0, 0, 0.5)',
              blur: 5,
              offsetX: 2,
              offsetY: 2
            }
          });
        }
        
        canvasBuffer.buffer = await painter.createText(rotatedLabels, canvasBuffer.buffer);

        canvasBuffer.buffer = await painter.createImage([
          {
            source: 'circle',
            x: centerX - 30,
            y: centerY - 30,
            width: 60,
            height: 60,
            shape: { fill: true, color: '#2C3E50' },
            shadow: {
              color: 'rgba(0, 0, 0, 0.5)',
              blur: 15,
              offsetX: 0,
              offsetY: 5
            }
          },
          {
            source: 'triangle',
            x: centerX - 15,
            y: 10,
            width: 30,
            height: 40,
            rotation: 180,
            shape: { fill: true, color: '#E74C3C' },
            shadow: {
              color: 'rgba(0, 0, 0, 0.5)',
              blur: 10,
              offsetX: 0,
              offsetY: 5
            }
          }
        ], canvasBuffer.buffer);

        frames.push({
          buffer: canvasBuffer.buffer,
          duration: 50
        });
      }

      return frames;
    },
    onEnd: async (finalFrameBuffer, painter) => {
      await painter.save(finalFrameBuffer, {
        directory: './output',
        filename: 'spinning_wheel_final.png',
        overwrite: true
      });
      return finalFrameBuffer;
    }
  });
}

createSpinningWheel().catch(console.error);`;

const spinningWheelJS = `/**
 * Spinning Wheel Animation Example
 * 
 * Demonstrates: Group transforms, GIF creation with onStart/onEnd callbacks,
 * Pie slice shapes, and programmatic frame generation
 */

const { ApexPainter } = require('apexify.js');

const painter = new ApexPainter();

async function createSpinningWheel() {
  const wheelSize = 600;
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const radius = wheelSize / 2 - 20;

  const segments = [
    { label: "Prize 1", color: "#FF6B6B" },
    { label: "Prize 2", color: "#4ECDC4" },
    { label: "Prize 3", color: "#45B7D1" },
    { label: "Prize 4", color: "#FFA07A" },
    { label: "Prize 5", color: "#98D8C8" },
    { label: "Prize 6", color: "#F7DC6F" },
    { label: "Prize 7", color: "#BB8FCE" },
    { label: "Prize 8", color: "#85C1E2" },
  ];

  const segmentAngle = (2 * Math.PI) / segments.length;

  const result = await painter.createGIF(undefined, {
    outputFormat: 'file',
    outputFile: './output/spinning_wheel.gif',
    width: wheelSize,
    height: wheelSize,
    delay: 50,
    duration: 3000,
    quality: 10,
    repeat: 0,
    onStart: async (frameCount, painter) => {
      const frames = [];
      const totalRotation = 5 * 360 + Math.random() * 360;
      const finalAngle = Math.random() * 360;
      
      for (let i = 0; i < frameCount; i++) {
        const progress = i / (frameCount - 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRotation = totalRotation * (1 - easeOut) + finalAngle * easeOut;
        
        let canvasBuffer = await painter.createCanvas({
          colorBg: '#1a1a1a',
          width: wheelSize,
          height: wheelSize
        });

        const wheelElements = [];
        
        for (let j = 0; j < segments.length; j++) {
          const baseStartAngle = (j * segmentAngle) - Math.PI / 2;
          const baseEndAngle = ((j + 1) * segmentAngle) - Math.PI / 2;
          
          wheelElements.push({
            source: 'pieSlice',
            x: centerX - radius,
            y: centerY - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: 'circular',
            shape: {
              fill: true,
              color: segments[j].color,
              startAngle: baseStartAngle,
              endAngle: baseEndAngle,
              centerX: centerX,
              centerY: centerY,
              radius: radius
            },
            shadow: {
              color: 'rgba(110, 219, 246, 0.3)',
              blur: 15,
              offsetX: 5,
              borderRadius: 'circular',
              offsetY: 5,
              opacity: 0.4
            },
            stroke: {
              color: '#FFFFFF',
              width: 3,
              borderRadius: 'circular'
            }
          });
        }

        canvasBuffer.buffer = await painter.createImage(wheelElements, canvasBuffer.buffer, {
          isGrouped: true,
          groupTransform: {
            rotation: currentRotation,
            pivotX: centerX,
            pivotY: centerY
          }
        });

        const rotationRad = (currentRotation * Math.PI) / 180;
        const rotatedLabels = [];
        for (let j = 0; j < segments.length; j++) {
          const baseStartAngle = (j * segmentAngle) - Math.PI / 2;
          const baseEndAngle = ((j + 1) * segmentAngle) - Math.PI / 2;
          const baseLabelAngle = (baseStartAngle + baseEndAngle) / 2;
          const labelRadius = radius * 0.7;
          const baseLabelX = centerX + Math.cos(baseLabelAngle) * labelRadius;
          const baseLabelY = centerY + Math.sin(baseLabelAngle) * labelRadius;
          const dx = baseLabelX - centerX;
          const dy = baseLabelY - centerY;
          const rotatedX = centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
          const rotatedY = centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
          
          rotatedLabels.push({
            text: segments[j].label,
            x: rotatedX,
            y: rotatedY,
            fontSize: 18,
            fontColor: '#FFFFFF',
            fontName: 'Arial',
            align: 'center',
            baseline: 'middle',
            shadow: {
              color: 'rgba(0, 0, 0, 0.5)',
              blur: 5,
              offsetX: 2,
              offsetY: 2
            }
          });
        }
        
        canvasBuffer.buffer = await painter.createText(rotatedLabels, canvasBuffer.buffer);

        canvasBuffer.buffer = await painter.createImage([
          {
            source: 'circle',
            x: centerX - 30,
            y: centerY - 30,
            width: 60,
            height: 60,
            shape: { fill: true, color: '#2C3E50' },
            shadow: {
              color: 'rgba(0, 0, 0, 0.5)',
              blur: 15,
              offsetX: 0,
              offsetY: 5
            }
          },
          {
            source: 'triangle',
            x: centerX - 15,
            y: 10,
            width: 30,
            height: 40,
            rotation: 180,
            shape: { fill: true, color: '#E74C3C' },
            shadow: {
              color: 'rgba(0, 0, 0, 0.5)',
              blur: 10,
              offsetX: 0,
              offsetY: 5
            }
          }
        ], canvasBuffer.buffer);

        frames.push({
          buffer: canvasBuffer.buffer,
          duration: 50
        });
      }

      return frames;
    },
    onEnd: async (finalFrameBuffer, painter) => {
      await painter.save(finalFrameBuffer, {
        directory: './output',
        filename: 'spinning_wheel_final.png',
        overwrite: true
      });
      return finalFrameBuffer;
    }
  });
}

createSpinningWheel().catch(console.error);`;

// Image Effects Code
const imageEffectsTS = `/**
 * Image Effects Example
 * 
 * Demonstrates: Professional image effects including vignette, lens flare,
 * film grain, and chromatic aberration
 */

import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function applyImageEffects() {
  const imageUrl = "https://www.pixelstalk.net/wp-content/uploads/images6/Dark-Aesthetic-Wallpaper-HD-City-Night.jpg";
  
  // Create original image (no effects)
  const canvasBuffer1 = await painter.createCanvas({
    customBg: {
      source: imageUrl,
      inherit: true,
      opacity: 0
    }
  });

  const imageWidth = canvasBuffer1.canvas.width;
  const imageHeight = canvasBuffer1.canvas.height;

  const originalImage = await painter.createImage({
    source: imageUrl,
    x: 0,
    y: 0,
    inherit: true
  }, canvasBuffer1.buffer);

  await painter.save(originalImage, {
    directory: './output',
    filename: 'effects_original.png',
    overwrite: true
  });

  // Create filtered image with effects
  const canvasBuffer2 = await painter.createCanvas({
    colorBg: 'transparent',
    width: imageWidth,
    height: imageHeight
  });

  const filteredImage = await painter.createImage({
    source: imageUrl,
    x: 0,
    y: 0,
    inherit: true,
    effects: {
      vignette: {
        intensity: 0.5,
        size: 0.8
      },
      lensFlare: {
        x: imageWidth * 0.3,
        y: imageHeight * 0.25,
        intensity: 0.7
      },
      filmGrain: {
        intensity: 0.7
      },
      chromaticAberration: {
        intensity: 0.1
      }
    }
  }, canvasBuffer2.buffer);

  await painter.save(filteredImage, {
    directory: './output',
    filename: 'effects.png',
    overwrite: true
  });
}

applyImageEffects().catch(console.error);`;

const imageEffectsJS = `/**
 * Image Effects Example
 * 
 * Demonstrates: Professional image effects including vignette, lens flare,
 * film grain, and chromatic aberration
 */

const { ApexPainter } = require('apexify.js');

const painter = new ApexPainter();

async function applyImageEffects() {
  const imageUrl = "https://www.pixelstalk.net/wp-content/uploads/images6/Dark-Aesthetic-Wallpaper-HD-City-Night.jpg";
  
  // Create original image (no effects)
  const canvasBuffer1 = await painter.createCanvas({
    customBg: {
      source: imageUrl,
      inherit: true,
      opacity: 0
    }
  });

  const imageWidth = canvasBuffer1.canvas.width;
  const imageHeight = canvasBuffer1.canvas.height;

  const originalImage = await painter.createImage({
    source: imageUrl,
    x: 0,
    y: 0,
    inherit: true
  }, canvasBuffer1.buffer);

  await painter.save(originalImage, {
    directory: './output',
    filename: 'effects_original.png',
    overwrite: true
  });

  // Create filtered image with effects
  const canvasBuffer2 = await painter.createCanvas({
    colorBg: 'transparent',
    width: imageWidth,
    height: imageHeight
  });

  const filteredImage = await painter.createImage({
    source: imageUrl,
    x: 0,
    y: 0,
    inherit: true,
    effects: {
      vignette: {
        intensity: 0.5,
        size: 0.8
      },
      lensFlare: {
        x: imageWidth * 0.3,
        y: imageHeight * 0.25,
        intensity: 0.7
      },
      filmGrain: {
        intensity: 0.7
      },
      chromaticAberration: {
        intensity: 0.1
      }
    }
  }, canvasBuffer2.buffer);

  await painter.save(filteredImage, {
    directory: './output',
    filename: 'effects.png',
    overwrite: true
  });
}

applyImageEffects().catch(console.error);`;

// Mock data - replace with real data from your API/CDN
const galleryItems: GalleryItem[] = [
  // Background - Real Examples
  { id: 'bg-elegant', title: 'Elegant Multi-Layer Background', category: 'background', description: 'Advanced background showcasing multi-layer gradients (linear, radial, conic), gradient stroke, shadow effects, and noise texture', thumbnail: '/elegant-background.png', featured: true, code: { ts: elegantBackgroundTS, js: elegantBackgroundJS } },
  { id: 'mix-showcase', title: 'Apexify.js Showcase', category: 'mix', description: 'Professional showcase composition combining gradients, cards, text with gradients, shapes, and advanced effects', thumbnail: '/apexify-showcase.png', featured: true, code: { ts: showcaseTS, js: showcaseJS } },
  
  // Background - Real Examples
  { id: 'bg-1', title: 'Beautiful Gradient Backgrounds', category: 'background', description: 'Stunning multi-stop linear gradients with rotation, stroke, and shadow effects. Demonstrates advanced gradient configuration with multiple color stops.', thumbnail: '/gradient-background.png', featured: true, code: { ts: gradientBackgroundTS, js: gradientBackgroundJS } },
  { id: 'bg-2', title: 'Pattern Backgrounds with Gradients', category: 'background', description: 'Elegant hexagonal pattern overlay on radial gradient background. Showcases pattern types, blend modes, and layered background effects.', thumbnail: '/pattern-background.png', featured: true, code: { ts: patternBackgroundTS, js: patternBackgroundJS } },
  { id: 'bg-3', title: 'Solid Colors', category: 'background', description: 'Solid color backgrounds with custom opacity', thumbnail: 'https://via.placeholder.com/400x300/ec4899/ffffff?text=Solid+BG', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  
  // Images
  { id: 'img-effects', title: 'Professional Image Effects', category: 'images', description: 'Apply cinematic effects to images: vignette, lens flare, film grain, and chromatic aberration. Perfect for creating vintage looks and artistic image processing.', thumbnail: '/effects.png', featured: true, code: { ts: imageEffectsTS, js: imageEffectsJS } },
  { id: 'img-1', title: 'Image Filters', category: 'images', description: 'Professional image processing and filters', thumbnail: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Image+Filter', featured: true, code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'img-2', title: 'Image Stitching', category: 'images', description: 'Seamlessly combine multiple images', thumbnail: 'https://via.placeholder.com/400x300/06b6d4/ffffff?text=Stitching', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'img-3', title: 'Image Masks', category: 'images', description: 'Advanced masking and compositing', thumbnail: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Masking', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  
  // Text
  { id: 'text-1', title: 'Text Effects', category: 'text', description: 'Stunning text with gradients and shadows', thumbnail: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Text+Effects', featured: true, code: { ts: textCodeTS, js: textCodeJS } },
  { id: 'text-2', title: 'Text on Path', category: 'text', description: 'Text following custom paths and curves', thumbnail: 'https://via.placeholder.com/400x300/a855f7/ffffff?text=Text+Path', code: { ts: textCodeTS, js: textCodeJS } },
  { id: 'text-3', title: 'Text Decorations', category: 'text', description: 'Underlines, overlines, and custom decorations', thumbnail: 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Decorations', code: { ts: textCodeTS, js: textCodeJS } },
  
  // Charts
  { id: 'chart-1', title: 'Bar Charts', category: 'charts', description: 'Beautiful bar charts with custom styling', thumbnail: 'https://via.placeholder.com/400x300/14b8a6/ffffff?text=Bar+Chart', featured: true, code: { ts: chartCodeTS, js: chartCodeJS } },
  { id: 'chart-2', title: 'Pie Charts', category: 'charts', description: 'Interactive pie and donut charts', thumbnail: 'https://via.placeholder.com/400x300/0ea5e9/ffffff?text=Pie+Chart', code: { ts: chartCodeTS, js: chartCodeJS } },
  { id: 'chart-3', title: 'Line Charts', category: 'charts', description: 'Smooth line charts with animations', thumbnail: 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Line+Chart', code: { ts: chartCodeTS, js: chartCodeJS } },
  
  // Videos
  { id: 'vid-1', title: 'Video Effects', category: 'videos', description: 'Professional video processing effects', thumbnail: 'https://via.placeholder.com/400x300/dc2626/ffffff?text=Video+Effects', featured: true, code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'vid-2', title: 'Frame Extraction', category: 'videos', description: 'Extract frames from video files', thumbnail: 'https://via.placeholder.com/400x300/ea580c/ffffff?text=Frame+Extract', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'vid-3', title: 'Video Merging', category: 'videos', description: 'Combine multiple video clips', thumbnail: 'https://via.placeholder.com/400x300/c2410c/ffffff?text=Video+Merge', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  
  // GIFs
  { id: 'gif-spinning-wheel', title: 'Spinning Wheel Animation', category: 'gifs', description: 'Animated spinning wheel with group transforms, pie slice shapes, and programmatic frame generation. Demonstrates onStart/onEnd callbacks for GIF creation with realistic physics-based animation.', thumbnail: '/spinning_wheel_final.png', featured: true, code: { ts: spinningWheelTS, js: spinningWheelJS } },
  { id: 'gif-1', title: 'Animated GIFs', category: 'gifs', description: 'Create animated GIFs from sequences', thumbnail: 'https://via.placeholder.com/400x300/16a34a/ffffff?text=Animated+GIF', featured: true, code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'gif-2', title: 'GIF Optimization', category: 'gifs', description: 'Optimize GIF file sizes', thumbnail: 'https://via.placeholder.com/400x300/15803d/ffffff?text=GIF+Optimize', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  
  // Extras
  { id: 'extra-1', title: 'Custom Shapes', category: 'extras', description: '8+ shape types including hearts and stars', thumbnail: 'https://via.placeholder.com/400x300/7c3aed/ffffff?text=Shapes', featured: true, code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'extra-2', title: 'Batch Processing', category: 'extras', description: 'Process multiple images efficiently', thumbnail: 'https://via.placeholder.com/400x300/9333ea/ffffff?text=Batch', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  
  // Mix - Real Examples
  { id: 'mix-slide', title: 'Professional Sales Presentation Slide', category: 'mix', description: 'PowerPoint-style presentation slide combining gradient background, horizontal bar chart with real sales data, gradient text titles, side insights, and professional layout. Demonstrates advanced composition techniques.', thumbnail: '/sales-presentation-slide.png', featured: true, code: { ts: salesSlideTS, js: salesSlideJS } },
  
  // Mix
  { id: 'mix-1', title: 'Mixed Media', category: 'mix', description: 'Combine images, text, and charts', thumbnail: 'https://via.placeholder.com/400x300/f97316/ffffff?text=Mixed+Media', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'mix-2', title: 'Complex Compositions', category: 'mix', description: 'Advanced multi-layer compositions', thumbnail: 'https://via.placeholder.com/400x300/eab308/ffffff?text=Composition', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  
  // Advance
  { id: 'adv-1', title: 'Advanced Filters', category: 'advance', description: 'Professional-grade image filters', thumbnail: 'https://via.placeholder.com/400x300/be185d/ffffff?text=Adv+Filters', featured: true, code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'adv-2', title: 'Custom Pipelines', category: 'advance', description: 'Build custom processing pipelines', thumbnail: 'https://via.placeholder.com/400x300/9f1239/ffffff?text=Pipelines', code: { ts: sampleCodeTS, js: sampleCodeJS } },
  { id: 'adv-3', title: 'Performance Optimization', category: 'advance', description: 'Rust-based high-performance processing', thumbnail: 'https://via.placeholder.com/400x300/831843/ffffff?text=Performance', code: { ts: sampleCodeTS, js: sampleCodeJS } },
];

const categoryConfig: Record<Category, { label: string; icon: any; color: string; gradient: string }> = {
  all: { label: 'All', icon: Squares2X2Icon, color: 'text-gray-300', gradient: 'from-gray-500 to-gray-600' },
  background: { label: 'Background', icon: PaintBrushIcon, color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
  images: { label: 'Images', icon: PhotoIcon, color: 'text-green-400', gradient: 'from-green-500 to-emerald-500' },
  text: { label: 'Text', icon: SparklesIcon, color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' },
  charts: { label: 'Charts', icon: ChartBarIcon, color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' },
  videos: { label: 'Videos', icon: FilmIcon, color: 'text-red-400', gradient: 'from-red-500 to-pink-500' },
  gifs: { label: 'GIFs', icon: PlayIcon, color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' },
  extras: { label: 'Extras', icon: RocketLaunchIcon, color: 'text-indigo-400', gradient: 'from-indigo-500 to-purple-500' },
  mix: { label: 'Mix', icon: Squares2X2Icon, color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
  advance: { label: 'Advance', icon: CheckCircleIcon, color: 'text-rose-400', gradient: 'from-rose-500 to-pink-500' },
};

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const filteredItems = selectedCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  const featuredItems = filteredItems.filter(item => item.featured);
  const regularItems = filteredItems.filter(item => !item.featured);

  useEffect(() => {
    setIsVisible(true);

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleItems((prev) => new Set(prev).add(entry.target.id));
        }
      });
    }, observerOptions);

    const timer = setTimeout(() => {
      const items = galleryRef.current?.querySelectorAll('[data-gallery-item]');
      items?.forEach((item) => observer.observe(item));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [selectedCategory]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null);
      }
    };

    if (selectedItem) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
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
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div 
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              <span 
                className="relative inline-block"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4, #3b82f6)',
                  backgroundSize: '300% 300%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradient 5s ease infinite',
                }}
              >
                Gallery
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Explore stunning examples of what you can create with Apexify.js
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-16 z-30 bg-black/80 backdrop-blur-md border-b border-slate-800/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const IconComponent = config.icon;
              const isActive = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as Category)}
                  className={`group relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg shadow-blue-500/30 scale-105`
                      : 'bg-slate-800/60 text-gray-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : config.color}`} />
                  <span className="text-sm sm:text-base">{config.label}</span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" ref={galleryRef}>
        <div className="max-w-7xl mx-auto">
          {/* Featured Items */}
          {featuredItems.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-200 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                Featured Examples
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {featuredItems.map((item, index) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    index={index}
                    isVisible={visibleItems.has(item.id)}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Items */}
          {regularItems.length > 0 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-200">
                {selectedCategory === 'all' ? 'All Examples' : categoryConfig[selectedCategory].label + ' Examples'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {regularItems.map((item, index) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    index={index}
                    isVisible={visibleItems.has(item.id)}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🎨</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-4">No items found</h3>
              <p className="text-gray-500">Try selecting a different category</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-strong border border-gray-700/50 rounded-3xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Create Your Own?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start building stunning visuals with Apexify.js today
            </p>
            <Link
              href="/docs#Getting-Started"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105"
            >
              <RocketLaunchIcon className="h-6 w-6" />
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Modal */}
      {selectedItem && (
        <GalleryModal item={selectedItem} onClose={handleCloseModal} />
      )}
    </div>
  );
}

// Gallery Modal Component
function GalleryModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const categoryInfo = categoryConfig[item.category];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-4 sm:inset-8 lg:inset-12 z-[101] animate-fade-in">
        <div className="h-full w-full bg-slate-950/95 backdrop-blur-xl border-2 border-slate-800/50 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-3 bg-slate-900/90 hover:bg-slate-800 rounded-xl text-gray-400 hover:text-white transition-all duration-200 border border-slate-700/50 hover:border-slate-600"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Image Section */}
          <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/50 overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>

          {/* Code Section */}
          <div className="lg:w-1/2 flex flex-col bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800/50">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${categoryInfo.gradient}`}>
                  <categoryInfo.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{item.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                </div>
              </div>
            </div>

            {/* Code Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {item.code ? (
                <div className="h-full">
                  <CodeSwitcher
                    ts={item.code.ts}
                    js={item.code.js}
                    tsLabel="TypeScript"
                    jsLabel="JavaScript"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">No code available</p>
                    <p className="text-sm">Code will be displayed here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function GalleryCard({ item, index, isVisible, onClick }: { item: GalleryItem; index: number; isVisible: boolean; onClick: () => void }) {
  const categoryInfo = categoryConfig[item.category];
  const IconComponent = categoryInfo.icon;

  return (
    <div
      data-gallery-item
      id={item.id}
      onClick={onClick}
      className={`group relative glass-strong border border-gray-700/50 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-blue-500/40 transition-all duration-500 hover-lift cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{
        animationDelay: `${index * 50}ms`,
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          style={{ willChange: 'transform' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${categoryInfo.gradient} bg-opacity-90 backdrop-blur-sm`}>
            <IconComponent className="h-4 w-4 text-white" />
            <span className="text-xs font-bold text-white uppercase">{categoryInfo.label}</span>
          </div>
        </div>

        {/* Featured Badge */}
        {item.featured && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1.5 rounded-lg bg-yellow-500/90 backdrop-blur-sm">
              <span className="text-xs font-bold text-black">⭐ Featured</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-200">
          {item.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Hover Effect Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${categoryInfo.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`} />
    </div>
  );
}
