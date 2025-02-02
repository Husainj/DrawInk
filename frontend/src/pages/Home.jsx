

function Home(userDetails) {
	const user = userDetails.user;
	const logout = () => {
		window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, "_self");
	};
	return (
		<div>
			<h1 >Home</h1>
			<div >
				<div >
					<img  alt="login" />
				</div>
				<div >
					<h2 >Profile</h2>
					<img
						src={user.picture}
						alt="profile"
						
					/>
					<input
						type="text"
						defaultValue={user.name}
					
						placeholder="UserName"
					/>
					<input
						type="text"
						defaultValue={user.email}
						placeholder="Email"
					/>
					<button  onClick={logout}>
						Log Out
					</button>
				</div>
			</div>
		</div>
	);
}

export default Home;