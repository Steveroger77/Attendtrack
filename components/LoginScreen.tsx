
import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from './ui/Card';
import Button from './ui/Button';
import MockLoginModal from './MockLoginModal';
import FeatureTourModal from './FeatureTourModal';
import { ICONS } from '../constants';
import Tooltip from './ui/Tooltip';

const LoginScreen: React.FC = () => {
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  
  const InfoIcon = React.cloneElement(ICONS.info, { className: 'h-6 w-6' });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(collegeId, password);
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 left-4 z-20">
        <Tooltip text="App Features">
            <button
              onClick={() => setIsFeatureModalOpen(true)}
              className="h-12 w-12 flex items-center justify-center rounded-full bg-black/40 text-gray-400 hover:text-white hover:bg-purple-700 transition-colors duration-200 outline outline-2 outline-transparent"
              aria-label="Show features"
            >
              {InfoIcon}
            </button>
        </Tooltip>
      </div>

      <Card className="w-full max-w-sm p-8 space-y-6 shadow-purple-900/50">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-gray-200">
                AttendTrack
            </h1>
            <p className="text-gray-500 mt-2">BTech College Attendance System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="collegeId" className="block text-sm font-medium text-gray-300">
              College ID
            </label>
            <input
              id="collegeId"
              type="text"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              placeholder="e.g., L001 or BT2023001"
              required
              className="mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <Button
              type="submit"
              disabled={!collegeId || !password || loading}
              className="w-full"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsMockModalOpen(true)}
              className="w-full mt-4"
            >
              View Mock Login Details
            </Button>
          </div>
        </form>
      </Card>
      <MockLoginModal isOpen={isMockModalOpen} onClose={() => setIsMockModalOpen(false)} />
      <FeatureTourModal isOpen={isFeatureModalOpen} onClose={() => setIsFeatureModalOpen(false)} />
    </div>
  );
};

export default LoginScreen;
