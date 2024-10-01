'use client';

import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const interests = [
  'Cars', 'Tech', 'Animals', 'Cooking', 'Sports',
  'Travel', 'Art', 'Books', 'Movies', 'Games',
];

export default function InterestsPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchInterests = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedInterests(userData.interests || []);
      }

      setLoading(false);
    };

    fetchInterests();
  }, [router]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setSaveMessage('');
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Get the current user document
      const userDoc = await getDoc(userDocRef);
      const currentInterests = userDoc.data()?.interests || [];

      // Check if the interests have actually changed
      const interestsChanged = JSON.stringify(currentInterests.sort()) !== JSON.stringify(selectedInterests.sort());

      if (interestsChanged) {
        await setDoc(userDocRef, { interests: selectedInterests }, { merge: true });
        setSaveMessage('Interests saved successfully!');
      } else {
        setSaveMessage('No changes to save');
      }
    } catch (error) {
      console.error('Error saving interests:', error);
      setSaveMessage('Failed to save interests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !auth.currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-600 text-white">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-6">Choose Your Interests</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {interests.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`p-4 rounded-lg text-center transition-colors ${
                selectedInterests.includes(interest)
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-500 hover:bg-purple-400'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Interests'}
          </button>
          {saveMessage && (
            <p className={`mt-2 text-sm ${saveMessage.includes('successfully') ? 'text-green-300' : 'text-yellow-300'}`}>
              {saveMessage}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}