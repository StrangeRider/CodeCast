import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';

// Simple Route Protection for Logged-In Users
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="p-8 text-black text-sm">Loading...</div>;
  if (!user || user.isGuest) return <Navigate to="/" />;
  
  return children;
};

// Route protection for Workspace (requires either a registered user or a guest user session)
const WorkspaceRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="p-8 text-black text-sm">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: {
                background: '#FFFFFF',
                color: '#000000',
                border: '1px solid #D1D5DB',
                borderRadius: '0px',
              },
            },
            error: {
              style: {
                background: '#FFFFFF',
                color: '#000000',
                border: '1px solid #D1D5DB',
                borderRadius: '0px',
              },
            },
          }}
        />
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/workspace/:roomId"
            element={
              <WorkspaceRoute>
                <Workspace />
              </WorkspaceRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
