import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password })
  const { user, token } = response.data
  localStorage.setItem('token', token)
  return user
}

export const register = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/register`, { email, password })
  const { user, token } = response.data
  localStorage.setItem('token', token)
  return user
}

// Add other API calls here