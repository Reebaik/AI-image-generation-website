import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Search, Github, Twitter, Instagram, Linkedin, LogIn, Sparkles, LogOut, User, ChevronDown, Image, Moon, Sun, Heart, Bug, Send, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../redux/authSlice";
import axios from "axios";
import { checkSubscriptionStatus } from "../services/subscriptionService";
import SubscriptionPromptModal from "../components/SubscriptionPromptModal";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const dispatch = useDispatch();
  const [loadedImages, setLoadedImages] = useState({});
  const [popularImages, setPopularImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const subscription = useSelector((state) => state.subscription.subscription);
  
  // Bug report state
  const [bugReport, setBugReport] = useState({
    title: "",
    description: ""
  });
  const [submitStatus, setSubmitStatus] = useState({
    isSubmitted: false,
    success: false,
    message: ""
  });

  // Fetch popular images
  useEffect(() => {
    const fetchPopularImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/images/popular");
        setPopularImages(response.data.images);
      } catch (err) {
        console.error("Error fetching popular images:", err);
        setError("Failed to load popular images");
      } finally {
        setLoading(false);
      }
    };

    fetchPopularImages();
  }, []);

  // Filter images based on search query
  const filteredImages = popularImages.filter(image => {
    const searchLower = searchQuery.toLowerCase();
    return (
      image.prompt.toLowerCase().includes(searchLower) ||
      image.creator.toLowerCase().includes(searchLower)
    );
  });

  // Check for dark mode preference on component mount
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

  // Add scroll progress handler
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.pageYOffset / totalScroll) * 100;
      setScrollProgress(currentProgress);
      setShowBackToTop(window.pageYOffset > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    dispatch(logout());
    alert("You have been logged out!");
    location.reload();
  };

  // Mock images (Replace with actual API data)
  const images = [
    { id: 1, url: "https://source.unsplash.com/random/800x600?ai", creator: "AuraAI", prompt: "Cyberpunk city at night" },
    { id: 2, url: "https://source.unsplash.com/random/800x600?future", creator: "PixelMaster", prompt: "Floating islands in the sky" },
    { id: 3, url: "https://source.unsplash.com/random/800x600?scifi", creator: "DreamWeaver", prompt: "Alien landscape with three moons" },
    { id: 4, url: "https://source.unsplash.com/random/800x600?fantasy", creator: "NeuralArtist", prompt: "Magical forest with glowing trees" },
    { id: 5, url: "https://source.unsplash.com/random/800x600?cyberpunk", creator: "DigitalDreamer", prompt: "Neon-lit streets" },
    { id: 6, url: "https://source.unsplash.com/random/800x600?space", creator: "CosmicArtist", prompt: "Deep space nebula" },
  ];

  // Add floating particles effect
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-red-500/20 rounded-full';
      const size = Math.random() * 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animation = `float-up ${Math.random() * 3 + 2}s linear forwards`;
      document.getElementById('particles-container').appendChild(particle);
      setTimeout(() => particle.remove(), 5000);
    };

    const interval = setInterval(createParticle, 200);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => ({ ...prev, [imageId]: true }));
  };

  // Handle bug report submit
  const handleSubmitBugReport = async (e) => {
    e.preventDefault();
    try {
      const report = {
        subject: bugReport.title,
        description: bugReport.description
      };
      
      // Get token from localStorage for authentication
      const token = localStorage.getItem("token");
      
      if (!token) {
        setSubmitStatus({
          isSubmitted: true,
          success: false,
          message: "You must be logged in to submit a bug report."
        });
        return;
      }
      
      // Send the bug report to the backend with the correct Authorization header format
      const response = await axios.post(
        "http://localhost:5000/auth/report-bug", 
        report,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      
      console.log("Bug report submitted successfully:", response.data);
      
      // Show success message in the modal
      setSubmitStatus({
        isSubmitted: true,
        success: true,
        message: "Bug report submitted successfully!"
      });
      
      setBugReport({ title: "", description: "" });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowBugReportModal(false);
        setTimeout(() => {
          setSubmitStatus({
            isSubmitted: false,
            success: false,
            message: ""
          });
        }, 300);
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting bug report:", error);
      
      let errorMessage = "Failed to submit bug report. Please try again.";
      
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        errorMessage = error.response.data.error || errorMessage;
        
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = "Authentication error. Please log in again.";
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "Server did not respond. Please ensure the backend is running.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSubmitStatus({
        isSubmitted: true,
        success: false,
        message: errorMessage
      });
    }
  };

  const handleStartCreating = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      // Check subscription status with the server
      const subscriptionStatus = await checkSubscriptionStatus();
      
      if (!subscriptionStatus || 
          subscriptionStatus.status !== 'active' || 
          subscriptionStatus.generationsLeft <= 0 ||
          new Date(subscriptionStatus.expiresAt) < new Date()) {
        setShowSubscriptionModal(true);
        return;
      }

      // If we have a valid subscription, navigate to create page
      navigate('/generate');
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setShowSubscriptionModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif" }}>
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-red-900/20 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-red-500 to-red-700"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Particles Container */}
      <div id="particles-container" className="absolute inset-0 pointer-events-none overflow-hidden" />
      
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
            <div className="flex items-center justify-between">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold animate-gradient-text">
                  Aura AI
                </span>
              </motion.div>

              {/* Search Bar - Removed */}
              {/* 
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-xl ml-40 mr-8"
              >
                <div className="relative w-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-900/20 rounded-xl blur-xl transform -translate-y-2"></div>
                  
                  <div className="relative flex items-center bg-black/70 rounded-xl border border-red-900/30 p-1.5 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:scale-[1.02]">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for AI-generated artwork..."
                      className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-500 px-3 py-2 text-base"
                    />
                    <button 
                      onClick={() => {
                        console.log("Searching for:", searchQuery);
                      }}
                      className="p-2 text-red-600 hover:text-red-500 transition-colors flex-shrink-0 hover:scale-110 transform duration-200"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
              */}

              <div className="flex items-center space-x-6">
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
                
                {isAuthenticated ? (
                  <>
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>{user?.username || 'Menu'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                      </motion.button>

                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-zinc-900/80 backdrop-blur-md border border-red-900/20 rounded-lg shadow-lg overflow-hidden"
                          >
                            <div className="bg-black/40 p-1.5 space-y-1">
                              <motion.button
                                whileHover={{ 
                                  backgroundColor: "rgba(220, 38, 38, 0.2)",
                                  scale: 1.05,
                                  transition: { duration: 0.1 }
                                }}
                                onClick={() => {
                                  navigate("/gallery");
                                  setIsMenuOpen(false);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:text-red-400 transition-all duration-150 rounded"
                              >
                                <Image className="w-4 h-4" />
                                <span>Gallery</span>
                              </motion.button>
                              
                              {isAdmin ? (
                                <motion.button
                                  whileHover={{ 
                                    backgroundColor: "rgba(220, 38, 38, 0.2)",
                                    scale: 1.05,
                                    transition: { duration: 0.1 }
                                  }}
                                  onClick={() => {
                                    navigate("/admin");
                                    setIsMenuOpen(false);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:text-red-400 transition-all duration-150 rounded"
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                  <span>Dashboard</span>
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileHover={{ 
                                    backgroundColor: "rgba(220, 38, 38, 0.2)",
                                    scale: 1.05,
                                    transition: { duration: 0.1 }
                                  }}
                                  onClick={() => {
                                    setShowBugReportModal(true);
                                    setIsMenuOpen(false);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:text-red-400 transition-all duration-150 rounded"
                                >
                                  <Bug className="w-4 h-4" />
                                  <span>Report Bug</span>
                                </motion.button>
                              )}
                              
                              <motion.button
                                whileHover={{ 
                                  backgroundColor: "rgba(220, 38, 38, 0.2)",
                                  scale: 1.05,
                                  transition: { duration: 0.1 }
                                }}
                                onClick={() => {
                                  handleLogout();
                                  setIsMenuOpen(false);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:text-red-400 transition-all duration-150 rounded"
                              >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartCreating}
                      className="group relative flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-red-600/50 overflow-hidden"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Create</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/login")}
                    className="group relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-red-600/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-900/20 transform group-hover:translate-y-1"></div>
                    <LogIn className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    <span>Get Started</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Hero Section */}
        <div className="min-h-[50vh] pt-24 pb-8 px-6 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-3xl mx-auto text-center relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold mb-5 tracking-tight relative"
            >
              <span className="relative inline-block animate-gradient-text">
                Create 
              </span>{" "}
              <span className="relative inline-block animate-gradient-text">
                Stunning 
              </span>{" "}
              <span className="relative inline-block animate-gradient-text">
                AI Art
              </span>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-6 -right-6 w-12 h-12 text-3xl float"
              >
                ✨
              </motion.div>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-gray-400 mb-6 font-light max-w-2xl mx-auto leading-relaxed px-8 py-5 rounded-2xl glass hover-card backdrop-blur-sm relative overflow-hidden group"
              >
                Transform your imagination into breathtaking visuals with our AI-powered image generator.
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="container mx-auto px-6 py-8 border-t border-red-900/20 relative">
          {/* Add animated accent for section transition */}
          <div className="absolute top-0 left-0 right-0 h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse"></div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center mb-8 animate-gradient-text"
          >
            Unleash Your Creative Potential
          </motion.h2>
          
          {/* Enhanced feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "✨",
                title: "AI-Powered Generation",
                description: "Create unique artwork using state-of-the-art AI models",
                gradient: "from-red-500/20 via-purple-500/20 to-red-500/20"
              },
              {
                icon: "🎨",
                title: "Custom Styles",
                description: "Choose from various artistic styles and customize to your liking",
                gradient: "from-red-500/20 via-blue-500/20 to-red-500/20"
              },
              {
                icon: "💾",
                title: "Save & Share",
                description: "Save your creations and share them with the community",
                gradient: "from-red-500/20 via-orange-500/20 to-red-500/20"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-r ${feature.gradient} rounded-xl p-8 relative overflow-hidden group transform transition-all duration-300 hover:shadow-xl hover:shadow-red-600/20`}
              >
                <div className="absolute inset-0 bg-grid-pattern opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <motion.div 
                    className="text-4xl mb-4 relative z-20"
                    animate={{ 
                      y: [0, -4, 0],
                      rotate: [-1, 1, -1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ opacity: 1 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 text-white animate-gradient-text">{feature.title}</h3>
                  <p className="text-gray-400 text-base">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Image Grid */}
        <div className="container mx-auto px-6 pb-20">
          {/* Scrollable Box Container - made larger */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/40 border border-red-900/30 rounded-xl p-6 backdrop-blur-sm shadow-xl hover:shadow-red-600/10 transition-shadow duration-300 max-h-[1200px] overflow-hidden flex flex-col"
          >
            {/* Box Title with border bottom and search bar */}
            <div className="mb-4 pb-3 border-b border-red-900/30">
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-2xl font-semibold animate-gradient-text">Popular Creations</h3>
                
                {/* Search Bar - centered */}
                <div className="w-full max-w-xl relative">
                  {/* Floating Effect Shadow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-900/20 rounded-xl blur-xl transform -translate-y-2"></div>
                  
                  {/* Search Bar Container */}
                  <div className="relative flex items-center bg-black/70 rounded-xl border border-red-900/30 p-1.5 shadow-2xl transition-all duration-300 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:scale-[1.02]">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by user or prompt..."
                      className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-500 px-3 py-2 text-sm"
                    />
                    <button 
                      onClick={() => {
                        console.log("Searching for:", searchQuery);
                      }}
                      className="p-2 text-red-600 hover:text-red-500 transition-colors flex-shrink-0 hover:scale-110 transform duration-200"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area - make cards larger */}
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  {error}
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No images found matching your search.</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredImages.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                      className="group relative overflow-hidden rounded-xl bg-gray-900 shadow-lg hover:shadow-xl transition-shadow cursor-pointer aspect-square"
                      onClick={() => navigate(`/image/${image.id}`)}
                    >
                      {!loadedImages[image.id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                        </div>
                      )}
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        onLoad={() => handleImageLoad(image.id)}
                        className={`object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-110 ${
                          loadedImages[image.id] ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-sm text-gray-300 mb-1 animate-gradient-text">{image.creator}</p>
                          <p className="text-base font-medium text-white animate-gradient-text line-clamp-2">{image.prompt}</p>
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {image.likesCount}
                            </span>
                            <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Call to Action Section */}
        <div className="container mx-auto px-6 py-20 border-t border-red-900/20">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-red-500/10 via-red-900/20 to-red-950/30 rounded-2xl p-12 relative overflow-hidden group"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-dots-pattern opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
            
            {/* Animated circles */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-900/5 rounded-full blur-3xl animate-pulse delay-1000" />
            
            {/* Animated accent lines */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
            <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
            <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <motion.h2 
                  whileHover={{ scale: 1.02 }}
                  className="text-3xl font-bold mb-4 animate-gradient-text"
                >
                  Ready to Create?
                </motion.h2>
                <p className="text-gray-400 text-xl font-light group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                  Join our community of artists and start creating amazing AI-generated artwork today. Log in or register to get started!
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartCreating}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-red-600/50 text-lg flex items-center gap-2 group/btn"
              >
                <Sparkles className="w-5 h-5 transition-transform duration-300 group-hover/btn:rotate-12" />
                <span>{isAuthenticated ? "Start Creating" : "Get Started"}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-b from-black/80 via-black to-black relative">
          {/* Top border effects */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent blur-sm"></div>
          
          {/* Bottom border effects */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/10 to-transparent blur-sm"></div>
          
          {/* Content */}
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
              {/* Brand Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold animate-gradient-text">
                    Aura AI
                  </span>
                </div>
                <p className="text-gray-400 max-w-md animate-gradient-text">
                  Transform your imagination into stunning visuals with our AI-powered image generator. Create, explore, and share your artistic vision.
                </p>
              </div>

              {/* Social Links */}
              <div className="flex flex-col items-end justify-center space-y-6">
                <h3 className="text-lg font-semibold text-white">Connect With Us</h3>
                <div className="flex space-x-6">
                  {[
                    { icon: Github, label: "GitHub", href: "#github" },
                    { icon: Twitter, label: "Twitter", href: "#twitter" },
                    { icon: Instagram, label: "Instagram", href: "#instagram" },
                    { icon: Linkedin, label: "LinkedIn", href: "#linkedin" }
                  ].map((social, i) => (
                    <Link
                      key={i}
                      to={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                      whileHover={{ scale: 1.2, y: -2 }}
                      className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800/80 transition-all duration-300 shadow-lg hover:shadow-red-600/20 backdrop-blur-sm border border-red-900/20 hover:border-red-500/30 group"
                      title={social.label}
                    >
                      <social.icon className="w-6 h-6 animate-icon-glow" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-red-900/20 relative flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Border glow effect */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/10 to-transparent blur-sm"></div>
              <div className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Aura AI. All rights reserved.
              </div>
              <div className="flex gap-6 text-sm">
                <Link to="#" className="text-gray-400 hover:text-red-500 transition-colors">Privacy Policy</Link>
                <Link to="#" className="text-gray-400 hover:text-red-500 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
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

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-red-600/20 hover:bg-red-600/30 rounded-full backdrop-blur-sm border border-red-500/30 hover:border-red-500/50 transition-all duration-300 z-50 group"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-red-500 group-hover:text-red-400"
            >
              ↑
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {showBugReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-zinc-900 to-black border border-red-900/30 rounded-xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              {/* Modal accent effects */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">Report a Bug</h3>
                </div>
                
                <form onSubmit={handleSubmitBugReport} className="space-y-4">
                  {submitStatus.isSubmitted ? (
                    <div className={`p-6 rounded-lg ${
                      submitStatus.success 
                        ? "bg-green-500/20 border border-green-400" 
                        : "bg-red-500/20 border border-red-400"
                    }`}>
                      <p className={`text-center font-semibold text-lg ${
                        submitStatus.success ? "text-green-400" : "text-red-400"
                      }`}>
                        {submitStatus.success && (
                          <span className="inline-block mr-2">✓</span>
                        )}
                        {submitStatus.message}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                          Bug Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={bugReport.title}
                          onChange={(e) => setBugReport({ ...bugReport, title: e.target.value })}
                          className="w-full bg-black/50 border border-red-900/30 rounded-lg px-3 py-2 text-white focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors"
                          placeholder="Brief description of the issue"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={bugReport.description}
                          onChange={(e) => setBugReport({ ...bugReport, description: e.target.value })}
                          rows={3}
                          className="w-full bg-black/50 border border-red-900/30 rounded-lg px-3 py-2 text-white focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors"
                          placeholder="Detailed description of the bug"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBugReportModal(false)}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      {submitStatus.isSubmitted ? "Close" : "Cancel"}
                    </button>
                    {!submitStatus.isSubmitted && (
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Submit Report
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <SubscriptionPromptModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default HomePage;