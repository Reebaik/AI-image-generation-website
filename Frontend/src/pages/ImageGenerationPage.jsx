import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, Share2, Loader, Save, Settings, ChevronDown, ChevronUp, X, Facebook, Twitter, Linkedin, Link, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { decrementGenerations, validateSubscription, setSubscription } from "../redux/slices/subscriptionSlice";
import { checkSubscriptionStatus } from "../services/subscriptionService";
import SubscriptionPromptModal from "../components/SubscriptionPromptModal";

const ImageGenerationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const subscription = useSelector((state) => state.subscription.subscription);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Advanced settings
  const [inferenceSteps, setInferenceSteps] = useState(4);
  const [guidanceScale, setGuidanceScale] = useState(0.5);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);

  // Handle outside click for share popup
  const sharePopupRef = useRef(null);

  // Close share popup when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (sharePopupRef.current && !sharePopupRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sharePopupRef]);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        console.log('Checking subscription status in ImageGenerationPage...');
        const subscriptionStatus = await checkSubscriptionStatus();
        console.log('Current subscription status:', subscriptionStatus);
        
        if (subscriptionStatus && 
            subscriptionStatus.status === 'active' && 
            subscriptionStatus.generationsLeft > 0 &&
            (!subscriptionStatus.expiresAt || new Date(subscriptionStatus.expiresAt) > new Date())) {
          
          console.log('Valid subscription found');
          // Update the Redux store with the latest subscription data
          dispatch(setSubscription(subscriptionStatus));
          setShowSubscriptionModal(false);
        } else {
          console.log('No valid subscription found, showing subscription modal');
          // If no valid subscription, show the subscription modal
          setShowSubscriptionModal(true);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        // On error, still allow access but show the subscription modal
        setShowSubscriptionModal(true);
      }
    };
    
    checkSubscription();
    
    // Also check subscription when the component gains focus
    window.addEventListener('focus', checkSubscription);
    return () => {
      window.removeEventListener('focus', checkSubscription);
    };
  }, [dispatch]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a valid prompt!");
      return;
    }

    // Check subscription status with the server
    try {
      const subscriptionStatus = await checkSubscriptionStatus();
      
      if (!subscriptionStatus || subscriptionStatus.status !== 'active' || subscriptionStatus.generationsLeft <= 0) {
        setShowSubscriptionModal(true);
        return;
      }
      
      // Update the Redux store with the latest subscription data
      dispatch(setSubscription(subscriptionStatus));
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setShowSubscriptionModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setImageUrl(null);
      setSuccessMessage(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized: Please log in first.");
        setLoading(false);
        return;
      }

      console.log("Sending request to generate image...");
      const response = await fetch(`${backendUrl}/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          prompt,
          inferenceSteps,
          guidanceScale,
          width,
          height
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || data.details || data.message || "Failed to generate image");
      }

      setImageUrl(data.image);
      
      // Decrement generations left after successful generation
      dispatch(decrementGenerations());
      
      // Show remaining generations
      setSuccessMessage(`Image generated successfully! ${subscription.generationsLeft - 1} generations remaining.`);
    } catch (error) {
      console.error("Error generating image:", error);
      setError(error.message || "Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = async () => {
    if (!imageUrl) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized: Please log in first.");
        setSaving(false);
        return;
      }
      
      console.log("Saving image to gallery:", imageUrl);
      
      // Check if the image URL is a Cloudinary URL or base64
      const isBase64 = imageUrl.startsWith('data:image');
      
      const response = await fetch(`${backendUrl}/images/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          prompt: prompt,
          parameters: {
            inferenceSteps,
            guidanceScale,
            width,
            height
          }
        })
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || "Failed to save image");
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log("Save response:", data);
      
      setSuccessMessage("Image saved to your gallery!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving image:", error);
      setError(error.message || "Failed to save image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "generated_image.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  const shareImage = () => {
    if (!imageUrl) return;
    setShowShareOptions(!showShareOptions);
  };

  const shareToSocialMedia = (platform) => {
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
        setShowShareOptions(false);
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };

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
                {isAuthenticated && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-white/80 hover:text-white transition-colors"
                    onClick={() => navigate("/gallery")}
                  >
                    Gallery
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h1 className="text-4xl font-bold text-center mb-8">
              Generate AI Image
            </h1>

            {/* Prompt Input */}
            <div className="relative w-full mb-4">
              {/* Floating Effect Shadow */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-900/20 rounded-xl blur-xl transform -translate-y-2"></div>
              
              {/* Input Container */}
              <div className="relative flex items-center bg-black/70 rounded-xl border border-red-900/30 p-1.5 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-500 px-4 py-3 text-base"
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-300 ml-2 flex-shrink-0 hover:shadow-lg hover:shadow-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="mb-6">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-center w-full py-2 text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </button>
              
              {/* Advanced Settings Panel */}
              {showAdvanced && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-900/50 rounded-xl p-4 backdrop-blur-sm border border-red-900/20 mt-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Inference Steps */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Inference Steps: {inferenceSteps}
                      </label>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-2">1</span>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={inferenceSteps}
                          onChange={(e) => setInferenceSteps(Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <span className="text-xs text-gray-500 ml-2">50</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Higher values = better quality but slower generation</p>
                    </div>
                    
                    {/* Guidance Scale */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Guidance Scale: {guidanceScale.toFixed(1)}
                      </label>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-2">0</span>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.1"
                          value={guidanceScale}
                          onChange={(e) => setGuidanceScale(Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <span className="text-xs text-gray-500 ml-2">20</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">How closely to follow the prompt (higher = more faithful)</p>
                    </div>
                    
                    {/* Width */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Width: {width}px
                      </label>
                      <select
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="256">256px</option>
                        <option value="512">512px</option>
                        <option value="768">768px</option>
                        <option value="1024">1024px</option>
                      </select>
                    </div>
                    
                    {/* Height */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Height: {height}px
                      </label>
                      <select
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="256">256px</option>
                        <option value="512">512px</option>
                        <option value="768">768px</option>
                        <option value="1024">1024px</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-400">
                    <p>Note: Higher resolution and more steps will take longer to generate.</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-center mb-6"
              >
                ⚠️ {error}
              </motion.div>
            )}

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

            {/* Generated Image */}
            {imageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-red-900/20"
              >
                <img
                  src={imageUrl}
                  alt="Generated"
                  className="w-full h-auto rounded-lg mb-6 shadow-2xl"
                />
                <div className="flex justify-center gap-4">
                  <motion.button
                    onClick={saveToGallery}
                    disabled={saving}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save to Gallery
                  </motion.button>
                  <motion.button
                    onClick={downloadImage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-red-600/50"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </motion.button>
                  <div className="relative">
                    <motion.button
                      onClick={shareImage}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-red-600/50"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </motion.button>
                    
                    {/* Share Options Popup */}
                    <AnimatePresence>
                      {showShareOptions && (
                        <motion.div 
                          ref={sharePopupRef}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 bottom-12 bg-gray-900 rounded-lg shadow-xl border border-red-900/20 w-48 z-10"
                        >
                          <div className="p-2 flex flex-col gap-1">
                            <button 
                              onClick={() => shareToSocialMedia('facebook')}
                              className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                            >
                              <Facebook className="w-4 h-4 text-blue-500" />
                              <span>Facebook</span>
                            </button>
                            <button 
                              onClick={() => shareToSocialMedia('twitter')}
                              className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                            >
                              <Twitter className="w-4 h-4 text-sky-500" />
                              <span>Twitter</span>
                            </button>
                            <button 
                              onClick={() => shareToSocialMedia('linkedin')}
                              className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                            >
                              <Linkedin className="w-4 h-4 text-blue-600" />
                              <span>LinkedIn</span>
                            </button>
                            <button 
                              onClick={() => shareToSocialMedia('pinterest')}
                              className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md w-full text-left"
                            >
                              <Instagram className="w-4 h-4 text-red-600" />
                              <span>Pinterest</span>
                            </button>
                            <div className="border-t border-gray-700 my-1"></div>
                            <button 
                              onClick={() => shareToSocialMedia('copy')}
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
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add subscription info */}
      {subscription && (
        <div className="absolute top-4 right-4 bg-black/50 border border-red-900/30 rounded-lg px-4 py-2">
          <p className="text-sm text-gray-400">
            Generations Left: <span className="text-white font-semibold">{subscription.generationsLeft}</span>
          </p>
        </div>
      )}
      
      {/* Subscription Modal */}
      <SubscriptionPromptModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default ImageGenerationPage;