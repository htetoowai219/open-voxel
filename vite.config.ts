import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile, appendFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import ts from 'typescript';

const ROOT = process.cwd();
const UNITS_DIR = path.join(ROOT, 'src', 'units');
const REGISTRY_FILE = path.join(UNITS_DIR, 'index.ts');
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendError(res: ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: message });
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > 1_000_000) throw new Error('Request body is too large.');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function propertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function findClipObject(sourceFile: ts.SourceFile, clipId: string): ts.ObjectLiteralExpression | null {
  let found: ts.ObjectLiteralExpression | null = null;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isObjectLiteralExpression(node)) {
      const idProperty = node.properties.find(
        (property): property is ts.PropertyAssignment =>
          ts.isPropertyAssignment(property) && propertyName(property.name) === 'id',
      );
      const hasParams = node.properties.some(
        (property) => ts.isPropertyAssignment(property) && propertyName(property.name) === 'params',
      );
      if (
        hasParams &&
        idProperty &&
        ts.isStringLiteral(idProperty.initializer) &&
        idProperty.initializer.text === clipId
      ) {
        found = node;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function findPartsArray(sourceFile: ts.SourceFile): ts.ArrayLiteralExpression | null {
  let found: ts.ArrayLiteralExpression | null = null;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isPropertyAssignment(node) && propertyName(node.name) === 'parts') {
      if (ts.isArrayLiteralExpression(node.initializer)) {
        found = node.initializer;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function parseSource(filePath: string, text: string): ts.SourceFile {
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

interface PatchParamsResult {
  updated: number;
  missing: string[];
}

async function saveClipParams(unitId: string, clipId: string, values: Record<string, number>): Promise<PatchParamsResult> {
  const filePath = path.join(UNITS_DIR, unitId, 'unit.ts');
  const text = await readFile(filePath, 'utf8');
  const sourceFile = parseSource(filePath, text);
  const clip = findClipObject(sourceFile, clipId);
  if (!clip) throw new Error(`Clip "${clipId}" was not found in ${unitId}/unit.ts.`);

  const paramsProperty = clip.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) && propertyName(property.name) === 'params',
  );
  if (!paramsProperty || !ts.isObjectLiteralExpression(paramsProperty.initializer)) {
    throw new Error(`Clip "${clipId}" has no params object.`);
  }

  const edits: Array<{ start: number; end: number; next: string }> = [];
  const missing: string[] = [];

  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) continue;
    const parameter = paramsProperty.initializer.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) && propertyName(property.name) === key,
    );
    if (!parameter || !ts.isObjectLiteralExpression(parameter.initializer)) {
      missing.push(key);
      continue;
    }
    const valueProperty = parameter.initializer.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) && propertyName(property.name) === 'value',
    );
    if (!valueProperty || !ts.isNumericLiteral(valueProperty.initializer)) {
      missing.push(key);
      continue;
    }
    edits.push({
      start: valueProperty.initializer.getStart(sourceFile),
      end: valueProperty.initializer.getEnd(),
      next: String(Math.round(value * 10_000) / 10_000),
    });
  }

  if (edits.length === 0) {
    throw new Error('No matching numeric parameter values were found.');
  }

  let nextText = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    nextText = nextText.slice(0, edit.start) + edit.next + nextText.slice(edit.end);
  }
  await writeFile(filePath, nextText, 'utf8');
  return { updated: edits.length, missing };
}

async function deletePart(unitId: string, partId: string): Promise<void> {
  const filePath = path.join(UNITS_DIR, unitId, 'unit.ts');
  const text = await readFile(filePath, 'utf8');
  const sourceFile = parseSource(filePath, text);
  const partsArray = findPartsArray(sourceFile);
  if (!partsArray) throw new Error('Could not locate the parts array.');

  const element = partsArray.elements.find((candidate) => {
    if (!ts.isObjectLiteralExpression(candidate)) return false;
    const idProperty = candidate.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) && propertyName(property.name) === 'id',
    );
    return Boolean(
      idProperty &&
        ts.isStringLiteral(idProperty.initializer) &&
        idProperty.initializer.text === partId,
    );
  });

  if (!element) throw new Error(`Part "${partId}" was not found.`);

  let end = element.getEnd();
  while (end < text.length && (text[end] === ' ' || text[end] === '\t')) end += 1;
  if (text[end] === ',') end += 1;
  while (end < text.length && (text[end] === ' ' || text[end] === '\t')) end += 1;
  if (text[end] === '\r') end += 1;
  if (text[end] === '\n') end += 1;

  const start = element.getStart(sourceFile);
  await writeFile(filePath, text.slice(0, start) + text.slice(end), 'utf8');
}

interface StoredComment {
  id: string;
  unitId: string;
  clipId: string;
  frame: number;
  partId?: string;
  text: string;
  createdAt: string;
}

function readComments(text: string): StoredComment[] {
  const comments: StoredComment[] = [];
  const matcher = /^\s*\/\/\s*@voxel-comment\s+(\{.*\})\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as Partial<StoredComment>;
      if (
        typeof parsed.id === 'string' &&
        typeof parsed.unitId === 'string' &&
        typeof parsed.clipId === 'string' &&
        typeof parsed.frame === 'number' &&
        typeof parsed.text === 'string'
      ) {
        comments.push({
          id: parsed.id,
          unitId: parsed.unitId,
          clipId: parsed.clipId,
          frame: parsed.frame,
          partId: typeof parsed.partId === 'string' ? parsed.partId : undefined,
          text: parsed.text,
          createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date(0).toISOString(),
        });
      }
    } catch {
      // Ignore malformed annotations rather than breaking the unit file.
    }
  }
  return comments;
}

async function deleteUnit(unitId: string): Promise<void> {
  const folder = path.join(UNITS_DIR, unitId);
  if (!(await fileExists(folder))) throw new Error(`Unit "${unitId}" does not exist.`);

  if (await fileExists(REGISTRY_FILE)) {
    let registryText = await readFile(REGISTRY_FILE, 'utf8');
    const escapedId = unitId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const importPattern = new RegExp(
      `^\\s*import\\s*\\{\\s*(\\w+)\\s*\\}\\s*from\\s*['"]\\.\\/${escapedId}\\/unit['"];?\\s*$`,
      'm',
    );
    const importMatch = importPattern.exec(registryText);
    if (importMatch) {
      const variableName = importMatch[1];
      registryText = registryText.replace(importMatch[0], '');
      registryText = registryText
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim();
          return trimmed !== `${variableName},` && trimmed !== variableName;
        })
        .join('\n');
      await writeFile(REGISTRY_FILE, registryText.replace(/\n{3,}/g, '\n\n'), 'utf8');
    }
  }

  await rm(folder, { recursive: true, force: true });
}

async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = url.pathname;
  const match = pathname.match(/^\/api\/units\/([a-z0-9-]+)(?:\/(.*))?$/);

  if (!match) {
    if (pathname === '/api/health') {
      sendJson(res, 200, { ok: true });
      return true;
    }
    return false;
  }

  const unitId = match[1];
  const rest = match[2] ?? '';
  if (!SAFE_ID.test(unitId)) {
    sendError(res, 400, 'Invalid unit id.');
    return true;
  }

  const unitFile = path.join(UNITS_DIR, unitId, 'unit.ts');
  if (!(await fileExists(unitFile))) {
    sendError(res, 404, `Unit "${unitId}" does not exist.`);
    return true;
  }

  if (rest === '' && method === 'DELETE') {
    await deleteUnit(unitId);
    sendJson(res, 200, { ok: true, deleted: unitId });
    return true;
  }

  if (rest === 'comments' && method === 'GET') {
    const text = await readFile(unitFile, 'utf8');
    sendJson(res, 200, { comments: readComments(text) });
    return true;
  }

  if (rest === 'comments' && method === 'POST') {
    const body = (await readBody(req)) as Partial<StoredComment>;
    const text = typeof body.text === 'string' ? body.text.trim().replace(/[\r\n]+/g, ' ') : '';
    if (!text) {
      sendError(res, 400, 'Comment text is required.');
      return true;
    }
    const comment: StoredComment = {
      id: `vc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      unitId,
      clipId: typeof body.clipId === 'string' && body.clipId ? body.clipId : 'idle',
      frame: typeof body.frame === 'number' && Number.isFinite(body.frame) ? Math.max(0, Math.round(body.frame)) : 0,
      partId: typeof body.partId === 'string' && body.partId ? body.partId : undefined,
      text: text.slice(0, 2_000),
      createdAt: new Date().toISOString(),
    };
    const existing = await readFile(unitFile, 'utf8');
    const prefix = existing.endsWith('\n') ? '' : '\n';
    await appendFile(
      unitFile,
      `${prefix}// @voxel-comment ${JSON.stringify(comment)}\n`,
      'utf8',
    );
    sendJson(res, 201, { comment });
    return true;
  }

  const clipMatch = rest.match(/^clips\/([a-z0-9-]+)\/params$/);
  if (clipMatch && method === 'POST') {
    const clipId = clipMatch[1];
    const body = (await readBody(req)) as { params?: Record<string, number> };
    if (!body.params || typeof body.params !== 'object') {
      sendError(res, 400, 'A params object is required.');
      return true;
    }
    const result = await saveClipParams(unitId, clipId, body.params);
    sendJson(res, 200, { ok: true, clipId, ...result });
    return true;
  }

  const partMatch = rest.match(/^parts\/([a-z0-9-]+)$/);
  if (partMatch && method === 'DELETE') {
    await deletePart(unitId, partMatch[1]);
    sendJson(res, 200, { ok: true, deleted: partMatch[1] });
    return true;
  }

  sendError(res, 405, 'Unsupported API operation.');
  return true;
}

function voxelStudioApi(): Plugin {
  return {
    name: 'open-voxel-studio-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          next();
          return;
        }
        void handleApi(req, res).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Unexpected filesystem error.';
          if (!res.headersSent) sendError(res, 500, message);
          else res.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), voxelStudioApi()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: false,
  },
  build: {
    target: 'es2022',
  },
});
