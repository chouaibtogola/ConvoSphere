'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setMounted(true)
      console.log('Component mounted successfully')
    } catch (err) {
      console.error('Error in useEffect:', err)
      setError('An error occurred while loading the page')
    }
  }, [])

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex flex-col justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Welcome to Convo
        </h1>
        <p className="text-xl md:text-2xl text-white mb-8">
          Connect, chat, and collaborate with ease.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-x-4"
      >
        <Link href="/login" className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300">
          Login
        </Link>
        <Link href="/register" className="bg-purple-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300">
          Register
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 text-white text-center"
      >
        <h2 className="text-2xl font-semibold mb-4">Why Choose Convo?</h2>
        <ul className="space-y-2">
          <li>✨ Intuitive and user-friendly interface</li>
          <li>🔒 Secure end-to-end encryption</li>
          <li>🌐 Connect with people worldwide</li>
          <li>📱 Available on all devices</li>
        </ul>
      </motion.div>
    </div>
  )
}