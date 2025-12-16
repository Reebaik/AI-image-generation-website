import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Sparkles, Moon, Sun, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/auth/forgot-password`, {
        email
      });

      setSuccess(response.data.message || "Password reset link has been sent to your email");
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

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
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-red-500 hover:text-red-400 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
                
                <h2 className="text-3xl font-bold text-center mb-8 animate-gradient-text">Forgot Password</h2>

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
                    <p className="text-green-500 text-center text-sm">{success}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                  
                  <motion.button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-all duration-300 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </motion.button>
                </form>
                
                <div className="text-center mt-6">
                  <p className="text-gray-400 text-sm">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>
                
                {/* Additional information for users */}
                <div className="mt-8 p-4 bg-black/40 rounded-lg border border-red-900/20">
                  <h3 className="text-red-500 text-sm font-semibold mb-3">Important Information:</h3>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li className="flex items-start">
                      <span className="inline-block w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center mr-2 mt-0.5">✓</span>
                      The reset link will be sent to your registered email address
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center mr-2 mt-0.5">✓</span>
                      The link will expire after 5 minutes for security reasons
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center mr-2 mt-0.5">✓</span>
                      Check your spam folder if you don't see the email in your inbox
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 