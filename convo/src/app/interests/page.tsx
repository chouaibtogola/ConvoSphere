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
  const [errorMessage, setErrorMessage] = useState('');
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
        // Limit to 3 interests even if more were previously saved
        setSelectedInterests(userData.interests?.slice(0, 3) || []);
      }

      setLoading(false);
    };

    fetchInterests();
  }, [router]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prevInterests) => {
      if (prevInterests.includes(interest)) {
        // If the interest is already selected, remove it
        setErrorMessage(''); // Clear error message when deselecting
        return prevInterests.filter((i) => i !== interest);
      } else {
        // If the interest is not selected, add it only if less than 3 are selected
        if (prevInterests.length < 3) {
          setErrorMessage(''); // Clear error message when selecting valid number
          return [...prevInterests, interest];
        } else {
          // If 3 interests are already selected, show an error message
          setErrorMessage("You can't pick more than 3 interests.");
          return prevInterests;
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      setErrorMessage("Please select at least one interest.");
      return;
    }

    if (selectedInterests.length > 3) {
      setErrorMessage("You can only save up to 3 interests.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to save interests.");
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { interests: selectedInterests.slice(0, 3) }, { merge: true });
      toast.success("Interests saved successfully!");
      router.push('/'); // Redirect to home page after saving
    } catch (error) {
      console.error("Error saving interests:", error);
      toast.error("Failed to save interests. Please try again.");
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
              onClick={() => handleInterestToggle(interest)}
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
            className="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Interests'}
          </button>
          {errorMessage && (
            <p className={`mt-2 text-sm ${saveMessage.includes('successfully') ? 'text-green-300' : 'text-yellow-300'}`}>
              {errorMessage}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}