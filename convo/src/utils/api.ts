import axios from 'axios';

export const register = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:5000/api/register', {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error('An error occurred during registration');
  }
};