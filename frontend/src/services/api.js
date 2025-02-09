import axios from 'axios';


const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1`, // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Ensure cookies are sent with requests
});


export default api;