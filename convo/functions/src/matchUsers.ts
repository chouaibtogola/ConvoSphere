import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';

admin.initializeApp();

export const matchUsers = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to match.');
  }

  const userId = auth.uid;
  const db = admin.firestore();

  try {
    // Find a user who is waiting for a match
    const waitingUsersSnapshot = await db.collection('waitingRoom')
      .where('userId', '!=', userId)
      .limit(1)
      .get();

    if (waitingUsersSnapshot.empty) {
      // No waiting users, add current user to waiting room
      await db.collection('waitingRoom').add({
        userId: userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return { status: 'waiting', message: 'Added to waiting room' };
    } else {
      // Match found, create a chat room
      const matchedUser = waitingUsersSnapshot.docs[0];
      const chatRoomRef = await db.collection('chatRooms').add({
        users: [userId, matchedUser.data().userId],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Remove matched user from waiting room
      await matchedUser.ref.delete();

      return { 
        status: 'matched', 
        chatRoomId: chatRoomRef.id,
        message: 'Match found and chat room created' 
      };
    }
  } catch (error) {
    console.error('Error in matchUsers function:', error);
    throw new HttpsError('internal', 'An error occurred during the matching process');
  }
});