import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { login } from "../redux/authSlice";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useGoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a preference stored
    const userPrefersDark = localStorage.getItem('darkMode');
    // If no preference set, default to dark mode
    if (userPrefersDark === null) {
      localStorage.setItem('darkMode', 'true');
      setDarkMode(true);
      // For dark mode, remove dark-theme class
      document.documentElement.classList.remove('dark-theme');
    } else {
      const isDarkMode = userPrefersDark === 'true';
      setDarkMode(isDarkMode);
      // Apply theme consistently with toggle function
      document.documentElement.classList.toggle('dark-theme', !isDarkMode);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.documentElement.classList.toggle('dark-theme', !newMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/auth/login", {
        username,
        password,
        rememberMe
      });

      const { user, token } = response.data;

      // Store token in localStorage or sessionStorage based on rememberMe
      if (rememberMe) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      // Dispatch login action to Redux store
      dispatch(login({ user, token }));

      // Redirect to Home Page after login
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        // Send user data to your backend
        const googleLoginResponse = await axios.post("http://localhost:5000/auth/google-login", {
          email: res.data.email,
          name: res.data.name,
          picture: res.data.picture,
        });

        const { user, token } = googleLoginResponse.data;
        localStorage.setItem("token", token);
        dispatch(login({ user, token }));
        navigate("/");
      } catch (err) {
        setError(err.response?.data?.message || "Google login failed");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google login failed");
      setIsLoading(false);
    },
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif" }}>
      {/* Background Pattern with enhanced animation */}
      <div className="absolute inset-0 bg-grid-pattern opacity-70">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>
      
      {/* Animated accent lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-red-500/10 to-transparent transform -skew-x-12 animate-pulse" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-red-500/10 to-transparent transform skew-x-12 animate-pulse delay-300" />
      </div>

      {/* Content container */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-md border-b border-red-900/20">
          {/* Border glow effect */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent blur-sm"></div>
          <div className="container mx-auto px-6 py-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between w-full"
            >
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold animate-gradient-text">
                  Aura AI
                </span>
              </div>
              
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-black/30 border border-red-900/30 hover:border-red-500/40 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-400" />
                )}
              </motion.button>
            </motion.div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="relative">
              {/* Floating Effect Shadow */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-900/20 rounded-2xl transform -translate-y-2"></div>
              
              {/* Form Container */}
              <div className="relative bg-black/70 border border-red-900/30 rounded-2xl p-8 shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(220,38,38,0.15)] hover:border-red-600/40 hover:scale-[1.01] hover:-translate-y-1">
                <h2 className="text-3xl font-bold text-center mb-8 animate-gradient-text">Welcome Back</h2>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
                  >
                    <p className="text-red-500 text-center text-sm">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        placeholder=" "
                        className="w-full bg-black/50 text-white placeholder-gray-400 border border-red-900/30 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:border-red-600/50 transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_10px_rgba(220,38,38,0.1)] peer"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                      <label 
                        htmlFor="username" 
                        className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-red-500"
                      >
                        Username
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder=" "
                        className="w-full bg-black/50 text-white placeholder-gray-400 border border-red-900/30 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:border-red-600/50 transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_10px_rgba(220,38,38,0.1)] peer"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <label 
                        htmlFor="password" 
                        className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-red-500"
                      >
                        Password
                      </label>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-red-500/70 hover:text-red-400 transition-colors focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border border-red-900/30 rounded-md peer-checked:border-red-500 peer-checked:bg-red-500 transition-all duration-200 group-hover:border-red-500/50">
                          <svg
                            className="absolute inset-0 w-full h-full text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-red-500 hover:text-red-400 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-red-600/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      <span>{isLoading ? "Logging in..." : "Login"}</span>
                    </div>
                  </motion.button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-red-900/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black text-gray-400">Or</span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <motion.button
                  onClick={() => handleGoogleLogin()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 rounded-lg font-medium transition-all duration-300 hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  )}
                  <span>Sign in with Google</span>
                </motion.button>

                <p className="text-center mt-6 text-gray-400">
                  Not yet registered?{" "}
                  <Link to="/register" className="text-red-600 hover:text-red-500 transition-all duration-300 hover:scale-105 inline-block hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                    Register now
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add floating accent elements */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 items-end">
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-2 h-2 bg-red-500/30 rounded-full float animate-gradient-text"
        />
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, -5, 5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="w-2 h-2 bg-red-500/20 rounded-full float animate-gradient-text"
        />
      </div>
    </div>
  );
};

export default LoginPage;
