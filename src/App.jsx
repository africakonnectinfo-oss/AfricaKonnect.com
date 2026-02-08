import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Experts from './pages/Experts';
import ProjectHub from './pages/ProjectHub';
import ExpertDashboard from './pages/ExpertDashboard';
import Collaboration from './pages/Collaboration';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Pricing from './pages/Pricing';
import UserProfile from './pages/UserProfile';
import PublicProfile from './pages/PublicProfile';
// Bidding System Pages
import ProjectMarketplace from './pages/ProjectMarketplace';
import MyBids from './pages/MyBids';
// Company Pages
import AboutUs from './pages/AboutUs';
import Careers from './pages/Careers';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Commitment from './pages/Commitment';
// Legal Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Security from './pages/legal/Security';
import PrivateRoute from './components/auth/PrivateRoute';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OAuthConsent from './pages/OAuthConsent';
// Neon Auth Pages
import { Home as NeonHome } from './pages/NeonHome';
import Auth from './pages/AuthPage';
import { Account } from './pages/account';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Layout>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/experts" element={<Experts />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth/consent" element={<OAuthConsent />} />

            {/* Protected Routes */}
            <Route
              path="/project-hub"
              element={
                <PrivateRoute roles={['client']}>
                  <ProjectHub />
                </PrivateRoute>
              }
            />
            <Route
              path="/expert-dashboard"
              element={
                <PrivateRoute roles={['expert']}>
                  <ExpertDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/collaboration"
              element={
                <PrivateRoute>
                  <Collaboration />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile/view/:id"
              element={
                <PrivateRoute>
                  <PublicProfile />
                </PrivateRoute>
              }
            />

            {/* Bidding System Routes */}
            <Route
              path="/marketplace"
              element={
                <PrivateRoute roles={['expert']}>
                  <ProjectMarketplace />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-bids"
              element={
                <PrivateRoute roles={['expert']}>
                  <MyBids />
                </PrivateRoute>
              }
            />

            {/* Company Routes */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/commitment" element={<Commitment />} />

            {/* Neon Auth Routes */}
            <Route path="/neon-home" element={<NeonHome />} />
            <Route path="/auth/:pathname" element={<Auth />} />
            <Route path="/account/:pathname" element={<Account />} />

            {/* Legal Routes */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/security" element={<Security />} />
          </Routes>
        </Layout>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
