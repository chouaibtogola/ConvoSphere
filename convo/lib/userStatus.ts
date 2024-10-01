import { auth, db } from '../src/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export const updateOnlineStatus = (userId: string) => {
  const userStatusRef = doc(db, 'users', userId)

  // Create a reference to the special '.info/connected' path in Realtime Database
  const isOfflineForFirestore = {
    isOnline: false,
    lastSeen: serverTimestamp(),
  }

  const isOnlineForFirestore = {
    isOnline: true,
    lastSeen: serverTimestamp(),
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      setDoc(userStatusRef, isOnlineForFirestore, { merge: true })

      // Set up onDisconnect()
      window.addEventListener('beforeunload', () => {
        setDoc(userStatusRef, isOfflineForFirestore, { merge: true })
      })
    } else {
      // User is signed out
      setDoc(userStatusRef, isOfflineForFirestore, { merge: true })
    }
  })
}