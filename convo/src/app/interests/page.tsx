'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, onSnapshot, limit, updateDoc, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ToastOptions } from 'react-toastify';
import { FirebaseError } from 'firebase/app';

// Add this type extension before your component
interface CustomToastOptions extends ToastOptions {
  toastId?: string;
}

interface User {
  // ... existing properties ...
  matchedWith?: string | null;
}

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
  const [topicStarter, setTopicStarter] = useState('');
  const [interestsChanged, setInterestsChanged] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchCancelledRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Set up a real-time listener for the user document
        const userUnsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            const userInterests = userData.interests || [];
            console.log('Fetched interests:', userInterests); // Add this log
            setSelectedInterests(userInterests);
            setOriginalInterests(userInterests);
            calculatePotentialMatches(userInterests);
            setInterestsChanged(false);
          }
          setLoading(false);
        });

        return () => userUnsubscribe();
      } else {
        setLoading(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // useEffect for potential matches calculation
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      calculatePotentialMatches(selectedInterests);
    });

    return () => unsubscribe();
  }, [selectedInterests]);

  // useEffect for search cancellation on unmount
  useEffect(() => {
    return () => {
      if (isSearching) {
        console.log("Component unmounting, search in progress");
        // We're not cancelling the search here
      }
    };
  }, [isSearching]);

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
      const dataToUpdate = { 
        interests: selectedInterests.slice(0, 3),
        isMatched: false,
        isLookingForMatch: false
      };

      console.log('Updating user document with:', dataToUpdate);

      await setDoc(userDocRef, dataToUpdate, { merge: true });
      
      console.log('User document updated successfully');

      toast.success("Interests saved successfully!");
      setInterestsChanged(false);
      setOriginalInterests([...selectedInterests]);
    } catch (error) {
      console.error("Error saving interests:", error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      toast.error(`Failed to save interests: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      await updateDoc(doc.ref, { 
        used: true,
        topic: data.topic,
        interest: data.interest
      });
    } else {
      // If all topics have been used, reset 'used' field for this interest
      const resetQuery = query(topicStartersRef, where('interest', 'in', interests));
      const resetSnapshot = await getDocs(resetQuery);
      resetSnapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { 
          used: false,
          topic: doc.data().topic,
          interest: doc.data().interest
        });
      });

      // Try fetching a topic again
      await getTopicStarter(interests);
    }
  };

  const cancelSearch = async () => {
    searchCancelledRef.current = true;
    setIsSearching(false);
    toast("Match search cancelled.");

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 
        isLookingForMatch: false,
        isMatched: false
      });
    }
  };

  const handleLookForMatch = async () => {
    if (!canLookForMatch()) return;

    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to look for a match.");
      router.push('/login');
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Add user to waiting room
      await updateDoc(userDocRef, {
        isLookingForMatch: true,
        lastMatchAttempt: new Date(),
        isMatched: false,
        isOnline: true,
        interests: selectedInterests
      });

      // Look for a match in the waiting room
      const matchResult = await findMatchInWaitingRoom(user.uid, selectedInterests);

      if (matchResult) {
        // Match found
        const chatRoomRef = await createChatRoom(user.uid, matchResult.id);
        await updateMatchedUsers(user.uid, matchResult.id, chatRoomRef.id);
        await getTopicStarter(selectedInterests);
        toast.success("Match found! Redirecting to chat...");
        router.push(`/chat/${chatRoomRef.id}`);
      } else {
        // No match found
        toast("You've been added to the waiting room. We'll notify you when a match is found.");
      }
    } catch (error) {
      console.error('Error in matching process:', error);
      toast.error('An error occurred during the matching process. Please try again.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const findMatchInWaitingRoom = async (userId: string, userInterests: string[]) => {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('isLookingForMatch', '==', true),
      where('isMatched', '==', false),
      where('isOnline', '==', true)
    );

    const querySnapshot = await getDocs(q);
    for (const doc of querySnapshot.docs) {
      if (doc.id !== userId) {
        const potentialMatch = doc.data();
        const commonInterests = userInterests.filter(interest => 
          potentialMatch.interests.includes(interest)
        );
        if (commonInterests.length > 0) {
          return { id: doc.id, ...potentialMatch };
        }
      }
    }
    return null;
  };

  const createChatRoom = async (user1Id: string, user2Id: string) => {
    return await addDoc(collection(db, 'chatRooms'), {
      participants: [user1Id, user2Id],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
  };

  const updateMatchedUsers = async (user1Id: string, user2Id: string, chatRoomId: string) => {
    const user1Ref = doc(db, 'users', user1Id);
    const user2Ref = doc(db, 'users', user2Id);

    await updateDoc(user1Ref, {
      isMatched: true,
      matchedWith: user2Id,
      isLookingForMatch: false,
      currentChatRoom: chatRoomId
    });

    await updateDoc(user2Ref, {
      isMatched: true,
      matchedWith: user1Id,
      isLookingForMatch: false,
      currentChatRoom: chatRoomId
    });
  };

  if (loading && !auth.currentUser) {
    return <div>Loading...</div>;
  }

  console.log('Current selected interests:', selectedInterests); // Add this log

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
          
          <div className="flex flex-col items-center">
            {!isSearching ? (
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
            ) : (
              <div className="flex flex-col items-center">
                <p className="mb-2">Searching for a match...</p>
                <button
                  onClick={cancelSearch}
                  className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Cancel Search
                </button>
              </div>
            )}
          </div>
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