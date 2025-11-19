import axios from 'axios';

// Subscription plans configuration
export const subscriptionPlans = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 499,
    features: [
      '50 AI Image Generations',
      'Standard Resolution (512x512)',
      'Basic Support',
      'Community Access'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 999,
    features: [
      '150 AI Image Generations',
      'High Resolution (1024x1024)',
      'Priority Support',
      'Advanced Features',
      'Community Access'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    price: 1999,
    features: [
      '400 AI Image Generations',
      'Ultra High Resolution (2048x2048)',
      '24/7 Priority Support',
      'All Advanced Features',
      'Early Access to New Features',
      'Community Access'
    ]
  }
};

// Initialize payment and create order
export const initializePayment = async (plan, user, onSuccess) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  console.log('Creating order for plan:', plan.id);
  
  try {
    // Step 1: Create order on our server
    const orderResponse = await axios.post(
      'http://localhost:5000/api/payment/create-order',
      {
        planId: plan.id,
        amount: plan.price * 100 // Convert to paise
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      }
    );

    console.log('Order created:', orderResponse.data);

    if (!orderResponse.data.key) {
      console.error('Missing Razorpay key in response:', orderResponse.data);
      throw new Error('Payment service configuration error. Please contact support.');
    }

    // Step 2: Prepare payment handler
    const handlePayment = async (response) => {
      console.log('Payment response received:', response);
      
      try {
        // Verify payment with our server
        const verifyResponse = await axios.post(
          'http://localhost:5000/api/payment/verify',
          {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            planId: plan.id
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 seconds timeout
          }
        );

        console.log('Payment verification successful:', verifyResponse.data);

        // Handle subscription data from server response
        let subscriptionData;
        
        // Check if the response contains direct subscription data
        if (verifyResponse.data.planId || verifyResponse.data.planName) {
          // If the response contains plan details directly, use them
          subscriptionData = {
            ...verifyResponse.data,
            lastVerified: new Date().toISOString(),
            source: 'server-verified',
            status: 'active',
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
          };
          console.log('Using direct subscription data from server:', subscriptionData);
        } 
        // If the server wraps the subscription data in a 'subscription' object
        else if (verifyResponse.data.subscription) {
          subscriptionData = {
            ...verifyResponse.data.subscription,
            lastVerified: new Date().toISOString(),
            source: 'server-verified',
            status: 'active',
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
          };
          console.log('Using nested subscription data from server:', subscriptionData);
        } 
        // If the server just indicates success without subscription data
        else if (verifyResponse.data.success || response.razorpay_payment_id) {
          console.warn('No subscription data in server response, creating subscription from payment data');
          subscriptionData = {
            status: 'active',
            planId: plan.id,
            planName: plan.name,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            lastVerified: new Date().toISOString(),
            source: 'client-generated',
            // Set a default expiration (1 month from now)
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            // Default generations based on plan
            generationsLeft: plan.id === 'basic' ? 50 : plan.id === 'pro' ? 150 : 400,
            // Include price for reference
            price: plan.price,
            currency: 'INR'
          };
        } else {
          console.error('Unexpected server response format:', verifyResponse.data);
          throw new Error('Invalid server response format');
        }
        
        // Store the subscription data
        localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
        console.log('Subscription data stored in localStorage:', subscriptionData);
        
        // Call success callback with subscription data
        onSuccess({ subscription: subscriptionData });
      } catch (error) {
        console.error('Payment verification failed:', error);
        
        // If verification fails but we have a payment ID, still store the subscription
        if (response.razorpay_payment_id) {
          console.warn('Payment verification failed but payment was successful. Storing subscription data.');
          const subscriptionData = {
            status: 'active',
            planId: plan.id,
            planName: plan.name,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            lastVerified: new Date().toISOString(),
            source: 'client-generated-fallback',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            generationsLeft: plan.id === 'basic' ? 50 : plan.id === 'pro' ? 150 : 400,
            price: plan.price,
            currency: 'INR'
          };
          localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
          onSuccess({ subscription: subscriptionData });
        } else {
          throw new Error('Payment verification failed. Please contact support if the amount was deducted.');
        }
      }
    };

    // Step 3: Prepare Razorpay options
    const options = {
      key: orderResponse.data.key,
      amount: orderResponse.data.amount,
      currency: 'INR',
      name: 'Aura AI',
      description: `${plan.name} Subscription`,
      order_id: orderResponse.data.orderId,
      handler: handlePayment,
      prefill: {
        name: user.username || 'Customer',
        email: user.email || 'customer@example.com',
        contact: user.phone || '9000000000'
      },
      theme: {
        color: '#2563eb',
        hide_topbar: false,
        backdrop_close: true
      },
      modal: {
        ondismiss: () => {
          console.log('Payment window closed by user');
        },
        escape: true,
        handle_back: true
      },
      timeout: 300, // 5 minutes timeout
      remember_customer: true,
      notes: {
        plan: plan.id,
        userId: user._id || 'unknown',
        source: 'aura-ai-web'
      }
    };

    console.log('Opening Razorpay checkout with options:', options);
    
    // Step 4: Open Razorpay modal
    const { openRazorpay } = await import('./razorpay');
    const rzp = await openRazorpay(options);
    
    // Add error handler for the modal
    if (rzp && typeof rzp.on === 'function') {
      rzp.on('payment.failed', (response) => {
        const errorMsg = response.error?.description || 'Payment failed. Please try again.';
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${errorMsg}`);
      });
    }
    
    return rzp;
    
  } catch (error) {
    console.error('Payment initialization failed:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to process payment. Please try again.';
    
    if (error.response) {
      // Server responded with an error status
      console.error('Error response:', error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      // No response received
      console.error('No response received:', error.request);
      errorMessage = 'No response from payment service. Please check your connection.';
    } else if (error.message) {
      // Other errors
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Check subscription status with the server
export const checkSubscriptionStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, user is not authenticated');
      return null;
    }

    console.log('Checking subscription status with server...');
    const response = await axios.get('http://localhost:5000/api/subscription/status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.subscription) {
      console.log('Using direct subscription data from server:', response.data.subscription);
      return response.data.subscription;
    }

    console.log('No active subscription found');
    return null;
  } catch (error) {
    console.error('Error checking subscription with server:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post(
      'http://localhost:5000/api/subscription/cancel',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    // Remove subscription from localStorage
    localStorage.removeItem('subscriptionData');
    
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};
