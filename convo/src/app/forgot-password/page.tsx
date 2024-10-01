'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { toast, Toaster } from 'react-hot-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Ensure your Firebase config is imported correctly
import { FirebaseError } from 'firebase/app'; // Import FirebaseError for typing

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      // Use Firebase to send password reset email
      await sendPasswordResetEmail(auth, email);
      setStatus('success');
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      setStatus('error');
      if (error instanceof FirebaseError) {
        const errorMsg = error.message || 'Failed to send password reset email. Please try again.';
        setErrorMessage(`Error: ${errorMsg}`);
        toast.error(errorMsg);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Forgot Password</h2>
        {status === 'idle' || status === 'sending' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={status === 'sending'}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              {status === 'sending' ? 'Sending...' : 'Reset Password'}
            </Button>
          </form>
        ) : status === 'success' ? (
          <p className="text-center text-green-600">Password reset email sent. Please check your inbox.</p>
        ) : (
          <div>
            <p className="text-center text-red-500 mb-4">{errorMessage}</p>
            <Button
              onClick={() => setStatus('idle')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Try Again
            </Button>
          </div>
        )}
        <div className="text-sm text-center mt-4">
          <button
            onClick={() => router.push('/')}
            className="text-purple-600 hover:text-purple-500"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
      <Toaster position="top-center" />
    </div>
  );
}
