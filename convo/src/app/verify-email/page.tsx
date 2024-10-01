'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { API_BASE_URL } from '@/config/api'
import { toast, Toaster } from 'react-hot-toast'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setStatus('error')
        toast.error('Invalid verification token')
        return
      }

      try {
        await axios.get(`${API_BASE_URL}/auth/verify-email?token=${token}`)
        setStatus('success')
        toast.success('Email verified successfully!')
      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data.message || 'Email verification failed. Please try again.')
        } else {
          toast.error('An unexpected error occurred. Please try again.')
        }
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="p-8 bg-gray-800 shadow-md rounded-lg max-w-md w-full">
      {status === 'verifying' && <p className="text-center">Verifying your email...</p>}
      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-center">Email Verified Successfully!</h1>
          <p className="text-center mb-4">Your email has been verified. You can now log in to your account.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-center">Verification Failed</h1>
          <p className="text-center mb-4">There was an error verifying your email. Please try again or contact support.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <VerifyEmailContent />
        <Toaster position="top-center" />
      </div>
    </Suspense>
  )
}
