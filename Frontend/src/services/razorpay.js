// Store the Razorpay instance
let razorpayInstance = null;

// Flag to track if we've already loaded the script
let scriptLoading = false;
let scriptLoadCallbacks = [];

/**
 * Loads the Razorpay script with error handling and retry logic
 */
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    // If script is already loading, add to callbacks
    if (scriptLoading) {
      scriptLoadCallbacks.push({ resolve, reject });
      return;
    }

    scriptLoading = true;
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.id = 'razorpay-checkout-js';

    // Handle script load
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      scriptLoading = false;
      
      // The Razorpay SDK might still need a moment to initialize
      const checkRazorpay = () => {
        if (window.Razorpay) {
          // Resolve all pending callbacks
          scriptLoadCallbacks.forEach(cb => cb.resolve(window.Razorpay));
          scriptLoadCallbacks = [];
          resolve(window.Razorpay);
        } else {
          setTimeout(checkRazorpay, 100);
        }
      };
      
      checkRazorpay();
    };

    // Handle script error
    script.onerror = (error) => {
      console.error('Error loading Razorpay script:', error);
      scriptLoading = false;
      
      // Reject all pending callbacks
      const errorMsg = new Error('Failed to load Razorpay script');
      scriptLoadCallbacks.forEach(cb => cb.reject(errorMsg));
      scriptLoadCallbacks = [];
      reject(errorMsg);
    };

    // Add the script to the document
    document.body.appendChild(script);
  });
};

/**
 * Patches the SVG elements in the Razorpay modal
 */
const patchSvgElements = () => {
  try {
    // Find all SVG elements with auto width/height
    const svgs = document.querySelectorAll('svg[width="auto"], svg[height="auto"]');
    
    svgs.forEach(svg => {
      // Set default dimensions if auto is present
      if (svg.getAttribute('width') === 'auto') {
        svg.setAttribute('width', '24');
      }
      if (svg.getAttribute('height') === 'auto') {
        svg.setAttribute('height', '24');
      }
      
      // Ensure viewBox is set for proper scaling
      if (!svg.getAttribute('viewBox') && svg.getAttribute('width') && svg.getAttribute('height')) {
        svg.setAttribute('viewBox', `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`);
      }
    });
  } catch (error) {
    console.warn('Error patching SVG elements:', error);
  }
};

/**
 * Creates a Razorpay instance with patched methods
 */
const createPatchedRazorpay = (options) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay is not available');
  }

  // Create a new instance
  const rzp = new window.Razorpay(options);
  
  // Store the original open method
  const originalOpen = rzp.open;
  
  // Patch the open method
  rzp.open = function() {
    // Create a mutation observer to patch SVGs as they're added
    const observer = new MutationObserver((mutations) => {
      let shouldPatch = false;
      
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldPatch = true;
        }
      });
      
      if (shouldPatch) {
        patchSvgElements();
      }
    });
    
    // Start observing the document
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Call the original open method
    try {
      const result = originalOpen.apply(this, arguments);
      
      // Patch SVGs after a delay to ensure the modal is rendered
      setTimeout(() => {
        patchSvgElements();
        // Disconnect the observer after a while to prevent memory leaks
        setTimeout(() => observer.disconnect(), 5000);
      }, 300);
      
      return result;
    } catch (error) {
      console.error('Error in patched Razorpay open:', error);
      observer.disconnect();
      throw error;
    }
  };
  
  return rzp;
};

/**
 * Loads the Razorpay SDK and returns a function to create instances
 */
export const initializeRazorpay = async () => {
  try {
    // If we already have an instance, return it
    if (razorpayInstance) {
      return razorpayInstance;
    }
    
    // Load the Razorpay script
    await loadRazorpayScript();
    
    // Create a factory function for creating Razorpay instances
    razorpayInstance = (options) => {
      try {
        return createPatchedRazorpay(options);
      } catch (error) {
        console.error('Error creating Razorpay instance:', error);
        throw new Error('Failed to initialize payment. Please try again.');
      }
    };
    
    // Copy static properties from the original Razorpay
    Object.assign(razorpayInstance, window.Razorpay);
    
    return razorpayInstance;
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error);
    throw new Error('Payment service is currently unavailable. Please try again later.');
  }
};

/**
 * Directly opens a Razorpay payment modal with the given options
 */
export const openRazorpay = async (options) => {
  try {
    const Razorpay = await initializeRazorpay();
    const rzp = Razorpay(options);
    rzp.open();
    return rzp;
  } catch (error) {
    console.error('Error opening Razorpay:', error);
    throw error;
  }
};
