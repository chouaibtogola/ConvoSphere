'use client';

import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, onSnapshot, limit, updateDoc } from 'firebase/firestore';
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
  const [originalInterests, setOriginalInterests] = useState<string[]>([]);
  const router = useRouter();
  const [topicStarter, setTopicStarter] = useState('');

  // Add this state to force re-renders when interests change
  const [interestsChanged, setInterestsChanged] = useState(false);

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
        const userInterests = userData.interests?.slice(0, 3) || [];
        setSelectedInterests(userInterests);
        setOriginalInterests(userInterests);
        await calculatePotentialMatches(userInterests);
        setInterestsChanged(false); // Reset the change flag
      }

      setLoading(false);
    };

    fetchInterests();
  }, [router]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      calculatePotentialMatches(selectedInterests);
    });

    return () => unsubscribe();
  }, [selectedInterests]);

  const calculatePotentialMatches = async (interests: string[]) => {
    if (interests.length === 0) {
      setPotentialMatches(0);
      return;
    }

    const usersRef = collection(db, 'users');
    const currentUserId = auth.currentUser?.uid;

    // Ensure currentUserId is a string
    if (typeof currentUserId !== 'string') {
      throw new Error('currentUserId must be a string');
    }

    // Fetch the current user's interests from the database
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    const currentUserInterests = currentUserDoc.data()?.interests || [];

    // Query for users who are online and not matched
    const matchQuery = query(usersRef, 
      where('isOnline', '==', true),
      where('isMatched', '==', false)
    );

    const matchSnapshot = await getDocs(matchQuery);
    console.log('Total users found:', matchSnapshot.docs.length);

    const matchCount = matchSnapshot.docs.filter(doc => {
      if (doc.id === currentUserId) return false;
      const userInterests = doc.data().interests || [];
      const hasCommonInterest = currentUserInterests.some((interest: string) => userInterests.includes(interest));
      console.log('User:', doc.id, 'Interests:', userInterests, 'Has common interest:', hasCommonInterest);
      return hasCommonInterest;
    }).length;

    console.log('Potential matches:', matchCount);
    setPotentialMatches(matchCount);
  };

  const handleInterestToggle = (interest: string) => {
    console.log('Toggling interest:', interest);
    setSelectedInterests((prevInterests) => {
      let newInterests;
      if (prevInterests.includes(interest)) {
        newInterests = prevInterests.filter((i) => i !== interest);
      } else {
        if (prevInterests.length < 3) {
          newInterests = [...prevInterests, interest];
        } else {
          setErrorMessage("You can't pick more than 3 interests.");
          return prevInterests;
        }
      }

      setErrorMessage('');
      calculatePotentialMatches(newInterests);
      setInterestsChanged(true); // Set the change flag
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
    if (!interestsHaveChanged()) {
      return;
    }

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
        isMatched: false
      }, { merge: true });
      
      // Find matches after saving interests
      const matchedUsers = await findMatches(selectedInterests);
      setMatches(matchedUsers);

      toast.success("Interests saved successfully!");
      setInterestsChanged(false); // Reset the change flag after successful save
      setOriginalInterests([...selectedInterests]); // Update original interests
    } catch (error) {
      console.error("Error saving interests:", error);
      toast.error("Failed to save interests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const interestsHaveChanged = () => {
    if (selectedInterests.length !== originalInterests.length) return true;
    return !selectedInterests.every(interest => originalInterests.includes(interest)) || interestsChanged;
  };

  const canLookForMatch = () => {
    return selectedInterests.length === 3 && !interestsHaveChanged();
  };

  const getTopicStarter = async (interests: string[]) => {
    const topicStartersRef = collection(db, 'topicStarters');
    const q = query(
      topicStartersRef,
      where('interest', 'in', interests),
      where('used', '==', false),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      setTopicStarter(data.topic);

      // Mark this topic as used
      await updateDoc(doc.ref, { used: true });
    } else {
      // If all topics have been used, reset 'used' field for this interest
      const resetQuery = query(topicStartersRef, where('interest', 'in', interests));
      const resetSnapshot = await getDocs(resetQuery);
      resetSnapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { used: false });
      });

      // Try fetching a topic again
      await getTopicStarter(interests);
    }
  };

  const handleLookForMatch = async () => {
    if (!canLookForMatch()) return;

    try {
      // Existing matching logic here...

      // After finding a match, get a topic starter
      await getTopicStarter(selectedInterests);

      // You can now use the topicStarter state to display the conversation starter
    } catch (error) {
      console.error('Error looking for match:', error);
      toast.error('Failed to find a match. Please try again.');
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
            className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
              interestsHaveChanged() && !loading
                ? 'bg-white text-purple-600 hover:bg-gray-100'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            disabled={loading || !interestsHaveChanged()}
          >
            {loading ? 'Saving...' : 'Save Interests'}
          </button>
          {errorMessage && (
            <p className={`mt-2 text-sm ${saveMessage.includes('successfully') ? 'text-green-300' : 'text-yellow-300'}`}>
              {errorMessage}
            </p>
          )}
          
          {/* Modified "Look for Match" button */}
          <button
            onClick={handleLookForMatch}
            className={`mt-4 px-6 py-2 rounded-lg transition-colors font-semibold ${
              canLookForMatch()
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            disabled={!canLookForMatch()}
          >
            Look for Match
          </button>
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

        {topicStarter && (
          <div className="mt-4 p-4 bg-white text-purple-600 rounded-lg">
            <h3 className="font-bold mb-2">Conversation Starter:</h3>
            <p>{topicStarter}</p>
          </div>
        )}
      </main>
    </div>
  );
}