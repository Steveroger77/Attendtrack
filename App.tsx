
import React, { useState, useCallback, useMemo } from 'react';
import { User, Role } from './types';
import { mockApi } from './services/api';
import LoginScreen from './components/LoginScreen';
import LecturerPortal from './components/LecturerPortal';
import StudentPortal from './components/StudentPortal';
import AdminPortal from './components/AdminPortal';
import LightRays from './components/ui/LightRays';
import ErrorBoundary from './components/ErrorBoundary';
// FIX: Import AuthContext to be used in the provider.
import { AuthContext } from './hooks/useAuth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        mockApi.setCurrentUser(user); // Sync the API service state
        return user;
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('currentUser');
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const login = useCallback(async (collegeId: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await mockApi.login(collegeId, password);
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    mockApi.logout();
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const updateCurrentUser = useCallback((newDetails: Partial<User>) => {
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...newDetails };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        mockApi.setCurrentUser(updatedUser);
        return updatedUser;
    });
  }, []);

  const authContextValue = useMemo(() => ({
    user: currentUser,
    login,
    logout,
    loading,
    error,
    updateCurrentUser,
  }), [currentUser, login, logout, loading, error, updateCurrentUser]);

  const renderDashboard = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case Role.LECTURER:
        return <LecturerPortal />;
      case Role.STUDENT:
        return <StudentPortal />;
      case Role.ADMIN:
        return <AdminPortal />;
      default:
        return <div>Invalid user role.</div>;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-black">
        {!currentUser ? (
          <div className="relative w-full h-screen overflow-hidden">
             <LightRays
                raysOrigin="top-center"
                raysColor="#ffffff"
                raysSpeed={1.0}
                lightSpread={0.9}
                rayLength={1.8}
                followMouse={true}
                mouseInfluence={0.1}
                noiseAmount={0.05}
                distortion={0.02}
                className="absolute inset-0 z-0"
              />
            <LoginScreen />
          </div>
        ) : (
          <ErrorBoundary>
            {renderDashboard()}
          </ErrorBoundary>
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default App;