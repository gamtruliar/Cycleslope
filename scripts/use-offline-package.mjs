#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const [, , inputPathArg, destinationArg] = process.argv;

if (!inputPathArg) {
  console.error('Usage: node scripts/use-offline-package.mjs <archive.json> [destinationDir]');
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputPathArg);
const destinationRoot = path.resolve(process.cwd(), destinationArg ?? 'offline-packages');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function extractTarball(tgzPath, destination) {
  return new Promise((resolve, reject) => {
    const tar = spawn('tar', ['-xzf', tgzPath, '-C', destination]);
    let stderr = '';
    tar.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    tar.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tar exited with code ${code}: ${stderr}`));
      }
    });
  });
}

function normaliseDataUri(value) {
  const dataPrefix = 'data:';
  if (!value.startsWith(dataPrefix)) return value;
  const commaIndex = value.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URI: missing comma separator');
  }
  return value.slice(commaIndex + 1);
}

async function main() {
  const raw = await fs.readFile(inputPath, 'utf8');
  let meta;
  try {
    meta = JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to parse JSON from ${inputPath}:`, error.message);
    process.exit(1);
  }

  const tarballBase64 =
    meta.tarball ??
    meta.dist?.tarballBase64 ??
    meta.dist?.base64 ??
    meta.archiveBase64 ??
    (typeof meta.dist?.tarball === 'string' && normaliseDataUri(meta.dist.tarball));

  if (!tarballBase64) {
    console.error('Archive JSON is missing a base64-encoded tarball payload.');
    process.exit(1);
  }

  const packageName = meta.name ?? meta.package?.name;
  if (!packageName) {
    console.error('Archive JSON must include a `name` field.');
    process.exit(1);
  }

  const version = meta.version ?? meta.package?.version ?? '0.0.0';
  const safeName = packageName.replace(/[\\/:]/g, '_');
  const destinationDir = path.join(destinationRoot, safeName);

  await ensureDir(destinationDir);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'offline-package-'));
  const tmpTgzPath = path.join(tmpDir, `${safeName}-${version}.tgz`);
  await fs.writeFile(tmpTgzPath, Buffer.from(tarballBase64, 'base64'));

  await extractTarball(tmpTgzPath, destinationDir);

  const packageFolder = path.join(destinationDir, 'package');
  try {
    const stats = await fs.stat(packageFolder);
    if (stats.isDirectory()) {
      const entries = await fs.readdir(packageFolder);
      await Promise.all(
        entries.map(async (entry) => {
          const src = path.join(packageFolder, entry);
          const dest = path.join(destinationDir, entry);
          await fs.rm(dest, { recursive: true, force: true });
          await fs.rename(src, dest);
        })
      );
      await fs.rm(packageFolder, { recursive: true, force: true });
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.rm(tmpDir, { recursive: true, force: true });

  console.log(`Extracted ${packageName}@${version} to ${destinationDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
