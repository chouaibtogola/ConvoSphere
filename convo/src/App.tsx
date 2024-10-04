import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import MatchFinder from './components/MatchFinder';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Fetch the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Set up the auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Clean up the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // Render the appropriate component based on the session state
  return session ? <MatchFinder /> : <Login />;
}

export default App;