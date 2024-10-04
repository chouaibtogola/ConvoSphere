import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Match {
  id: string;
  name: string;
  // Add other properties as needed
}

const MatchFinder = () => {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*');
      if (error) throw error;
      if (data) setMatches(data as Match[]);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching matches:', error.message);
      } else {
        console.error('An unknown error occurred while fetching matches');
      }
    }
  };

  return (
    <div>
      <h2>Matches</h2>
      <ul>
        {matches.map((match) => (
          <li key={match.id}>{match.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default MatchFinder;