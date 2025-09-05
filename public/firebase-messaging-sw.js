importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBchJdIG2wK3ifKRJ_cw9KDloDxEgNoHYI",
  authDomain: "sunflower-c5a49.firebaseapp.com",
  projectId: "sunflower-c5a49",
  storageBucket: "sunflower-c5a49.firebasestorage.app",
  messagingSenderId: "514610704350",
  appId: "1:514610704350:web:515fbe24d4bcdfc0ba374f",
  measurementId: "G-F1LG0QHQ6D"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event.notification.data);
  
  event.notification.close();

  // Handle navigation based on notification data
  const notificationData = event.notification.data;
  
  if (notificationData.type === 'reply' && notificationData.questionId) {
    event.waitUntil(
      clients.openWindow(`/feed/post/${notificationData.questionId}`)
    );
  } else if (notificationData.type === 'reaction' && notificationData.questionId) {
    event.waitUntil(
      clients.openWindow(`/feed/post/${notificationData.questionId}`)
    );
  } else if (notificationData.type === 'new_post' && notificationData.questionId) {
    event.waitUntil(
      clients.openWindow(`/feed/post/${notificationData.questionId}`)
    );
  } else {
    // Default to opening the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
