import { createServiceRoleClient } from "@/lib/supabase";
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to load service account from file (for development)
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully from file');
  } catch (error) {
    console.warn('Firebase Admin SDK not initialized - service account file not found or invalid');
    console.warn('Push notifications will be simulated until Firebase Admin is properly configured');
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    type: 'reply' | 'reaction' | 'new_post';
    questionId?: string;
    replyId?: string;
    [key: string]: any;
  };
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send push notification to a specific user
   */
  public async sendPushNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      console.log(`Sending push notification to user ${userId}:`, payload);
      
      // Get user's FCM tokens from database
      const supabase = await createServiceRoleClient();
      const { data: tokens, error } = await supabase
        .from('user_fcm_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching FCM tokens:', error);
        return false;
      }

      if (!tokens || tokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        return false;
      }

      console.log(`Found ${tokens.length} FCM tokens for user ${userId}`);

      // Send actual notifications using Firebase Admin SDK
      const sendPromises = tokens.map(async (token) => {
        try {
          await admin.messaging().send({
            token: token.token,
            notification: {
              title: payload.title,
              body: payload.body
            },
            data: payload.data
          });
          console.log('Notification sent successfully to:', token.token);
          return { success: true, token: token.token };
        } catch (error: any) {
          console.error('Error sending notification to token:', token.token, error);
          
          // Remove invalid tokens from database
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            await this.removeInvalidToken(userId, token.token);
          }
          
          return { success: false, token: token.token, error: error.message };
        }
      });

      const results = await Promise.all(sendPromises);
      const successfulSends = results.filter(result => result.success).length;
      
      console.log(`Sent ${successfulSends}/${tokens.length} notifications successfully`);
      return successfulSends > 0;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send notification for new reply
   */
  public async sendReplyNotification(replyAuthorId: string, postOwnerId: string, postId: string, replyId: string): Promise<boolean> {
    if (replyAuthorId === postOwnerId) {
      console.log('Skipping notification for self-reply');
      return false;
    }

    // Get reply author's name for the notification
    const supabase = await createServiceRoleClient();
    const { data: author } = await supabase
      .from('profiles')
      .select('display_name, full_name, username')
      .eq('id', replyAuthorId)
      .single();

    const authorName = author?.display_name || author?.full_name || author?.username || 'Someone';

    const payload: NotificationPayload = {
      title: 'New Reply',
      body: `${authorName} replied to your post`,
      data: {
        type: 'reply',
        questionId: postId,
        replyId: replyId
      }
    };

    return this.sendPushNotification(postOwnerId, payload);
  }

  /**
   * Send notification for new reaction
   */
  public async sendReactionNotification(reactorId: string, postOwnerId: string, postId: string, emoji: string): Promise<boolean> {
    if (reactorId === postOwnerId) {
      console.log('Skipping notification for self-reaction');
      return false;
    }

    // Get reactor's name for the notification
    const supabase = await createServiceRoleClient();
    const { data: reactor } = await supabase
      .from('profiles')
      .select('display_name, full_name, username')
      .eq('id', reactorId)
      .single();

    const reactorName = reactor?.display_name || reactor?.full_name || reactor?.username || 'Someone';

    const payload: NotificationPayload = {
      title: 'New Reaction',
      body: `${reactorName} reacted ${emoji} to your post`,
      data: {
        type: 'reaction',
        questionId: postId,
        emoji: emoji
      }
    };

    return this.sendPushNotification(postOwnerId, payload);
  }

  /**
   * Send notification for new post
   */
  public async sendNewPostNotification(postAuthorId: string, partnerId: string, postId: string): Promise<boolean> {
    if (postAuthorId === partnerId) {
      console.log('Skipping notification for self-post');
      return false;
    }

    // Get post author's name for the notification
    const supabase = await createServiceRoleClient();
    const { data: author } = await supabase
      .from('profiles')
      .select('display_name, full_name, username')
      .eq('id', postAuthorId)
      .single();

    const authorName = author?.display_name || author?.full_name || author?.username || 'Your partner';

    const payload: NotificationPayload = {
      title: 'New Post',
      body: `${authorName} posted a new seed`,
      data: {
        type: 'new_post',
        questionId: postId
      }
    };

    return this.sendPushNotification(partnerId, payload);
  }

  /**
   * Remove invalid FCM token from database
   */
  private async removeInvalidToken(userId: string, token: string): Promise<void> {
    try {
      const supabase = await createServiceRoleClient();
      const { error } = await supabase
        .from('user_fcm_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        console.error('Error removing invalid token:', error);
      } else {
        console.log('Removed invalid FCM token for user:', userId);
      }
    } catch (error) {
      console.error('Error in removeInvalidToken:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
