import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SearchResult {
  filename: string;
  name: string;
  folder: string;
  path: string;
  matchType: 'filename' | 'folder' | 'content';
  snippet?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const docsDir = path.join(process.cwd(), 'content', 'docs');
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase().trim();

    const allFiles = getAllMdxFiles(docsDir);

    for (const file of allFiles) {
      if (file.filename.toLowerCase().includes(searchTerm) || 
          file.name.toLowerCase().includes(searchTerm)) {
        results.push({
          filename: file.filename,
          name: file.name,
          folder: file.folder,
          path: file.path,
          matchType: 'filename'
        });
        continue;
      }

      if (file.folder.toLowerCase().includes(searchTerm)) {
        results.push({
          filename: file.filename,
          name: file.name,
          folder: file.folder,
          path: file.path,
          matchType: 'folder'
        });
        continue;
      }

      try {
        const content = fs.readFileSync(file.path, 'utf-8');
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes(searchTerm)) {
          const index = contentLower.indexOf(searchTerm);
          const start = Math.max(0, index - 50);
          const end = Math.min(content.length, index + searchTerm.length + 50);
          let snippet = content.substring(start, end);
          
          snippet = snippet
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]+`/g, '') 
            .replace(/[#*_~]/g, '') 
            .replace(/\n+/g, ' ')
            .trim();
          
          if (snippet.length > 150) {
            snippet = snippet.substring(0, 150) + '...';
          }

          results.push({
            filename: file.filename,
            name: file.name,
            folder: file.folder,
            path: file.path,
            matchType: 'content',
            snippet
          });
        }
      } catch (error) {
        continue;
      }
    }

    results.sort((a, b) => {
      const order = { filename: 0, folder: 1, content: 2 };
      return order[a.matchType] - order[b.matchType];
    });

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

function getAllMdxFiles(dir: string, baseDir = dir): Array<{ filename: string; name: string; folder: string; path: string }> {
  const files: Array<{ filename: string; name: string; folder: string; path: string }> = [];
  
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
        filename: name
      });
    }
  }
  
  return files;
}

function formatName(filename: string): string {
  return filename
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

