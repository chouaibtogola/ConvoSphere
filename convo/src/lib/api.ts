import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password })
  const { user, token } = response.data
  localStorage.setItem('token', token)
  return user
}

export const register = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'An error occurred during registration');
    }
    throw error;
  }
}

// Add other API calls here