import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useGoogleLogin } from '@react-oauth/google';

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    number: false,
    special: false,
    capital: false,
    match: false
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

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

  const validatePassword = (pass, confirmPass) => {
    const requirements = {
      length: pass.length >= 8,
      number: /\d/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      capital: /[A-Z]/.test(pass),
      match: pass === confirmPass && pass !== ""
    };
    
    // Calculate password strength (0-4)
    const strength = Object.values(requirements).filter(Boolean).length - (requirements.match ? 1 : 0);
    setPasswordStrength(strength);
    
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    if (!validatePassword(password, confirmPassword)) {
      setError("Please meet all password requirements");
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${backendUrl}/auth/register`, {
        username,
        email,
        password,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        // Send user data to your backend
        await axios.post(`${backendUrl}/auth/google-register`, {
          email: res.data.email,
          name: res.data.name,
          picture: res.data.picture,
        });

        setSuccess(true);
        setTimeout(() => navigate("/login"), 1500);
      } catch (err) {
        setError(err.response?.data?.message || "Google registration failed");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google registration failed");
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
                <h2 className="text-3xl font-bold text-center mb-8 animate-gradient-text">Create Account</h2>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
                  >
                    <p className="text-red-500 text-center text-sm">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6"
                  >
                    <p className="text-green-500 text-center text-sm">
                      Registration successful! Redirecting to login...
                    </p>
                  </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
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
                        type="email"
                        id="email"
                        placeholder=" "
                        className="w-full bg-black/50 text-white placeholder-gray-400 border border-red-900/30 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:border-red-600/50 transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_10px_rgba(220,38,38,0.1)] peer"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <label 
                        htmlFor="email" 
                        className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-red-500"
                      >
                        Email
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
                        onChange={(e) => {
                          setPassword(e.target.value);
                          validatePassword(e.target.value, confirmPassword);
                        }}
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

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1 h-1.5">
                        <div className={`flex-1 rounded-l-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-700'}`}></div>
                        <div className={`flex-1 ${passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
                        <div className={`flex-1 ${passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                        <div className={`flex-1 rounded-r-full ${passwordStrength >= 4 ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                      </div>
                      <p className="text-xs text-right">
                        {passwordStrength === 0 && "Very weak"}
                        {passwordStrength === 1 && "Weak"}
                        {passwordStrength === 2 && "Medium"}
                        {passwordStrength === 3 && "Strong"}
                        {passwordStrength === 4 && "Very strong"}
                      </p>
                    </div>
                  )}

                  {/* Password Requirements */}
                  <div className="space-y-1 text-sm">
                    <p className={`flex items-center gap-1 ${passwordRequirements.length ? 'text-green-500' : 'text-gray-400'}`}>
                      <span>{passwordRequirements.length ? '✓' : '○'}</span>
                      At least 8 characters
                    </p>
                    <p className={`flex items-center gap-1 ${passwordRequirements.number ? 'text-green-500' : 'text-gray-400'}`}>
                      <span>{passwordRequirements.number ? '✓' : '○'}</span>
                      Contains a number
                    </p>
                    <p className={`flex items-center gap-1 ${passwordRequirements.special ? 'text-green-500' : 'text-gray-400'}`}>
                      <span>{passwordRequirements.special ? '✓' : '○'}</span>
                      Contains a special character
                    </p>
                    <p className={`flex items-center gap-1 ${passwordRequirements.capital ? 'text-green-500' : 'text-gray-400'}`}>
                      <span>{passwordRequirements.capital ? '✓' : '○'}</span>
                      Contains a capital letter
                    </p>
                  </div>

                  <div className="space-y-2 relative">
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        placeholder=" "
                        className="w-full bg-black/50 text-white placeholder-gray-400 border border-red-900/30 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:border-red-600/50 transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_10px_rgba(220,38,38,0.1)] peer"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          validatePassword(password, e.target.value);
                        }}
                        required
                      />
                      <label 
                        htmlFor="confirmPassword" 
                        className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-red-500"
                      >
                        Confirm Password
                      </label>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-red-500/70 hover:text-red-400 transition-colors focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <p className={`flex items-center gap-1 text-sm ${passwordRequirements.match ? 'text-green-500' : 'text-red-500'}`}>
                      <span>{passwordRequirements.match ? '✓' : '×'}</span>
                      {passwordRequirements.match ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}

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
                      <span>{isLoading ? "Registering..." : "Register"}</span>
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

                {/* Google Sign Up Button */}
                <motion.button
                  onClick={() => handleGoogleRegister()}
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
                  <span>Sign up with Google</span>
                </motion.button>

                <p className="text-center mt-6 text-gray-400">
                  Already registered?{" "}
                  <Link to="/login" className="text-red-600 hover:text-red-500 transition-all duration-300 hover:scale-105 inline-block hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                    Login now
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

export default RegisterPage;
