import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        console.log('Attempting to register');
        await register(username, email, password);
        console.log('Registration completed');
        setError('Registration successful. Please log in.');
        setIsRegistering(false);
      } else {
        console.log('Attempting to login');
        await login(email, password);
        console.log('Login completed');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Error: ${errorMessage}`);
      if (error instanceof Error && 'response' in error) {
        console.error('Error response:', (error as any).response?.data);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required={isRegistering}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? 'Switch to Login' : 'Switch to Register'}
      </button>
    </form>
  );
};

export default Login;