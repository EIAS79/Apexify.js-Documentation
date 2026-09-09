import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import {
  createLegacyIdentityMap,
  getDocumentationPageBySourcePath,
} from '@/lib/docs/content';
import { stripDocumentationFrontmatter } from '@/lib/docs/frontmatter';

interface SearchResult {
  filename: string;
  name: string;
  folder: string;
  href: string;
  matchType: 'filename' | 'folder' | 'content';
  snippet?: string;
}

interface SearchFile {
  filename: string;
  name: string;
  folder: string;
  path: string;
  sourcePath: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const docsDir = path.join(process.cwd(), 'content', 'docs');
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase().trim();
    const migratedByLegacyIdentity = createLegacyIdentityMap();

    for (const file of getAllMdxFiles(docsDir)) {
      const migratedPage =
        getDocumentationPageBySourcePath(file.sourcePath) ??
        migratedByLegacyIdentity.get(file.filename) ??
        null;
      const resultName = migratedPage?.title ?? file.name;
      const resultFolder = migratedPage?.category ?? file.folder;
      const href = migratedPage?.canonicalPath ?? `/docs#${file.filename}`;

      if (
        file.filename.toLowerCase().includes(searchTerm) ||
        resultName.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          filename: file.filename,
          name: resultName,
          folder: resultFolder,
          href,
          matchType: 'filename',
        });
        continue;
      }

      if (resultFolder.toLowerCase().includes(searchTerm)) {
        results.push({
          filename: file.filename,
          name: resultName,
          folder: resultFolder,
          href,
          matchType: 'folder',
        });
        continue;
      }

      try {
        const rawContent = fs.readFileSync(file.path, 'utf8');
        const content = stripDocumentationFrontmatter(rawContent, file.sourcePath);
        const contentLower = content.toLowerCase();

        if (!contentLower.includes(searchTerm)) continue;

        const index = contentLower.indexOf(searchTerm);
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + searchTerm.length + 50);
        let snippet = content
          .slice(start, end)
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`[^`]+`/g, '')
          .replace(/[#*_~]/g, '')
          .replace(/\n+/g, ' ')
          .trim();

        if (snippet.length > 150) snippet = `${snippet.slice(0, 150)}...`;

        results.push({
          filename: file.filename,
          name: resultName,
          folder: resultFolder,
          href,
          matchType: 'content',
          snippet,
        });
      } catch {
        continue;
      }
    }

    const rank: Record<SearchResult['matchType'], number> = {
      filename: 0,
      folder: 1,
      content: 2,
    };
    results.sort(
      (a, b) =>
        rank[a.matchType] - rank[b.matchType] ||
        a.name.localeCompare(b.name) ||
        a.href.localeCompare(b.href),
    );

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

function getAllMdxFiles(dir: string, baseDir = dir): SearchFile[] {
  const files: SearchFile[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const relativePath = path.relative(baseDir, fullPath);
      const folder = path.dirname(relativePath);
      const filename = path.basename(entry.name, '.mdx');
      files.push({
        filename,
        name: formatName(filename),
        path: fullPath,
        folder: folder === '.' ? 'root' : folder,
        sourcePath: path
          .relative(process.cwd(), fullPath)
          .split(path.sep)
          .join('/'),
      });
    }
  }

  return files;
}

function formatName(filename: string): string {
  return filename
    .replace(/^\d+-/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
