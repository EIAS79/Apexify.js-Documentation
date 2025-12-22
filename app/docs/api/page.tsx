import DocLayout from '@/components/DocLayout';

const headings = [
  { id: 'api-reference', text: 'API Reference', level: 1 },
  { id: 'apexpainter', text: 'ApexPainter', level: 2 },
  { id: 'canvas', text: 'Canvas', level: 2 },
  { id: 'createcanvas', text: 'createCanvas()', level: 3 },
  { id: 'createimage', text: 'createImage()', level: 3 },
  { id: 'createtext', text: 'createText()', level: 3 },
  { id: 'charts', text: 'Charts', level: 2 },
  { id: 'createchart', text: 'createChart()', level: 3 },
  { id: 'advanced', text: 'Advanced', level: 2 },
  { id: 'creategif', text: 'createGIF()', level: 3 },
  { id: 'configuration-types', text: 'Configuration Types', level: 2 },
];

export default function APIReference() {
  return (
    <DocLayout headings={headings}>
      <div className="prose prose-invert max-w-none">
        <h1 id="api-reference" className="text-4xl font-bold text-white mb-8">API Reference</h1>

        {/* ApexPainter Class */}
        <section className="mb-12" id="apexpainter">
          <h2 className="text-3xl font-semibold text-white mb-4">ApexPainter</h2>
          <p className="text-gray-400 mb-4">The main class for creating and manipulating canvas content.</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`new ApexPainter(outputFormat?: OutputFormat)`}</code>
            </pre>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2"><strong>Parameters:</strong></p>
            <p className="text-sm text-gray-300">outputFormat - Optional format specification (default: 'buffer')</p>
          </div>
        </section>

        {/* Canvas Section */}
        <div id="canvas" className="mb-8">
          <h2 className="text-3xl font-semibold text-white mb-6">Canvas</h2>
          
          {/* createCanvas */}
          <section className="mb-12" id="createcanvas">
            <h3 className="text-2xl font-semibold text-white mb-4">createCanvas()</h3>
          <p className="text-gray-400 mb-4">Creates a new canvas with specified dimensions and background options.</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`await painter.createCanvas({
  width: 800,
  height: 600,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#FF6B6B' },
      { stop: 1, color: '#4ECDC4' }
    ],
    startX: 0,
    startY: 0,
    endX: 800,
    endY: 600
  }
})`}</code>
            </pre>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2"><strong>Returns:</strong></p>
            <p className="text-sm text-gray-300">Promise&lt;CanvasResults&gt; - Object containing canvas buffer and configuration</p>
          </div>
          </section>

          {/* createImage */}
          <section className="mb-12" id="createimage">
            <h3 className="text-2xl font-semibold text-white mb-4">createImage()</h3>
          <p className="text-gray-400 mb-4">Draws an image or shape on the canvas. Supports multiple shapes and effects.</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`await painter.createImage({
  source: 'heart',
  x: 300,
  y: 200,
  width: 200,
  height: 200,
  shape: { fill: true, color: '#FF6B6B' }
}, canvas.buffer)`}</code>
            </pre>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2"><strong>Parameters:</strong></p>
            <p className="text-sm text-gray-300 mb-1">imageProps: ImageProperties | ImageProperties[] - Image/shape properties or array of properties</p>
            <p className="text-sm text-gray-300">sourceBuffer: Buffer - Source canvas buffer</p>
            <p className="text-sm text-gray-400 mb-2 mt-4"><strong>Returns:</strong></p>
            <p className="text-sm text-gray-300">Promise&lt;Buffer&gt;</p>
          </div>
          </section>

          {/* createText */}
          <section className="mb-12" id="createtext">
            <h3 className="text-2xl font-semibold text-white mb-4">createText()</h3>
          <p className="text-gray-400 mb-4">Renders text on the canvas with advanced styling options.</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`await painter.createText({
  text: 'Hello World',
  x: 100,
  y: 100,
  fontSize: 32,
  color: '#FFFFFF',
  gradient: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#FFD700' },
      { stop: 1, color: '#FF6B6B' }
    ]
  }
}, canvas.buffer)`}</code>
            </pre>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2"><strong>Parameters:</strong></p>
            <p className="text-sm text-gray-300 mb-1">textProps: TextProperties | TextProperties[] - Text properties or array of properties</p>
            <p className="text-sm text-gray-300">sourceBuffer: Buffer - Source canvas buffer</p>
            <p className="text-sm text-gray-400 mb-2 mt-4"><strong>Returns:</strong></p>
            <p className="text-sm text-gray-300">Promise&lt;Buffer&gt;</p>
          </div>
          </section>
        </div>

        {/* Charts Section */}
        <div id="charts" className="mb-8">
          <h2 className="text-3xl font-semibold text-white mb-6">Charts</h2>
          
          {/* createChart */}
          <section className="mb-12" id="createchart">
            <h3 className="text-2xl font-semibold text-white mb-4">createChart()</h3>
          <p className="text-gray-400 mb-4">Generates charts (bar, pie, line) on the canvas.</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`await painter.createChart({
  type: 'bar',
  data: [10, 20, 30, 40],
  labels: ['A', 'B', 'C', 'D'],
  x: 50,
  y: 50,
  width: 600,
  height: 400
}, canvas.buffer)`}</code>
            </pre>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2"><strong>Returns:</strong></p>
            <p className="text-sm text-gray-300">Promise&lt;Buffer&gt;</p>
          </div>
          </section>
        </div>

        {/* Advanced Section */}
        <div id="advanced" className="mb-8">
          <h2 className="text-3xl font-semibold text-white mb-6">Advanced</h2>
          
          {/* createGIF */}
          <section className="mb-12" id="creategif">
            <h3 className="text-2xl font-semibold text-white mb-4">createGIF()</h3>
          <p className="text-gray-400 mb-4">Creates an animated GIF from a sequence of image frames.</p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-4">
            <pre className="text-sm text-gray-300 overflow-x-auto m-0">
              <code>{`await painter.createGIF({
  frames: [buffer1, buffer2, buffer3],
  width: 800,
  height: 600,
  delay: 100,
  repeat: 0
})`}</code>
            </pre>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2"><strong>Returns:</strong></p>
            <p className="text-sm text-gray-300">Promise&lt;GIFResults&gt;</p>
          </div>
          </section>
        </div>

        {/* Configuration Types */}
        <section className="mb-12" id="configuration-types">
          <h2 className="text-3xl font-semibold text-white mb-4">Configuration Types</h2>
          
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white mb-3">CanvasConfig</h3>
            <p className="text-gray-400 mb-4">Configuration for canvas creation</p>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <pre className="text-sm text-gray-300 overflow-x-auto m-0">
                <code>{`interface CanvasConfig {
  width?: number;
  height?: number;
  colorBg?: string;
  gradientBg?: gradient;
  patternBg?: PatternOptions;
  customBg?: { source: string; fit?: FitMode };
  shadow?: ShadowOptions;
  stroke?: StrokeOptions;
  borderRadius?: number | "circular";
  rotation?: number;
}`}</code>
              </pre>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white mb-3">ImageProperties</h3>
            <p className="text-gray-400 mb-4">Properties for image/shape drawing</p>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <pre className="text-sm text-gray-300 overflow-x-auto m-0">
                <code>{`interface ImageProperties {
  source: string | Buffer | ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  shape?: ShapeConfig;
  shadow?: ShadowOptions;
  stroke?: StrokeOptions;
  rotation?: number;
  filters?: ImageFilter[];
}`}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-white mb-3">TextProperties</h3>
            <p className="text-gray-400 mb-4">Properties for text rendering</p>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <pre className="text-sm text-gray-300 overflow-x-auto m-0">
                <code>{`interface TextProperties {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  gradient?: gradient;
  bold?: boolean;
  italic?: boolean;
  shadow?: ShadowOptions;
  glow?: GlowOptions;
  stroke?: StrokeOptions;
}`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}
