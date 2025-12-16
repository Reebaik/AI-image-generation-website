import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Sparkles, Moon, Sun, ArrowLeft, Eye, EyeOff } from "lucide-react";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();
  const { token } = useParams();
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
    
    // Enhanced password validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
    
    // Validate passwords with more detailed error messages
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    // Recommend stronger password but don't block submission if basic requirements are met
    if (newPassword.length < 8 || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      if (window.confirm("Your password could be stronger. We recommend including uppercase letters, numbers, and special characters. Do you want to continue with this password?")) {
        // Continue with current password
      } else {
        return; // User chose to create a stronger password
      }
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/auth/reset-password/${token}`, {
        newPassword
      });

      setSuccess(response.data.message || "Password reset successful!");
      
      // Clear form inputs
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password");
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
                
                <h2 className="text-3xl font-bold text-center mb-8 animate-gradient-text">Reset Password</h2>

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
                  {/* New Password Input */}
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        placeholder=" "
                        className="w-full bg-black/50 text-white placeholder-gray-400 border border-red-900/30 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:border-red-600/50 transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_10px_rgba(220,38,38,0.1)] peer"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <label 
                        htmlFor="newPassword" 
                        className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-red-500"
                      >
                        New Password
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
                  
                  {/* Password Strength Indicator */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Password strength:</div>
                    <div className="flex gap-1 h-1">
                      <div className={`flex-1 rounded-full transition-colors ${
                        newPassword.length > 0 ? 'bg-red-500/70' : 'bg-gray-700'
                      }`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${
                        newPassword.length >= 6 ? 'bg-red-500/70' : 'bg-gray-700'
                      }`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${
                        newPassword.length >= 8 && /[A-Z]/.test(newPassword) ? 'bg-red-500/70' : 'bg-gray-700'
                      }`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${
                        newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 'bg-red-500/70' : 'bg-gray-700'
                      }`}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                      <span className={newPassword.length >= 6 ? 'text-green-500' : ''}>
                        At least 6 characters
                      </span>
                      <span className={/[A-Z]/.test(newPassword) ? 'text-green-500' : ''}>
                        Uppercase letter
                      </span>
                      <span className={/[0-9]/.test(newPassword) ? 'text-green-500' : ''}>
                        Number
                      </span>
                      <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-500' : ''}>
                        Special character
                      </span>
                    </div>
                  </div>
                  
                  {/* Confirm Password Input */}
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        placeholder=" "
                        className="w-full bg-black/50 text-white placeholder-gray-400 border border-red-900/30 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:border-red-600/50 transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_10px_rgba(220,38,38,0.1)] peer"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    
                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <div className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                        {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </div>
                    )}
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
                      "Reset Password"
                    )}
                  </motion.button>
                </form>
                
                <div className="text-center mt-6">
                  <p className="text-gray-400 text-sm">
                    Create a strong password that's at least 6 characters long.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 