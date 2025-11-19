import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, Image } from 'lucide-react';
import { subscriptionPlans, initializePayment } from '../services/subscriptionService';
import { setSubscription } from '../redux/slices/subscriptionSlice';
import { useNavigate } from 'react-router-dom';

const SubscriptionPlansPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const currentSubscription = useSelector((state) => state.subscription.subscription);

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await initializePayment(plan, user, (subscriptionData) => {
        dispatch(setSubscription(subscriptionData));
        navigate('/generate');
      });
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('Generations')) return <Image className="w-5 h-5 text-red-500" />;
    if (feature.includes('Resolution')) return <Sparkles className="w-5 h-5 text-red-500" />;
    if (feature.includes('Support')) return <Shield className="w-5 h-5 text-red-500" />;
    return <Check className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Navigation Bar */}
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl font-bold mb-4 animate-gradient-text">
                Choose Your Plan
              </h1>
              <p className="text-gray-400 text-lg">
                Select the perfect plan for your creative needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.values(subscriptionPlans).map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-black/50 border ${
                    plan.id === 'pro' ? 'border-red-600/40' : 'border-red-900/30'
                  } rounded-xl p-6 hover:border-red-600/40 transition-all relative overflow-hidden`}
                >
                  {plan.id === 'pro' && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                        Popular
                      </span>
                    </div>
                  )}

                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        {getFeatureIcon(feature)}
                        <span className="ml-3 text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.id === 'pro'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
                        : 'bg-black/50 border border-red-900/30 hover:border-red-600/40 text-white'
                    }`}
                  >
                    {currentSubscription?.planId === plan.id ? 'Current Plan' : 'Subscribe Now'}
                  </button>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 text-center"
            >
              <h3 className="text-xl font-semibold mb-4">100% Secure Payments</h3>
              <p className="text-gray-400">
                Your payment information is processed securely through Razorpay.
                We never store your payment details.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage; 