#!/usr/bin/env node

/**
 * CoBit Environment Configuration Generator
 * 
 * Reads environment variables from .env (local) or process.env (hosting/CI),
 * filters ONLY public, client-safe variables, and writes js/env-config.js.
 * 
 * SECURITY:
 * Privileged secrets (e.g. SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL) are
 * strictly blocked and will NEVER be written to the client script.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Allowed client-safe configuration keys
const CLIENT_SAFE_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'OVERALL_ADMIN_EMAIL',
  'STORAGE_BUCKET_NAME'
];

// Blocklist of privileged keys that must NEVER be exposed
const PRIVILEGED_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'SUPABASE_DB_PASSWORD',
  'SERVICE_ROLE_KEY',
  'SECRET_KEY',
  'PRIVATE_KEY'
];

/**
 * Lightweight, zero-dependency .env parser
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Strip wrapping quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    env[key] = val;
  }
  return env;
}

export function generateClientEnv() {
  const envFilePath = path.join(ROOT_DIR, '.env');
  const envExamplePath = path.join(ROOT_DIR, '.env.example');
  const outputFilePath = path.join(ROOT_DIR, 'js', 'env-config.js');

  // Load from .env file first
  let fileEnv = {};
  if (fs.existsSync(envFilePath)) {
    fileEnv = parseEnvFile(envFilePath);
  } else if (fs.existsSync(envExamplePath)) {
    console.warn('\x1b[33m[CoBit] Warning: No .env file found. Reading placeholder from .env.example.\x1b[0m');
    fileEnv = parseEnvFile(envExamplePath);
  }

  // Merge: fileEnv values overridden by system process.env (for Vercel/Netlify/Docker deployments)
  const clientConfig = {};
  for (const key of CLIENT_SAFE_KEYS) {
    const val = process.env[key] || fileEnv[key] || '';
    clientConfig[key] = val;
  }

  // Security Verification: Ensure no privileged secrets leaked into clientConfig
  for (const privKey of PRIVILEGED_KEYS) {
    if (privKey in clientConfig) {
      delete clientConfig[privKey];
      console.error(`\x1b[31m[SECURITY ALERT] Privileged key "${privKey}" was blocked from client config.\x1b[0m`);
    }
  }

  // Generate JS file content
  const fileContent = `/**
 * Client Environment Configuration (Public & Safe for Browser)
 * Generated automatically by scripts/generate-env.js
 * DO NOT EDIT DIRECTLY OR COMMIT TO VERSION CONTROL.
 */
(function() {
  window.__ENV__ = Object.freeze(${JSON.stringify(clientConfig, null, 2)});
})();
`;

  // Ensure js/ directory exists
  const jsDir = path.dirname(outputFilePath);
  if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
  }

  fs.writeFileSync(outputFilePath, fileContent, 'utf8');
  console.log(`\x1b[32m[CoBit] Successfully generated ${path.relative(ROOT_DIR, outputFilePath)}\x1b[0m`);

  return clientConfig;
}

// Run directly when executed from CLI
if (process.argv[1] === __filename) {
  generateClientEnv();
}
