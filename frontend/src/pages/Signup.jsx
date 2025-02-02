import { Link } from "react-router-dom";


function Signup() {
	const googleAuth = () => {
		window.open(
			`${import.meta.env.VITE_BACKEND_URL}/auth/google/callback`,
			"_self"
		);
	};
	return (
		<div >
			<h1 >Sign up Form</h1>
			<div >
				<div >
					<img  alt="signup" />
				</div>
				<div >
					<h2 >Create Account</h2>
					<input type="text"  placeholder="Username" />
					<input type="text" placeholder="Email" />
					<input
						type="password"
						
						placeholder="Password"
					/>
					<button >Sign Up</button>
					<p >or</p>
					<button onClick={googleAuth}>
						<img  alt="google icon" />
						<span>Sing up with Google</span>
					</button>
					<p >
						Already Have Account ? <Link to="/login">Log In</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default Signup;