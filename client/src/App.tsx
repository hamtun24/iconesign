import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import InscriptionPage from "@/pages/inscription";
import LoginPage from "@/pages/login";
import HistoriquePage from "@/pages/historique";

import { AuthProvider, useAuth } from "@/contexts/AuthProvider";
import { Skeleton } from "./components/ui/skeleton";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    console.log("⏳ Auth is still loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100">
        <div className="text-center">
          <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("🔒 No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ User authenticated, rendering protected route");
  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    console.log("🔄 User is authenticated, redirecting to dashboard from public route");
    return <Navigate to="/dashboard" replace />;
  }

  // User is not authenticated, show public route
  return children;
}

// Main App
function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <Routes>
              {/* Public routes - redirect to dashboard if authenticated */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/inscription" 
                element={
                  <PublicRoute>
                    <InscriptionPage />
                  </PublicRoute>
                } 
              />
              
              {/* Protected routes - require authentication */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/historique"
                element={
                  <PrivateRoute>
                    <HistoriquePage />
                  </PrivateRoute>
                }
              />
              
              {/* Root redirect - send to login by default */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;