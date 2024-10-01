'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { API_BASE_URL } from '@/config/api'
import { toast, Toaster } from 'react-hot-toast'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    setStatus('submitting')
    const token = searchParams.get('token')

    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { token, password })
      setStatus('success')
      toast.success('Password reset successful!')
    } catch (error) {
      console.error('Password reset error:', error)
      setStatus('error')
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Failed to reset password. Please try again.')
      } else {
        toast.error('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <div className="p-8 bg-gray-800 shadow-md rounded-lg max-w-md w-full">
      <h1 className="text-2xl font-bold mb-4 text-center">Reset Password</h1>
      {status === 'idle' || status === 'submitting' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block mb-1">New Password</label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-700 text-white"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1">Confirm New Password</label>
            <Input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-gray-700 text-white"
            />
          </div>
          <Button type="submit" disabled={status === 'submitting'} className="w-full bg-blue-600 hover:bg-blue-700">
            {status === 'submitting' ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      ) : status === 'success' ? (
        <>
          <p className="text-center mb-4">Your password has been reset successfully.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </>
      ) : (
        <p className="text-center">There was an error resetting your password. Please try again or request a new reset link.</p>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <ResetPasswordForm />
        <Toaster position="top-center" />
      </div>
    </Suspense>
  )
}
