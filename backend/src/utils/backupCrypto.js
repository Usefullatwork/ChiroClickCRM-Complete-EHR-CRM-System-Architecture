/**
 * Backup Encryption Utilities
 * AES-256-GCM encryption/decryption for backup archives.
 * Archive format: [manifestLength 4B][manifestJSON][file1][file2]...
 * Encrypted layout: [IV 16B][authTag 16B][ciphertext...]
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from ENCRYPTION_KEY env var.
 * If the env value is already 64 hex chars, use it directly.
 * Otherwise, SHA-256 hash it to get a consistent 32-byte key.
 */
const getEncryptionKey = () => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY mangler. Kan ikke kryptere sikkerhetskopi.');
  }
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw).digest();
};

/**
 * Recursively collect all files in a directory.
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base for relative paths
 * @returns {Promise<Array<{abs: string, rel: string, size: number}>>}
 */
const collectFiles = async (dir, baseDir) => {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await collectFiles(fullPath, baseDir);
      results.push(...sub);
    } else if (entry.isFile()) {
      const fileStat = await stat(fullPath);
      results.push({
        abs: fullPath,
        rel: path.relative(baseDir, fullPath),
        size: fileStat.size,
      });
    }
  }
  return results;
};

/**
 * Encrypt a directory into a single AES-256-GCM encrypted buffer.
 * @param {string} sourceDir - Directory to encrypt
 * @returns {Promise<Buffer>} Encrypted buffer (IV + authTag + ciphertext)
 */
export const encryptDirectory = async (sourceDir) => {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const files = await collectFiles(sourceDir, sourceDir);
  const manifest = files.map((f) => ({ rel: f.rel, size: f.size }));
  const manifestBuf = Buffer.from(JSON.stringify(manifest), 'utf8');
  const manifestLenBuf = Buffer.alloc(4);
  manifestLenBuf.writeUInt32BE(manifestBuf.length, 0);

  const chunks = [manifestLenBuf, manifestBuf];
  for (const f of files) {
    const content = await readFile(f.abs);
    chunks.push(content);
  }
  const plaintext = Buffer.concat(chunks);

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
};

/**
 * Decrypt an .enc file and extract the archive to a target directory.
 * @param {string} encFilePath - Path to the .enc file
 * @param {string} targetDir - Directory to extract files into
 */
export const decryptToDirectory = async (encFilePath, targetDir) => {
  const key = getEncryptionKey();
  const encData = await readFile(encFilePath);

  if (encData.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Kryptert fil er for kort eller skadet.');
  }

  const iv = encData.subarray(0, IV_LENGTH);
  const authTag = encData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Parse manifest
  const manifestLen = plaintext.readUInt32BE(0);
  const manifestJson = plaintext.subarray(4, 4 + manifestLen).toString('utf8');
  const manifest = JSON.parse(manifestJson);

  // Extract files
  let offset = 4 + manifestLen;
  for (const entry of manifest) {
    const content = plaintext.subarray(offset, offset + entry.size);
    offset += entry.size;
    const targetPath = path.join(targetDir, entry.rel);
    // Prevent directory traversal
    if (!targetPath.startsWith(targetDir)) {
      throw new Error(`Ugyldig filsti i sikkerhetskopi: ${entry.rel}`);
    }
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, content);
  }
};

/**
 * Compute SHA-256 of a file and return hex digest.
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export const hashFile = async (filePath) => {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
};

export default {
  encryptDirectory,
  decryptToDirectory,
  hashFile,
};
