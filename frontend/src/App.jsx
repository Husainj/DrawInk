import { useState , useEffect } from "react"
import axios from "axios"
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/SignUp";

import {Route , Routes , Navigate } from "react-router-dom"

function App() {
  const [user , setUser] = useState(null);

  
	const getUser = async () => {
		try {
			const url = `${import.meta.env.VITE_BACKEND_URL}/auth/login/success`;
			const { data } = await axios.get(url, { withCredentials: true });

console.log("User Data in the frontend " , data.user)

			setUser(data.user);
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		getUser();
	}, []);


  return (
    <div className="container">
    <Routes>
      <Route
        exact
        path="/"
        element={user ? <Home user={user} /> : <Navigate to="/login" />}
      />
      <Route
        exact
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" /> : <Signup />}
      />
    </Routes>
  </div>
  )
}

export default App
