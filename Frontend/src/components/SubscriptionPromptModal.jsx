import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscriptionPlans } from '../services/subscriptionService';

const SubscriptionPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/subscription');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black/90 border border-red-900/30 rounded-xl p-6 max-w-lg w-full mx-4"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">Subscribe to Generate Images</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              To start generating amazing AI images, you'll need an active subscription. Choose from our flexible plans:
            </p>

            <div className="space-y-4 mb-6">
              {Object.values(subscriptionPlans).map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-start space-x-4 bg-black/50 border border-red-900/30 rounded-lg p-4 hover:border-red-600/40 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">₹{plan.price} / month</p>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 2).map((feature, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center">
                          <Check className="w-4 h-4 text-red-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSubscribe}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-semibold transition-all"
              >
                View All Plans
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 bg-black/50 border border-red-900/30 hover:border-red-600/40 text-white rounded-lg font-semibold transition-all"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionPromptModal; 