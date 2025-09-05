"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export function useFirebaseNotifications() {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Check notification permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission and register FCM token
  const registerForNotifications = async () => {
    try {
      // Check if Notification API is available
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notification API not available');
        return null;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log('Notification permission granted');
        
        // In a real implementation, this would get the FCM token from Firebase
        // For now, we'll simulate the token registration
        const simulatedToken = `simulated_fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (user?.id) {
          // Store the token in the database
          const response = await fetch('/api/notifications/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: simulatedToken, userId: user.id })
          });

          if (response.ok) {
            setFcmToken(simulatedToken);
            setNotificationPermission('granted');
            console.log('FCM token registered successfully');
          }
        }
        return simulatedToken;
      } else {
        console.log('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
      return null;
    }
  };

  // Remove FCM token when user logs out
  const unregisterNotifications = async () => {
    if (user?.id) {
      try {
        await fetch('/api/notifications/token', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        setFcmToken(null);
        console.log('FCM tokens removed');
      } catch (error) {
        console.error('Error unregistering notifications:', error);
      }
    }
  };

  // Register/unregister based on auth state
  useEffect(() => {
    if (user && notificationPermission === 'default') {
      // Auto-request permission when user is authenticated
      registerForNotifications();
    } else if (!user && fcmToken) {
      // Clean up when user logs out
      unregisterNotifications();
    }
  }, [user, notificationPermission, fcmToken]);

  return {
    notificationPermission,
    fcmToken,
    registerForNotifications,
    unregisterNotifications,
    hasPermission: notificationPermission === 'granted'
  };
}
