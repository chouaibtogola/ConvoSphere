import { db } from '../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

export const addUserToFirestore = async (userId: string, email: string) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      email,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error('Error adding user to Firestore:', error)
  }
}