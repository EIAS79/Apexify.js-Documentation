import DocLayout from '@/components/DocLayout';

const headings = [
  { id: 'getting-started', text: 'Getting Started', level: 1 },
  { id: 'installation', text: 'Installation', level: 2 },
  { id: 'requirements', text: 'Requirements', level: 2 },
  { id: 'quick-start', text: 'Quick Start', level: 2 },
  { id: 'adding-shapes', text: 'Adding Shapes', level: 2 },
  { id: 'adding-text', text: 'Adding Text', level: 2 },
  { id: 'output-formats', text: 'Output Formats', level: 2 },
];

export default function GettingStarted() {
  return (
    <DocLayout headings={headings}>
      <div className="prose prose-invert max-w-none">
        <h1 id="getting-started" className="text-4xl font-bold text-white mb-8">Getting Started</h1>

        {/* Installation */}
        <section className="mb-12" id="installation">
          <h2 className="text-3xl font-semibold text-white mb-4">Installation</h2>
          <p className="text-gray-400 mb-4">Install Apexify.js using npm or yarn:</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`npm install apexify.js`}</code>
            </pre>
          </div>
          <p className="text-gray-400 mb-4">Or using yarn:</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`yarn add apexify.js`}</code>
            </pre>
          </div>
        </section>

        {/* Requirements */}
        <section className="mb-12" id="requirements">
          <h2 className="text-3xl font-semibold text-white mb-4">Requirements</h2>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li>Node.js 16.0.0 or higher</li>
              <li>TypeScript 5.0+ (optional but recommended)</li>
            </ul>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12" id="quick-start">
          <h2 className="text-3xl font-semibold text-white mb-4">Quick Start</h2>
          <p className="text-gray-400 mb-4">Import ApexPainter and start creating:</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`import { ApexPainter } from 'apexify.js';
import fs from 'fs';

const painter = new ApexPainter();

// Create a canvas with gradient background
const canvas = await painter.createCanvas({
  width: 800,
  height: 600,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#FF6B6B' },
      { stop: 0.5, color: '#4ECDC4' },
      { stop: 1, color: '#45B7D1' }
    ],
    startX: 0,
    startY: 0,
    endX: 800,
    endY: 600
  },
  borderRadius: 20,
  shadow: {
    color: '#000',
    offsetX: 10,
    offsetY: 10,
    blur: 20
  }
});

// Save the canvas
fs.writeFileSync('output.png', canvas.buffer);`}</code>
            </pre>
          </div>
        </section>

        {/* Adding Shapes */}
        <section className="mb-12" id="adding-shapes">
          <h2 className="text-3xl font-semibold text-white mb-4">Adding Shapes</h2>
          <p className="text-gray-400 mb-4">Draw shapes like circles, rectangles, hearts, and stars:</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`// Add a heart shape with gradient fill
const heartImage = await painter.createImage({
  source: 'heart',
  x: 300,
  y: 200,
  width: 200,
  height: 200,
  shape: {
    fill: true,
    gradient: {
      type: 'radial',
      colors: [
        { stop: 0, color: '#FF6B6B' },
        { stop: 1, color: '#FF1744' }
      ],
      startX: 100,
      startY: 100,
      startRadius: 0,
      endX: 100,
      endY: 100,
      endRadius: 100
    }
  },
  shadow: {
    color: '#000',
    offsetX: 15,
    offsetY: 15,
    blur: 25
  },
  stroke: {
    color: '#FFF',
    width: 5
  }
}, canvas.buffer);

fs.writeFileSync('heart.png', heartImage);`}</code>
            </pre>
          </div>
        </section>

        {/* Adding Text */}
        <section className="mb-12" id="adding-text">
          <h2 className="text-3xl font-semibold text-white mb-4">Adding Text</h2>
          <p className="text-gray-400 mb-4">Render text with advanced effects:</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`const textImage = await painter.createText({
  text: 'Hello, Apexify!',
  x: 400,
  y: 450,
  fontSize: 48,
  fontFamily: 'Arial',
  bold: true,
  gradient: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#FFD700' },
      { stop: 1, color: '#FF6B6B' }
    ],
    startX: 0,
    startY: 0,
    endX: 300,
    endY: 0
  },
  glow: {
    color: '#FFD700',
    intensity: 0.8,
    opacity: 0.9
  },
  shadow: {
    color: '#000',
    offsetX: 8,
    offsetY: 8,
    blur: 15
  },
  stroke: {
    color: '#FFF',
    width: 3
  }
}, heartImage);

fs.writeFileSync('final.png', textImage);`}</code>
            </pre>
          </div>
        </section>

        {/* Output Formats */}
        <section className="mb-12" id="output-formats">
          <h2 className="text-3xl font-semibold text-white mb-4">Output Formats</h2>
          <p className="text-gray-400 mb-4">ApexPainter supports multiple output formats:</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`// Buffer (default)
const painter = new ApexPainter({ type: 'buffer' });
const result = await painter.createCanvas({ width: 800, height: 600 });
// result is a Buffer

// Base64
const painter64 = new ApexPainter({ type: 'base64' });
const base64Result = await painter64.createCanvas({ width: 800, height: 600 });
// base64Result is a base64 string

// Data URL
const painterURL = new ApexPainter({ type: 'dataURL' });
const urlResult = await painterURL.createCanvas({ width: 800, height: 600 });
// urlResult is a data URL string

// Other formats: 'url', 'blob', 'arraybuffer'`}</code>
            </pre>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}
