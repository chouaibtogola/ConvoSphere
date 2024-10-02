import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { topicStarters } from './topicStartersData';

// Initialize Firebase Admin SDK
const adminSdkPath = path.join(__dirname, '..', '..', '..', 'trust-copy', 'firebase-adminsdk.json');
initializeApp({
  credential: cert(adminSdkPath),
});

const db = getFirestore();

async function setupTopicStarters() {
  const batch = db.batch();
  const topicStartersRef = db.collection('topicStarters');

  for (const starter of topicStarters) {
    const docRef = topicStartersRef.doc(); // Auto-generate ID
    batch.set(docRef, starter);
  }

  await batch.commit();
  console.log('Topic starters have been added to Firestore.');
}

setupTopicStarters().catch(console.error);