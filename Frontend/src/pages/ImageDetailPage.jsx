import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Users, Zap, Download, Share, User, ArrowLeft, Facebook, Twitter, Linkedin, Instagram, Link, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ImageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const shareOptionsRef = useRef(null);
  
  useEffect(() => {
    fetchImageDetails();
  }, [id]);
  
  // Handle clicks outside the share options
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const fetchImageDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token if available
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`http://localhost:5000/images/${id}`, { headers });
      setImageData(response.data);
      setLiked(response.data.userHasLiked);
      setLikesCount(response.data.likesCount);
    } catch (err) {
      console.error('Error fetching image details:', err);
      setError('Failed to load image details');
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
        // Unlike
        const response = await axios.post(
          `http://localhost:5000/images/${id}/unlike`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikesCount(response.data.likesCount);
        setLiked(false);
      } else {
        // Like
        const response = await axios.post(
          `http://localhost:5000/images/${id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikesCount(response.data.likesCount);
        setLiked(true);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like status');
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
          link.download = `aura-ai-${id}.jpg`;
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
    const pageUrl = encodeURIComponent(`${window.location.origin}/image/${id}`);
    
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
        navigator.clipboard.writeText(`${window.location.origin}/image/${id}`);
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
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
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
      
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
        
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="w-12 h-12 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-900/40 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
            <p className="text-gray-300">{error}</p>
          </div>
        ) : imageData ? (
          <div className="flex flex-col lg:flex-row gap-8 bg-zinc-900/30 rounded-xl border border-red-900/20 p-6 backdrop-blur-sm">
            <div className="lg:w-2/3">
              <div className="bg-black rounded-lg overflow-hidden">
                <img 
                  src={imageData.imageUrl} 
                  alt={imageData.prompt}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              
              <div className="mt-6 flex flex-wrap gap-4">
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
                
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black/30 text-gray-300 rounded-lg border border-red-900/20 hover:border-red-500/30 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={toggleShareOptions}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black/30 text-gray-300 rounded-lg border border-red-900/20 hover:border-red-500/30 transition-colors"
                  >
                    <Share className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                  
                  {/* Share options popup */}
                  {showShareOptions && (
                    <div 
                      ref={shareOptionsRef}
                      className="absolute bottom-full mb-2 right-0 bg-zinc-900 border border-red-900/20 rounded-lg shadow-lg p-3 w-56 animate-fade-in"
                    >
                      <button
                        onClick={() => setShowShareOptions(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <h4 className="text-white text-sm font-medium mb-2">Share to:</h4>
                      <div className="grid grid-cols-4 gap-2 mb-2">
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
                        <button
                          onClick={() => shareToSocialMedia('pinterest')}
                          className="flex flex-col items-center justify-center p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Share to Pinterest"
                        >
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                            P
                          </div>
                          <span className="text-xs mt-1">Pinterest</span>
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
            
            <div className="lg:w-1/3">
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
                  <p className="text-white font-semibold">{imageData.parameters?.inferenceSteps || 'N/A'}</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Users className="w-4 h-4 text-red-500" />
                    <span className="text-xs">GUIDANCE</span>
                  </div>
                  <p className="text-white font-semibold">{imageData.parameters?.guidanceScale || 'N/A'}</p>
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
              
              {!isAuthenticated && (
                <div className="mt-4 p-4 bg-black/20 rounded-lg border border-red-900/20">
                  <p className="text-gray-300 text-sm mb-3">
                    Want to create your own amazing AI-generated images?
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Sign In to Create
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ImageDetailPage; 