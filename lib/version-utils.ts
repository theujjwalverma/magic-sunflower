// Fallback for development or if version file is not generated
let APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'development';

try {
  const { APP_VERSION: ImportedVersion } = require('./version');
  APP_VERSION = ImportedVersion;
} catch (error) {
  // Use fallback version if import fails
  console.warn('Could not import version, using fallback');
}

const AUTH_KEY = 'auth';
const VERSION_KEY = 'app_version';

export function clearSelectiveLocalStorage() {
  // Create a map to store preserved items
  const preservedItems = new Map<string, string>();

  // Preserve specific keys
  const keysToPreserve = [AUTH_KEY];
  keysToPreserve.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      preservedItems.set(key, item);
    }
  });

  // Clear all localStorage
  localStorage.clear();

  // Restore preserved items
  preservedItems.forEach((value, key) => {
    localStorage.setItem(key, value);
  });
}

export function checkVersion() {
  // Check if running in browser environment
  if (typeof window === 'undefined') return;

  const savedVersion = localStorage.getItem(VERSION_KEY);
  
  if (savedVersion !== APP_VERSION) {
    // Version changed - clear caches and localStorage
    clearSelectiveLocalStorage();
    
    // Save new version
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // Reload the app
    window.location.reload();
  }
}

// Optional: Add a function to manually trigger version check
export function forceVersionCheck() {
  localStorage.removeItem(VERSION_KEY);
  checkVersion();
}
