'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const interests = [
  'Cars', 'Tech', 'Animals', 'Cooking', 'Sports',
  'Travel', 'Art', 'Books', 'Movies', 'Games',
];

export default function InterestsPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = () => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest');
    } else {
      // TODO: Send selected interests to the server or update user profile
      toast.success('Interests saved successfully!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-600 text-white">
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
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
        >
          Save Interests
        </button>
      </main>
    </div>
  );
}