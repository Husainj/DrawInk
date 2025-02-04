import { Link } from "react-router-dom";


function Login() {
	const googleAuth = () => {
		window.open(
			`${import.meta.env.VITE_BACKEND_URL}/auth/google`,
			"_self"
		);
	};
	return (
		<div >
			<h1 >Log in Form</h1>
			<div >
				<div >
					<img alt="login" />
				</div>
				<div >
					<h2 >Members Log in</h2>
					<input type="text" placeholder="Email" />
					<input type="text" placeholder="Password" />
					<button >Log In</button>
					<p>or</p>
					<button  onClick={googleAuth}>
						<img alt="google icon" />
						<span>Sing in with Google</span>
					</button>
					<p >
						New Here ? <Link to="/signup">Sing Up</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default Login;