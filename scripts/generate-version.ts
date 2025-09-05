import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

// Ensure the lib directory exists
const libDir = path.join(__dirname, '../lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// Generate unique version string
const getVersion = () => {
  try {
    // Try to get the latest commit hash
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    return commitHash;
  } catch (error) {
    // Fallback to timestamp + random hash if git command fails
    return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
};

const version = process.env.VERCEL_GIT_COMMIT_SHA || getVersion();

// Create version.ts file
const versionContent = `
// Auto-generated version file
export const APP_VERSION = "${version}";
export const BUILD_TIMESTAMP = "${new Date().toISOString()}";
`;

// Write to version.ts in the lib directory
const versionFilePath = path.join(libDir, 'version.ts');
fs.writeFileSync(versionFilePath, versionContent);

console.log(`Version generated: ${version}`);
console.log(`Version file written to: ${versionFilePath}`);
