import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveDocFilename } from '@/lib/doc-filename-aliases';

interface DocFile {
  name: string;
  path: string;
  folder: string;
  filename: string;
}

/** Nested group under Feature Guides (supports multiple levels, e.g. `video-ffmpeg/options`). */
export interface DocSubfolder {
  name: string;
  displayName: string;
  files: DocFile[];
  subfolders?: DocSubfolder[];
}

export interface DocFolder {
  /** Raw directory name (may include `00-` ordering prefix). */
  name: string;
  /** Human-readable label for the sidebar (prefix stripped + mapped). */
  displayName: string;
  path: string;
  files: DocFile[];
  subfolders?: DocSubfolder[];
}

const TOP_LEVEL_FOLDER_ORDER = [
  '00-start-here',
  '01-beginner-guide',
  '02-recipes',
  '03-feature-guides',
  '04-api-reference',
  '05-advanced',
  '06-internals',
  '07-contributor-notes',
];

const FEATURE_GUIDE_SUBFOLDER_ORDER = [
  'canvas',
  'backgrounds',
  'images-shapes',
  'text-rendering',
  'lines-connectors',
  'charts',
  'gif-animation',
  'video-ffmpeg',
  'batch-save-output',
];

const FEATURE_SUBFOLDER_LABELS: Record<string, string> = {
  canvas: 'Canvas',
  backgrounds: 'Backgrounds',
  'images-shapes': 'Images & Shapes',
  'text-rendering': 'Text Rendering',
  'lines-connectors': 'Lines & Connectors',
  charts: 'Charts',
  'gif-animation': 'GIF & Animation',
  'video-ffmpeg': 'Video & FFmpeg',
  'batch-save-output': 'Batch / Save / Output',
};

/** Optional sort order for nested folders under a feature-guide topic (e.g. `options` under `video-ffmpeg`). */
const FEATURE_GUIDE_NESTED_SUBORDER: Record<string, string[]> = {
  'video-ffmpeg': ['options'],
};

/** Sidebar labels for nested segments when `formatName` is too generic. */
const FEATURE_GUIDE_NESTED_LABELS: Record<string, Record<string, string>> = {
  'video-ffmpeg': {
    options: 'Options',
  },
};

const TOP_LEVEL_LABELS: Record<string, string> = {
  '00-start-here': 'Start Here',
  '01-beginner-guide': 'Beginner Guide',
  '02-recipes': 'Recipes',
  '03-feature-guides': 'Feature Guides',
  '04-api-reference': 'API Reference',
  '05-advanced': 'Advanced',
  '06-internals': 'Internals',
  '07-contributor-notes': 'Contributor Notes',
};

const BEGINNER_GUIDE_ORDER = [
  'your-first-image',
  'add-text',
  'add-images',
  'save-export',
  'add-backgrounds',
  'draw-shapes',
  'common-mistakes',
];

const RECIPES_ORDER = [
  'recipes',
  'social-media-banner',
  'quote-image',
  'product-card',
  'chart-image',
  'animated-gif',
  'video-from-frames',
  'batch-generate-images',
];

/** Nested groups under API Reference (folder basename → sidebar label). */
const API_REFERENCE_SUBFOLDER_ORDER = [
  'api-overview',
  'api-scene',
  'api-lines-paths',
  'api-charts',
  'api-gif',
  'api-video',
  'api-batch-save',
];

const API_REFERENCE_SUBFOLDER_LABELS: Record<string, string> = {
  'api-overview': 'Overview & types',
  'api-scene': 'Canvas & layers',
  'api-lines-paths': 'Lines & paths',
  'api-charts': 'Charts',
  'api-gif': 'GIF & animation',
  'api-video': 'Video',
  'api-batch-save': 'Batch & save',
};

/** Sort files inside each API Reference subgroup (basename without `.mdx`). */
const API_REFERENCE_FILES_ORDER_BY_SUBFOLDER: Record<string, string[]> = {
  'api-overview': ['api-reference', 'package-surface', 'canvas-utils-and-types'],
  'api-scene': [
    'api-new-apex-painter',
    'api-create-canvas',
    'api-create-image',
    'api-create-text',
    'api-measure-text',
  ],
  'api-lines-paths': ['api-create-custom', 'api-create-path2d', 'api-draw-path'],
  'api-charts': ['api-create-chart', 'api-create-comparison-chart', 'api-create-combo-chart'],
  'api-gif': ['api-create-gif', 'api-animate'],
  'api-video': ['api-create-video'],
  'api-batch-save': ['api-batch', 'api-chain', 'api-save', 'api-save-multiple', 'api-output', 'api-valid-hex'],
};

const ADVANCED_ORDER = [
  'advanced',
  'canvas-pipeline',
  'advanced-raster-apis',
  'pixel-apis',
  'hit-testing',
  'path2d-draw',
  'video-ffmpeg-internals',
  'video-discovery-frames',
  'complete-developer-guide',
];

const INTERNALS_ORDER = [
  'internals-overview',
  'changelog',
  'internals-charts',
  'internals-canvas-and-text',
  'internals-video-router',
  'internals-batch-image-io',
];

const CONTRIBUTOR_ORDER = [
  'documentation-map',
  'lib-module-charter',
  'package-implementation-reference',
  'troubleshooting',
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get('filename');

  if (filename) {
    try {
      const docsDir = path.join(process.cwd(), 'content', 'docs');
      const files = getAllMdxFiles(docsDir);
      const resolved = resolveDocFilename(filename);
      const file = files.find((f) => f.filename === resolved);

      if (file) {
        const content = fs.readFileSync(file.path, 'utf-8');
        return NextResponse.json({ content });
      }
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    } catch (error) {
      return NextResponse.json({ error: 'Error reading file' }, { status: 500 });
    }
  }

  try {
    const docsDir = path.join(process.cwd(), 'content', 'docs');
    const { folders, rootFiles } = getFolderStructure(docsDir);
    rootFiles.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
    return NextResponse.json({ docs: folders, rootFiles });
  } catch (error) {
    return NextResponse.json({ docs: [], rootFiles: [] });
  }
}

function getAllMdxFiles(dir: string, baseDir = dir): DocFile[] {
  const files: DocFile[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const relativePath = path.relative(baseDir, fullPath);
      const folder = path.dirname(relativePath);
      const name = path.basename(entry.name, '.mdx');

      files.push({
        name: formatName(name),
        path: fullPath,
        folder: folder === '.' ? 'root' : folder,
        filename: name,
      });
    }
  }

  return files;
}

function getDirectMdxFiles(folderPath: string, docsDir: string): DocFile[] {
  const out: DocFile[] = [];
  if (!fs.existsSync(folderPath)) return out;
  for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
    const fullPath = path.join(folderPath, entry.name);
    const relativePath = path.relative(docsDir, fullPath);
    const folder = path.dirname(relativePath);
    const name = path.basename(entry.name, '.mdx');
    out.push({
      name: formatName(name),
      path: fullPath,
      folder: folder === '.' ? 'root' : folder,
      filename: name,
    });
  }
  return out;
}

function featureNestedSubfolderSortKey(parentSegment: string, childName: string): number {
  const order = FEATURE_GUIDE_NESTED_SUBORDER[parentSegment];
  if (!order) return 999;
  const i = order.indexOf(childName);
  return i === -1 ? 500 : i;
}

function featureGuideNestedDisplayName(parentSegmentName: string | undefined, segmentName: string): string {
  if (parentSegmentName && FEATURE_GUIDE_NESTED_LABELS[parentSegmentName]?.[segmentName]) {
    return FEATURE_GUIDE_NESTED_LABELS[parentSegmentName][segmentName];
  }
  if (!parentSegmentName && FEATURE_SUBFOLDER_LABELS[segmentName]) {
    return FEATURE_SUBFOLDER_LABELS[segmentName];
  }
  return formatName(segmentName);
}

/**
 * One topic node under Feature Guides — includes direct `.mdx` files and recursively nested folders.
 */
function buildFeatureGuideTopicTree(
  dirPath: string,
  folderRelative: string,
  segmentName: string,
  docsDir: string,
  parentSegmentName?: string,
): DocSubfolder {
  const posixFolder = folderRelative.split(path.sep).join('/');
  const files = getDirectMdxFiles(dirPath, docsDir).map((f) => ({
    ...f,
    folder: posixFolder,
  }));
  sortFilesWithOrder(files, null, segmentName);

  const nested: DocSubfolder[] = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const childPath = path.join(dirPath, entry.name);
    const childRel = path.join(folderRelative, entry.name);
    const child = buildFeatureGuideTopicTree(childPath, childRel, entry.name, docsDir, segmentName);
    if (child.files.length === 0 && (!child.subfolders || child.subfolders.length === 0)) continue;
    nested.push(child);
  }

  nested.sort((a, b) => {
    const da = featureNestedSubfolderSortKey(segmentName, a.name);
    const db = featureNestedSubfolderSortKey(segmentName, b.name);
    if (da !== db) return da - db;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  return {
    name: segmentName,
    displayName: featureGuideNestedDisplayName(parentSegmentName, segmentName),
    files,
    subfolders: nested.length > 0 ? nested : undefined,
  };
}

function buildFeatureGuideSubfolders(
  folderPath: string,
  topFolderName: string,
  docsDir: string,
): DocSubfolder[] {
  const subfolders: DocSubfolder[] = [];
  if (!fs.existsSync(folderPath)) return subfolders;

  for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const subPath = path.join(folderPath, entry.name);
    const folderRelative = path.join(topFolderName, entry.name);
    const node = buildFeatureGuideTopicTree(subPath, folderRelative, entry.name, docsDir);
    if (node.files.length === 0 && (!node.subfolders || node.subfolders.length === 0)) continue;
    subfolders.push(node);
  }

  subfolders.sort(
    (a, b) => featureSubfolderSortKey(a.name) - featureSubfolderSortKey(b.name),
  );
  return subfolders;
}

function featureSubfolderSortKey(name: string): number {
  const i = FEATURE_GUIDE_SUBFOLDER_ORDER.indexOf(name);
  return i === -1 ? 999 : i;
}

/** Sidebar titles for API Reference: drop redundant `api-` prefix on method pages. */
function formatApiSidebarTitle(filename: string): string {
  if (filename === 'api-reference') return 'Methods index';
  if (filename.startsWith('api-')) return formatName(filename.slice(4));
  return formatName(filename);
}

function mapApiReferenceDocFiles(files: DocFile[]): DocFile[] {
  return files.map((f) => ({ ...f, name: formatApiSidebarTitle(f.filename) }));
}

function buildApiReferenceSubfolders(folderPath: string, topFolderName: string, docsDir: string): DocSubfolder[] {
  const subfolders: DocSubfolder[] = [];
  if (!fs.existsSync(folderPath)) return subfolders;

  for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const subPath = path.join(folderPath, entry.name);
    const rawFiles = getDirectMdxFiles(subPath, docsDir).map((f) => ({
      ...f,
      folder: `${topFolderName}/${entry.name}`,
    }));
    if (rawFiles.length === 0) continue;
    const files = mapApiReferenceDocFiles(rawFiles);
    sortFilesWithOrder(files, API_REFERENCE_FILES_ORDER_BY_SUBFOLDER[entry.name] ?? null, entry.name);
    subfolders.push({
      name: entry.name,
      displayName: API_REFERENCE_SUBFOLDER_LABELS[entry.name] ?? formatName(entry.name),
      files,
    });
  }

  subfolders.sort((a, b) => apiReferenceSubfolderSortKey(a.name) - apiReferenceSubfolderSortKey(b.name));
  return subfolders;
}

function apiReferenceSubfolderSortKey(name: string): number {
  const i = API_REFERENCE_SUBFOLDER_ORDER.indexOf(name);
  return i === -1 ? 999 : i;
}

function getFolderStructure(docsDir: string): { folders: DocFolder[]; rootFiles: DocFile[] } {
  if (!fs.existsSync(docsDir)) {
    return { folders: [], rootFiles: [] };
  }

  const folders: DocFolder[] = [];
  const entries = fs.readdirSync(docsDir, { withFileTypes: true });
  const rootFiles: DocFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderPath = path.join(docsDir, entry.name);

      if (entry.name === '03-feature-guides') {
        const subfolders = buildFeatureGuideSubfolders(folderPath, entry.name, docsDir);
        const looseFiles = getDirectMdxFiles(folderPath, docsDir).map((f) => ({
          ...f,
          folder: entry.name,
        }));
        sortFilesWithOrder(looseFiles, null, entry.name);
        if (subfolders.length > 0 || looseFiles.length > 0) {
          folders.push({
            name: entry.name,
            displayName: TOP_LEVEL_LABELS[entry.name] ?? folderDisplayName(entry.name),
            path: folderPath,
            files: looseFiles,
            subfolders,
          });
        }
        continue;
      }

      if (entry.name === '04-api-reference') {
        const subfolders = buildApiReferenceSubfolders(folderPath, entry.name, docsDir);
        const looseRaw = getDirectMdxFiles(folderPath, docsDir).map((f) => ({
          ...f,
          folder: entry.name,
        }));
        const looseFiles = mapApiReferenceDocFiles(looseRaw);
        sortFilesWithOrder(looseFiles, null, entry.name);
        if (subfolders.length > 0 || looseFiles.length > 0) {
          folders.push({
            name: entry.name,
            displayName: TOP_LEVEL_LABELS[entry.name] ?? folderDisplayName(entry.name),
            path: folderPath,
            files: looseFiles,
            subfolders,
          });
        }
        continue;
      }

      const files = getDirectMdxFiles(folderPath, docsDir).map((f) => ({
        ...f,
        folder: entry.name,
      }));
      if (files.length === 0) continue;

      sortFilesForTopLevelFolder(entry.name, files);
      folders.push({
        name: entry.name,
        displayName: TOP_LEVEL_LABELS[entry.name] ?? folderDisplayName(entry.name),
        path: folderPath,
        files,
      });
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const fullPath = path.join(docsDir, entry.name);
      const name = path.basename(entry.name, '.mdx');
      rootFiles.push({
        name: formatName(name),
        path: fullPath,
        folder: 'root',
        filename: name,
      });
    }
  }

  folders.sort((a, b) => topLevelSortKey(a.name) - topLevelSortKey(b.name));

  return { folders, rootFiles };
}

function topLevelSortKey(name: string): number {
  const i = TOP_LEVEL_FOLDER_ORDER.indexOf(name);
  if (i !== -1) return i;
  return 100 + name.localeCompare('', undefined, { numeric: true });
}

function formatName(filename: string): string {
  return filename
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Strip leading `01-` style ordering segment for sidebar labels. */
function folderDisplayName(rawFolderName: string): string {
  const stripped = rawFolderName.replace(/^\d+-/, '');
  return formatName(stripped);
}

function sortFilesForTopLevelFolder(folderName: string, files: DocFile[]): void {
  if (folderName === '01-beginner-guide') {
    sortFilesWithOrder(files, BEGINNER_GUIDE_ORDER, folderName);
    return;
  }
  if (folderName === '02-recipes') {
    sortFilesWithOrder(files, RECIPES_ORDER, folderName);
    return;
  }
  if (folderName === '05-advanced') {
    sortFilesWithOrder(files, ADVANCED_ORDER, folderName);
    return;
  }
  if (folderName === '06-internals') {
    sortFilesWithOrder(files, INTERNALS_ORDER, folderName);
    return;
  }
  if (folderName === '07-contributor-notes') {
    sortFilesWithOrder(files, CONTRIBUTOR_ORDER, folderName);
    return;
  }

  files.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
}

/** Explicit order list; unknown files sort after, alphabetically. */
function sortFilesWithOrder(files: DocFile[], order: string[] | null | undefined, _folderHint: string): void {
  if (!order) {
    files.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
    return;
  }
  files.sort((a, b) => {
    const ia = order.indexOf(a.filename);
    const ib = order.indexOf(b.filename);
    if (ia === -1 && ib === -1) {
      return a.filename.localeCompare(b.filename, undefined, { numeric: true });
    }
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
