#!/usr/bin/env node

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(repoRoot, 'src');
const distRoot = join(repoRoot, 'dist');
const checkOnly = process.argv.includes('--check');
const diagnostics = [];

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  esModuleInterop: true,
  isolatedModules: true,
  strict: true,
  skipLibCheck: true,
};

if (!checkOnly) {
  rmSync(distRoot, { recursive: true, force: true });
  mkdirSync(distRoot, { recursive: true });
}

for (const file of listFiles(srcRoot)) {
  const rel = relative(srcRoot, file);

  if (file.endsWith('.ts')) {
    transpileTypeScript(file, rel);
  } else if (!checkOnly && shouldCopy(file)) {
    copyAsset(file, join(distRoot, rel));
  }
}

if (diagnostics.length > 0) {
  console.error(formatDiagnostics(diagnostics));
  process.exit(1);
}

if (!checkOnly) {
  console.log('Built server files into dist/');
} else {
  console.log('TypeScript syntax/transpile check passed.');
}

function transpileTypeScript(file, rel) {
  const source = readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions,
    reportDiagnostics: true,
  });
  diagnostics.push(...(result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error));

  if (checkOnly) return;

  const outFile = join(distRoot, rel.replace(/\.ts$/, '.js'));
  mkdirSync(dirname(outFile), { recursive: true });
  const executableOutput = rel === 'server.ts'
    ? `#!/usr/bin/env node\n${result.outputText}`
    : result.outputText;
  writeFileSync(outFile, executableOutput);
}

function copyAsset(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

function listFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function shouldCopy(file) {
  return ['.json'].includes(extname(file)) && statSync(file).isFile();
}

function formatDiagnostics(items) {
  return ts.formatDiagnosticsWithColorAndContext(items, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => repoRoot,
    getNewLine: () => '\n',
  });
}
