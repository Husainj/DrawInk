import { motion } from "framer-motion";
import { FaPaintBrush, FaPenFancy, FaEraser, FaRuler, FaStickyNote, FaPencilAlt } from "react-icons/fa";

const LandingPage = () => {
    const googleAuth = () => {
		window.open(
			`${import.meta.env.VITE_BACKEND_URL}/auth/google`,
			"_self"
		);
	};
  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-100 to-white text-center px-4 overflow-hidden">
      {/* Blurred Grid Background */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-2 backdrop-blur-lg" style={{ backgroundImage: "linear-gradient(rgba(200,200,200,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,200,0.2) 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
      
      {/* 3D Objects in Background */}
      <motion.div
        className="absolute top-10 left-10 text-blue-500 text-6xl rotate-12 drop-shadow-lg"
        animate={{ y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <FaPaintBrush />
      </motion.div>
      <motion.div
        className="absolute top-20 right-20 text-yellow-500 text-5xl rotate-45 drop-shadow-lg"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        <FaPenFancy />
      </motion.div>
      <motion.div
        className="absolute bottom-10 left-40 text-red-500 text-5xl rotate-6 drop-shadow-lg"
        animate={{ y: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
      >
        <FaEraser />
      </motion.div>
      <motion.div
        className="absolute top-32 left-1/3 text-green-500 text-5xl rotate-12 drop-shadow-lg"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        <FaRuler />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-32 text-purple-500 text-5xl rotate-6 drop-shadow-lg"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <FaStickyNote />
      </motion.div>
      <motion.div
        className="absolute top-48 right-100 text-orange-500 text-5xl rotate-3 drop-shadow-lg"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
      >
        <FaPencilAlt />
      </motion.div>
      
      {/* Placeholder for Logo */}
      <div className="w-16 h-16 bg-gray-300 rounded-lg animate-pulse mb-4 shadow-md"></div>
      
      {/* Title */}
      <h1 className="text-5xl font-extrabold text-gray-900 drop-shadow-xl">DrawInk</h1>
      
      {/* Subtitle */}
      <p className="text-gray-600 mt-2 text-lg z-10">Bring your ideas to life with real-time collaboration</p>
      
      {/* Sign in Button */}
      <button  onClick={googleAuth} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium shadow-lg hover:bg-blue-700 transition transform hover:scale-105">
        Sign in with Google
      </button>
      
      {/* Description */}
      <p className="text-gray-500 mt-2">Start brainstorming, sketching, and planning together</p>
      
      {/* Footer */}
      <footer className="absolute bottom-4 text-gray-400 text-sm">© 2025 Collaborative Whiteboard. All rights reserved.</footer>
    </div>
  );
};

export default LandingPage;
