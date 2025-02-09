import { useState , useEffect } from "react"
import axios from "axios"
import Login from "./pages/Login";
import Home from "./pages/Home";


import {Route , Routes , Navigate } from "react-router-dom"
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";

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
      {/* <Route
        exact
        path="/"
        element={user ? <Home user={user} /> : <Navigate to="/login" />}
      /> */}
      {/* <Route
        exact
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      /> */}
      {/* <Route
        path="/signup"
        element={user ? <Navigate to="/" /> : <Signup />}
      /> */}
       <Route
      exact 
      path="/dashboard"
      element={ user ?  <Dashboard /> : <LandingPage />}
      
      />
        <Route
        exact
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <LandingPage />}
      />
       {/* <Route
        exact
        path="/home"
        element={<Home />}
      /> */}
        {/* <Route
        path="/home"
        element={<LandingPage />}
      /> */}
    
    </Routes>
  </div>
  )
}

export default App
