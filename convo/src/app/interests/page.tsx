'use client';

import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
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
  const [matches, setMatches] = useState<{ userId: string, commonInterests: string[] }[]>([]);
  const [potentialMatches, setPotentialMatches] = useState(0);
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

  const calculatePotentialMatches = async (interests: string[]) => {
    if (interests.length === 0) {
      setPotentialMatches(0);
      return;
    }

    const usersRef = collection(db, 'users');
    const currentUserId = auth.currentUser?.uid;

    // Query for users who are online, not matched, and have at least one common interest
    const matchQuery = query(usersRef, 
      where('isOnline', '==', true),
      where('isMatched', '==', false),
      where('interests', 'array-contains-any', interests)
    );

    const matchSnapshot = await getDocs(matchQuery);
    const matchCount = matchSnapshot.docs.filter(doc => doc.id !== currentUserId).length;

    setPotentialMatches(matchCount);
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prevInterests) => {
      let newInterests;
      if (prevInterests.includes(interest)) {
        newInterests = prevInterests.filter((i) => i !== interest);
        setErrorMessage('');
      } else {
        if (prevInterests.length < 3) {
          newInterests = [...prevInterests, interest];
          setErrorMessage('');
        } else {
          setErrorMessage("You can't pick more than 3 interests.");
          return prevInterests;
        }
      }

      // Calculate potential matches after updating interests
      calculatePotentialMatches(newInterests);
      return newInterests;
    });
  };

  const findMatches = async (userInterests: string[]) => {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const currentUserId = auth.currentUser?.uid;
    
    let potentialMatches: { userId: string, commonInterests: string[] }[] = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userDoc.id !== currentUserId && userData.interests) {
        const commonInterests = userInterests.filter(interest => 
          userData.interests.includes(interest)
        );
        if (commonInterests.length > 0) {
          potentialMatches.push({ userId: userDoc.id, commonInterests });
        }
      }
    });

    // Sort matches by number of common interests (descending)
    potentialMatches.sort((a, b) => b.commonInterests.length - a.commonInterests.length);

    return potentialMatches;
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
      await setDoc(userDocRef, { 
        interests: selectedInterests.slice(0, 3),
        isMatched: false // Add this line
      }, { merge: true });
      
      // Find matches after saving interests
      const matchedUsers = await findMatches(selectedInterests);
      setMatches(matchedUsers);

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
        
        {/* Potential Matches Box */}
        {selectedInterests.length > 0 && (
          <div className="bg-white text-purple-600 rounded-lg p-4 mb-6">
            <p className="font-bold">Potential Matches: {potentialMatches}</p>
            <p className="text-sm">Online users with similar interests</p>
          </div>
        )}

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
        
        {matches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Matches</h2>
            <ul>
              {matches.map((match, index) => (
                <li key={match.userId} className="mb-2">
                  User {index + 1}: {match.commonInterests.length} common interests
                  ({match.commonInterests.join(', ')})
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}