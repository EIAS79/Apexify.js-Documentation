import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DocFile {
  name: string;
  path: string;
  folder: string;
  filename: string;
}

interface DocFolder {
  name: string;
  path: string;
  files: DocFile[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get('filename');

  if (filename) {
    try {
      const docsDir = path.join(process.cwd(), 'content', 'docs');
      const files = getAllMdxFiles(docsDir);
      const file = files.find(f => f.filename === filename);
      
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
        filename: name
      });
    }
  }
  
  return files;
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
      const allFiles = getAllMdxFiles(folderPath, docsDir);
      
      const files = allFiles.filter(f => {
        const relativePath = path.relative(folderPath, f.path);
        return !relativePath.includes(path.sep);
      });
      
      if (files.length > 0) {
        folders.push({
          name: entry.name,
          path: folderPath,
          files: files.map(f => ({
            ...f,
            folder: entry.name
          }))
        });
      }
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const fullPath = path.join(docsDir, entry.name);
      const name = path.basename(entry.name, '.mdx');
      rootFiles.push({
        name: formatName(name),
        path: fullPath,
        folder: 'root',
        filename: name
      });
    }
  }
  
  return { folders, rootFiles };
}

function formatName(filename: string): string {
  return filename
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

