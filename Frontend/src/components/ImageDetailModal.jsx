import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Calendar, Users, Zap, Download, Share, User, Facebook, Twitter, Linkedin, Link } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

const ImageDetailModal = ({ isOpen, onClose, imageId }) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  
  const { isAuthenticated } = useSelector(state => state.auth);
  const shareOptionsRef = useRef(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  useEffect(() => {
    if (isOpen && imageId) {
      fetchImageDetails();
    }
  }, [isOpen, imageId]);
  
  // Handle clicks outside of share options
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
    }
    
    if (showShareOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareOptions]);
  
  const fetchImageDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the token if available
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${backendUrl}/images/${imageId}`, { headers });
      setImageData(response.data);
      setLiked(response.data.userHasLiked);
      setLikesCount(response.data.likesCount);
    } catch (err) {
      console.error('Error fetching image details:', err);
      setError('Failed to load image details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like images');
      return;
    }
    
    try {
      setLikeInProgress(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (liked) {
        // Unlike the image
        const response = await axios.post(
          `${backendUrl}/images/${imageId}/unlike`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikesCount(response.data.likesCount);
        setLiked(false);
      } else {
        // Like the image
        const response = await axios.post(
          `${backendUrl}/images/${imageId}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikesCount(response.data.likesCount);
        setLiked(true);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like status. Please try again.');
    } finally {
      setLikeInProgress(false);
    }
  };
  
  const handleDownload = () => {
    if (imageData?.imageUrl) {
      fetch(imageData.imageUrl)
        .then(res => res.blob())
        .then(blob => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `aura-ai-${imageId}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        })
        .catch(err => {
          console.error('Error downloading image:', err);
          alert('Failed to download image');
        });
    }
  };
  
  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };
  
  const shareToSocialMedia = (platform) => {
    if (!imageData?.imageUrl) return;
    
    let shareUrl = '';
    const text = encodeURIComponent(`Check out this AI-generated image: "${imageData.prompt}"`);
    const url = encodeURIComponent(imageData.imageUrl);
    const pageUrl = encodeURIComponent(`${window.location.origin}/image/${imageId}`);
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${text}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${pageUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${pageUrl}&media=${url}&description=${text}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${window.location.origin}/image/${imageId}`);
        setSuccessMessage('Link copied to clipboard!');
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowShareOptions(false);
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          {/* Success message toast */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900 border border-red-900/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-10 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="w-12 h-12 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : imageData ? (
              <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden">
                {/* Image container */}
                <div className="md:w-2/3 bg-black flex items-center justify-center">
                  <img
                    src={imageData.imageUrl}
                    alt={imageData.prompt}
                    className="max-w-full max-h-[60vh] md:max-h-[90vh] object-contain"
                  />
                </div>
                
                {/* Details container */}
                <div className="md:w-1/3 p-6 overflow-y-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{imageData.creator}</p>
                      <p className="text-sm text-gray-400">{formatDate(imageData.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-red-900/20 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Prompt</h3>
                    <p className="text-gray-300 italic">{imageData.prompt}</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-3">Generation Parameters</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Zap className="w-4 h-4 text-red-500" />
                        <span className="text-xs">STEPS</span>
                      </div>
                      <p className="text-white font-semibold">
                        {imageData.parameters?.inferenceSteps || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Users className="w-4 h-4 text-red-500" />
                        <span className="text-xs">GUIDANCE</span>
                      </div>
                      <p className="text-white font-semibold">
                        {imageData.parameters?.guidanceScale || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-red-900/20 col-span-2">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Calendar className="w-4 h-4 text-red-500" />
                        <span className="text-xs">DIMENSIONS</span>
                      </div>
                      <p className="text-white font-semibold">
                        {imageData.parameters?.width || 'N/A'} × {imageData.parameters?.height || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-red-900/20">
                    <button
                      onClick={handleLikeToggle}
                      disabled={likeInProgress}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${
                        liked 
                          ? 'bg-red-600/20 text-red-500 border border-red-600/30' 
                          : 'bg-black/30 text-gray-300 border border-red-900/20 hover:border-red-500/30'
                      } transition-colors`}
                    >
                      <Heart 
                        className={`w-5 h-5 ${liked ? 'fill-red-500' : ''} ${likeInProgress ? 'animate-pulse' : ''}`} 
                      />
                      <span>
                        {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                      </span>
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownload}
                        className="p-2.5 bg-black/30 text-gray-300 rounded-lg border border-red-900/20 hover:border-red-500/30 transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={toggleShareOptions}
                          className="p-2.5 bg-black/30 text-gray-300 rounded-lg border border-red-900/20 hover:border-red-500/30 transition-colors"
                          title="Share"
                        >
                          <Share className="w-5 h-5" />
                        </button>
                        
                        {/* Share options popup */}
                        {showShareOptions && (
                          <div 
                            ref={shareOptionsRef}
                            className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-red-900/20 rounded-lg shadow-lg p-3 w-56 z-20"
                          >
                            <button
                              onClick={() => setShowShareOptions(false)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            <h4 className="text-white text-sm font-medium mb-2">Share to:</h4>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              <button
                                onClick={() => shareToSocialMedia('facebook')}
                                className="flex flex-col items-center justify-center p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Share to Facebook"
                              >
                                <Facebook className="w-6 h-6 text-blue-500" />
                                <span className="text-xs mt-1">Facebook</span>
                              </button>
                              <button
                                onClick={() => shareToSocialMedia('twitter')}
                                className="flex flex-col items-center justify-center p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Share to Twitter"
                              >
                                <Twitter className="w-6 h-6 text-sky-500" />
                                <span className="text-xs mt-1">Twitter</span>
                              </button>
                              <button
                                onClick={() => shareToSocialMedia('linkedin')}
                                className="flex flex-col items-center justify-center p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Share to LinkedIn"
                              >
                                <Linkedin className="w-6 h-6 text-blue-600" />
                                <span className="text-xs mt-1">LinkedIn</span>
                              </button>
                            </div>
                            <button
                              onClick={() => shareToSocialMedia('copy')}
                              className="flex items-center justify-center gap-2 w-full p-2 mt-2 border border-red-900/20 rounded-lg hover:bg-red-900/20 transition-colors"
                            >
                              <Link className="w-4 h-4" />
                              <span className="text-sm">Copy Link</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageDetailModal; 