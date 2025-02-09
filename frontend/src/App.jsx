import { useState , useEffect } from "react"
import axios from "axios"
import {Route , Routes , Navigate } from "react-router-dom"
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import { useDispatch } from 'react-redux';
import {setUserInfo} from "./redux/slices/authSlice"
function App() {
  const [user , setUser] = useState(null);
 
  const dispatch = useDispatch();
	const getUser = async () => {
		try {
			const url = `${import.meta.env.VITE_BACKEND_URL}/auth/login/success`;
			const { data } = await axios.get(url, { withCredentials: true });
      const { id , name, email, avatar } = data.user;
      console.log("User Data in the frontend " , data.user)
      dispatch(setUserInfo({ id , name , email , avatar  }));
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
