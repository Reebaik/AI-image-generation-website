import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, requireAdmin = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If admin route, check if user is admin
  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated and authorized
  return element;
};

export default ProtectedRoute; 