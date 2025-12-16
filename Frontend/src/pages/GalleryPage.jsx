import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Loader, Trash2, Share2, Download, Facebook, Twitter, Linkedin, Link, Instagram, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkSubscriptionStatus } from "../services/subscriptionService";
import SubscriptionPromptModal from "../components/SubscriptionPromptModal";

const GalleryPage = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(null);
    const [sharePopupId, setSharePopupId] = useState(null);
    const [darkMode, setDarkMode] = useState(true);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    // Reference for share popup
    const sharePopupRef = useRef(null);

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

    // Handle clicking outside the share popup
    useEffect(() => {
        function handleClickOutside(event) {
            if (sharePopupRef.current && !sharePopupRef.current.contains(event.target)) {
                setSharePopupId(null);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [sharePopupRef]);

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
            setLoading(false);
            setError("Please log in to view your gallery");
            return;
        }

        const fetchGallery = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Authentication token not found");
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${backendUrl}/images/gallery`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || data.details || "Failed to load gallery");
                }
                
                console.log("Gallery data:", data);
                setImages(data.images || []);
            } catch (err) {
                console.error("Gallery fetch error:", err);
                setError("Failed to load gallery: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchGallery();
    }, [isAuthenticated, navigate]);

    const handleDelete = async (imageId) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication token not found");
                return;
            }
            
            console.log("Deleting image:", imageId);
            
            const response = await fetch(`${backendUrl}/images/delete/${imageId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || errorData.details || "Failed to delete image");
                } else {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            console.log("Delete response:", data);
            
            setImages(images.filter((img) => img._id !== imageId));
        } catch (err) {
            console.error("Error deleting image:", err);
            alert("Failed to delete image: " + err.message);
        }
    };

    const handleShare = (imageId) => {
        // Toggle share popup for this image
        setSharePopupId(sharePopupId === imageId ? null : imageId);
    };

    const shareToSocialMedia = (imageUrl, prompt, platform) => {
        if (!imageUrl) return;
        
        let shareUrl = '';
        const text = encodeURIComponent(`Check out this AI-generated image: "${prompt}"`);
        const url = encodeURIComponent(imageUrl);
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'pinterest':
                shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${url}&description=${text}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(imageUrl);
                setSuccessMessage("Image URL copied to clipboard!");
                setTimeout(() => setSuccessMessage(null), 3000);
                setSharePopupId(null);
                return;
            default:
                return;
        }
        
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setSharePopupId(null);
    };

    const handleDownload = (imageUrl, prompt) => {
        fetch(imageUrl)
            .then((res) => res.blob())
            .then((blob) => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            })
            .catch(err => {
                console.error("Error downloading image", err);
                alert("Failed to download image");
            });
    };

    const handleLogin = () => {
        navigate("/login");
    };

    const handleGenerate = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // If user is admin, navigate directly
        if (user?.role === 'admin') {
            navigate('/generate');
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

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
                <div className="bg-black/50 border border-red-900/30 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Gallery Access</h1>
                    <p className="text-gray-300 mb-6">Please log in to view your gallery</p>
                    <button
                        onClick={handleLogin}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
            
            {/* Content container */}
            <div className="relative z-10">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-red-900/20 shadow-lg">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-2xl font-bold text-red-600 cursor-pointer"
                                onClick={() => navigate("/")}
                            >
                                Aura AI
                            </motion.div>

                            <div className="flex items-center space-x-6">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="text-white/80 hover:text-white transition-colors"
                                    onClick={handleGenerate}
                                >
                                    Generate
                                </motion.button>
                                
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
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="container mx-auto px-6 pt-32 pb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-bold text-center mb-12">Your Gallery</h1>

                        {/* Success Message */}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-green-500 text-center mb-6"
                            >
                                ✅ {successMessage}
                            </motion.div>
                        )}

                        {loading && (
                            <div className="flex justify-center items-center py-12">
                                <Loader className="w-8 h-8 text-red-600 animate-spin" />
                                <span className="ml-3 text-xl">Loading your images...</span>
                            </div>
                        )}
                        
                        {error && (
                            <div className="text-center bg-red-500/20 border border-red-500/30 rounded-md p-4 mb-6">
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}

                        {!loading && !error && images.length === 0 && (
                            <div className="text-center bg-gray-900/50 border border-red-900/20 rounded-md p-8 mb-6 backdrop-blur-sm">
                                <p className="text-gray-400 mb-4">You haven't saved any images yet</p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleGenerate}
                                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-600/50"
                                >
                                    Create Images
                                </motion.button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {images.map((image) => (
                                <motion.div 
                                    key={image._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-gray-900/50 rounded-xl p-4 backdrop-blur-sm border border-red-900/20 overflow-hidden"
                                >
                                    <div 
                                        className="relative group cursor-pointer" 
                                        onClick={() => navigate(`/image/${image._id}`)}
                                    >
                                        <img 
                                            src={image.url} 
                                            alt={image.prompt} 
                                            className="w-full h-64 object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                            <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                                                <div>Steps: {image.parameters?.inferenceSteps || 4}</div>
                                                <div>Guidance: {image.parameters?.guidanceScale?.toFixed(1) || "0.5"}</div>
                                                <div>Size: {image.parameters?.width || 512}×{image.parameters?.height || 512}</div>
                                                <div>{new Date(image.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(image.url, image.prompt);
                                            }}
                                            className="text-white/80 hover:text-white transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-5 h-5" />
                                        </motion.button>
                                        <div className="relative">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShare(image._id);
                                                }}
                                                className="text-white/80 hover:text-white transition-colors"
                                                title="Share"
                                            >
                                                <Share2 className="w-5 h-5" />
                                            </motion.button>
                                            
                                            {/* Share Options Popup */}
                                            <AnimatePresence>
                                                {sharePopupId === image._id && (
                                                    <motion.div 
                                                        ref={sharePopupRef}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute right-0 bottom-8 bg-gray-900 rounded-lg shadow-xl border border-red-900/20 w-48 z-10"
                                                    >
                                                        <div className="p-2 flex flex-col gap-1">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    shareToSocialMedia(image.url, image.prompt, 'facebook');
                                                                }}
                                                                className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                                                            >
                                                                <Facebook className="w-4 h-4 text-blue-500" />
                                                                <span>Facebook</span>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    shareToSocialMedia(image.url, image.prompt, 'twitter');
                                                                }}
                                                                className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                                                            >
                                                                <Twitter className="w-4 h-4 text-sky-500" />
                                                                <span>Twitter</span>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    shareToSocialMedia(image.url, image.prompt, 'linkedin');
                                                                }}
                                                                className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                                                            >
                                                                <Linkedin className="w-4 h-4 text-blue-600" />
                                                                <span>LinkedIn</span>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    shareToSocialMedia(image.url, image.prompt, 'pinterest');
                                                                }}
                                                                className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                                                            >
                                                                <Instagram className="w-4 h-4 text-red-600" />
                                                                <span>Pinterest</span>
                                                            </button>
                                                            <div className="border-t border-gray-700 my-1"></div>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    shareToSocialMedia(image.url, image.prompt, 'copy');
                                                                }}
                                                                className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                                                            >
                                                                <Link className="w-4 h-4 text-gray-400" />
                                                                <span>Copy URL</span>
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(image._id);
                                            }}
                                            className="text-red-500 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Add Subscription Modal */}
            <SubscriptionPromptModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />
        </div>
    );
};

export default GalleryPage;
