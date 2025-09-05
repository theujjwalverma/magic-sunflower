const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Use Vercel's commit SHA or generate timestamp + random hash
const version = process.env.VERCEL_GIT_COMMIT_SHA || 
  `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

const versionData = {
  version,
  buildDate: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, '../public/version.json'),
  JSON.stringify(versionData, null, 2)
);
