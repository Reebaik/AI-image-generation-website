import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from "./components/ErrorBoundary";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GalleryPage from "./pages/GalleryPage";
import ImageGenerationPage from "./pages/ImageGenerationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ImageDetailPage from "./pages/ImageDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId="466888122890-kr142c8579j8gve7q4vai501pv73o29t.apps.googleusercontent.com">
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/generate" element={<ProtectedRoute element={<ImageGenerationPage />} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/subscription" element={<ProtectedRoute element={<SubscriptionPlansPage />} />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/image/:id" element={<ImageDetailPage />} />
            <Route path="/admin" element={<ProtectedRoute element={<AdminDashboardPage />} requireAdmin={true} />} />
          </Routes>
        </Router>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;

