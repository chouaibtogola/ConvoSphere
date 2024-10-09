'use client'
import Link from 'next/link'; 

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { MountainIcon } from 'lucide-react'
import { addUserToFirestore } from '@/api/auth'
import axios from 'axios'
import { register } from '@/lib/api' // Updated import path

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      await register(email, email, password) // Using email as username for now
      router.push('/login')
    } catch (error) {
      console.error('Registration error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 opacity-50" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
      
      <header className="px-4 lg:px-6 h-14 flex items-center relative z-10">
        <Link className="flex items-center justify-center" href="/">
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">Acme Inc</span>
        </Link>
      </header>

      <main className="flex-1 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                placeholder="m@example.com" 
                required 
                type="email" 
                value={email} // Bind value to state
                onChange={(e) => setEmail(e.target.value)} // Update state on change
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                required 
                type="password" 
                value={password} // Bind value to state
                onChange={(e) => setPassword(e.target.value)} // Update state on change
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password" 
                required 
                type="password" 
                value={confirmPassword} // Bind value to state
                onChange={(e) => setConfirmPassword(e.target.value)} // Update state on change
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </form>
          <p className="mt-4 text-center">
            Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-800">
        <p className="text-xs text-gray-400">© 2024 Acme Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
