let googleMapsLoadingPromise: Promise<void> | null = null;
let isGoogleMapsLoaded = false;

export const loadGoogleMapsSDK = (): Promise<void> => {
  // Return existing promise if already loading
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  // Return resolved promise if already loaded
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  // Check if script is already in document
  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );

  if (existingScript) {
    // Script exists but might not be loaded yet
    googleMapsLoadingPromise = new Promise((resolve) => {
      const checkLoaded = () => {
        if (typeof window.google !== 'undefined' && window.google.maps) {
          isGoogleMapsLoaded = true;
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
    return googleMapsLoadingPromise;
  }

  // Create new script and load it
  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCy2nW9btVnM38dVo4bQ6awzxhfq7xU4Bs&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve();
    };
    
    script.onerror = (error) => {
      googleMapsLoadingPromise = null;
      reject(new Error('Failed to load Google Maps SDK'));
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
};

export const getGoogleMapsLoadedStatus = (): boolean => {
  return isGoogleMapsLoaded;
};

export const resetGoogleMapsLoading = (): void => {
  googleMapsLoadingPromise = null;
  isGoogleMapsLoaded = false;
};
