import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import Results from './pages/Results';
import History from './pages/History';
import Profile from './pages/Profile';
import Consult from './pages/Consult';
import Community from './pages/Community';
import Settings from './pages/Settings';
import ChatBot from './components/ChatBot';
import OnboardingTour from './components/OnboardingTour';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh-bg">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 animate-pulse" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Auth isSignUp={false} /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><Auth isSignUp={true} /></PublicOnlyRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/consult" element={<ProtectedRoute><Consult /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
      <ChatBot />
      <OnboardingTour />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
