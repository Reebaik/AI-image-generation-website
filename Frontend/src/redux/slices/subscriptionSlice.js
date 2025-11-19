import { createSlice } from '@reduxjs/toolkit';

// Simple function to check if a subscription is valid
const isSubscriptionValid = (sub) => {
  if (!sub) return false;
  
  // Check if subscription is expired
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
    return false;
  }
  
  // Check if we have generations left
  if (typeof sub.generationsLeft === 'number' && sub.generationsLeft <= 0) {
    return false;
  }
  
  // Check if subscription is active
  return sub.status === 'active';
};

// Get initial state from localStorage if available
const getInitialState = () => {
  try {
    const stored = localStorage.getItem('subscriptionData');
    if (!stored) return { subscription: null };
    
    const subscription = JSON.parse(stored);
    return { subscription: isSubscriptionValid(subscription) ? subscription : null };
  } catch (error) {
    console.error('Error loading subscription:', error);
    return { subscription: null };
  }
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: getInitialState(),
  reducers: {
    validateSubscription: (state) => {
      if (state.subscription && !isSubscriptionValid(state.subscription)) {
        state.subscription = null;
        localStorage.removeItem('subscriptionData');
      }
    },
    setSubscription: (state, action) => {
      state.subscription = action.payload && isSubscriptionValid(action.payload) 
        ? action.payload 
        : null;
      
      // Update localStorage
      if (state.subscription) {
        localStorage.setItem('subscriptionData', JSON.stringify(state.subscription));
      } else {
        localStorage.removeItem('subscriptionData');
      }
    },
    clearSubscription: (state) => {
      state.subscription = null;
      localStorage.removeItem('subscriptionData');
    },
    decrementGenerations: (state) => {
      if (!state.subscription || state.subscription.generationsLeft <= 0) {
        return;
      }
      
      const newCount = state.subscription.generationsLeft - 1;
      const updated = {
        ...state.subscription,
        generationsLeft: newCount,
        status: newCount > 0 ? 'active' : 'inactive'
      };
      
      state.subscription = isSubscriptionValid(updated) ? updated : null;
      
      // Update localStorage
      if (state.subscription) {
        localStorage.setItem('subscriptionData', JSON.stringify(state.subscription));
      } else {
        localStorage.removeItem('subscriptionData');
      }
    },
    addGenerations: (state, action) => {
      const count = Number(action.payload) || 0;
      const now = new Date();
      const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1));
      
      if (!state.subscription) {
        // Create new subscription if none exists
        state.subscription = {
          id: `sub_${Date.now()}`,
          planId: 'manual',
          planName: 'Manual Addition',
          generationsLeft: count,
          startDate: new Date().toISOString(),
          expiresAt: oneMonthLater.toISOString(),
          status: 'active'
        };
      } else {
        // Update existing subscription
        state.subscription = {
          ...state.subscription,
          generationsLeft: (state.subscription.generationsLeft || 0) + count,
          status: 'active',
          expiresAt: oneMonthLater.toISOString()
        };
      }
      
      // Update localStorage
      localStorage.setItem('subscriptionData', JSON.stringify(state.subscription));
    }
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => action.type === 'auth/logout',
      (state) => {
        state.subscription = null;
        localStorage.removeItem('subscriptionData');
      }
    );
  }
});

export const { 
  setSubscription, 
  clearSubscription, 
  decrementGenerations, 
  addGenerations,
  validateSubscription
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer; 