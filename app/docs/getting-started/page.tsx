import DocLayout from '@/components/DocLayout';

const headings = [
  { id: 'getting-started', text: 'Getting Started', level: 1 },
  { id: 'release-status', text: 'Release Status', level: 2 },
  { id: 'requirements', text: 'Requirements', level: 2 },
  { id: 'modules', text: 'ESM and CommonJS', level: 2 },
  { id: 'quick-start', text: 'Quick Start', level: 2 },
  { id: 'output', text: 'Output Behavior', level: 2 },
  { id: 'ffmpeg', text: 'FFmpeg', level: 2 },
];

export default function GettingStarted() {
  return (
    <DocLayout headings={headings}>
      <div className="prose prose-invert max-w-none">
        <h1 id="getting-started" className="text-4xl font-bold text-white mb-8">Getting Started</h1>

        <section className="mb-12" id="release-status">
          <h2 className="text-3xl font-semibold text-white mb-4">Release Status</h2>
          <p className="text-gray-400 mb-4">
            This site documents the staged Apexify.js 6.0.0 package artifact. npm <code>latest</code> is still 5.4.5,
            so <code>npm install apexify.js</code> currently installs 5.4.5 until 6.0.0 is explicitly published.
          </p>
        </section>

        <section className="mb-12" id="requirements">
          <h2 className="text-3xl font-semibold text-white mb-4">Requirements for staged 6.0.0</h2>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li>Node.js 22.x, 24.x, or 26.x</li>
              <li>npm 10 or newer</li>
              <li>FFmpeg and ffprobe only for video/FFmpeg features</li>
              <li>TypeScript is optional; declarations ship with the package artifact</li>
            </ul>
          </div>
        </section>

        <section className="mb-12" id="modules">
          <h2 className="text-3xl font-semibold text-white mb-4">ESM and CommonJS</h2>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0"><code>{`// ESM
import { ApexPainter } from 'apexify.js';

// CommonJS
const { ApexPainter } = require('apexify.js');`}</code></pre>
          </div>
          <p className="text-gray-400">
            The <code>apexify.js/types</code> subpath is type-only. Do not import internal source or <code>dist/*</code> paths.
          </p>
        </section>

        <section className="mb-12" id="quick-start">
          <h2 className="text-3xl font-semibold text-white mb-4">Quick Start</h2>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0"><code>{`import { writeFile } from 'node:fs/promises';
import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter({ type: 'buffer' });
const canvas = await painter.createCanvas({
  width: 640,
  height: 360,
  colorBg: '#0f172a',
});

const png = await painter.createText(
  {
    text: 'Apexify.js',
    x: 320,
    y: 180,
    font: { size: 48, family: 'Arial' },
    fill: { color: '#ffffff' },
    placement: { textAlign: 'center', textBaseline: 'middle' },
  },
  canvas,
);

await writeFile('output.png', png);`}</code></pre>
          </div>
        </section>

        <section className="mb-12" id="output">
          <h2 className="text-3xl font-semibold text-white mb-4">Output Behavior</h2>
          <p className="text-gray-400 mb-4">
            <code>createCanvas()</code> returns <code>CanvasResults</code>. Normal raster drawing/rendering methods return PNG
            <code> Buffer</code>s. The painter constructor&apos;s output type is applied when you explicitly call <code>toOutput()</code>.
          </p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0"><code>{`const painter = new ApexPainter({ type: 'dataURL' });
const canvas = await painter.createCanvas({ width: 320, height: 180 });
const dataUrl = await painter.toOutput(canvas.buffer);`}</code></pre>
          </div>
        </section>

        <section className="mb-12" id="ffmpeg">
          <h2 className="text-3xl font-semibold text-white mb-4">FFmpeg</h2>
          <p className="text-gray-400">
            Video features require FFmpeg and ffprobe. Custom locations use runtime/session configuration or
            <code> APEXIFY_FFMPEG_PATH</code> and <code>APEXIFY_FFPROBE_PATH</code>. Image, text, chart, GIF, scene, and
            procedural-audio features do not require FFmpeg simply to use the package.
          </p>
        </section>
      </div>
    </DocLayout>
  );
}
