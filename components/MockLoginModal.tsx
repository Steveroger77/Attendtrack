import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { mockApi } from '../services/api';
import { Role } from '../types';
import RoleBadge from './ui/RoleBadge';
import Button from './ui/Button';

interface MockLoginCredential {
  name: string;
  college_id: string;
  password?: string;
  role: Role;
}

interface MockLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Button variant="ghost" className="!text-xs !px-2 !py-1 font-sans-default" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
        </Button>
    );
};

// Module-level cache to make retrieval instantaneous on subsequent openings
let cachedLogins: MockLoginCredential[] | null = null;
let isPrefetching = false;

// Proactively kick off prefetch when the bundler loads this file
const prefetchMockLogins = async () => {
  if (cachedLogins || isPrefetching) return;
  isPrefetching = true;
  try {
    const data = await mockApi.getMockLoginDetails();
    cachedLogins = data;
  } catch (e) {
    console.warn('Silent prefetch failed, will retry on open:', e);
  } finally {
    isPrefetching = false;
  }
};
prefetchMockLogins();

const MockLoginModal: React.FC<MockLoginModalProps> = ({ isOpen, onClose }) => {
  const [logins, setLogins] = useState<MockLoginCredential[]>(cachedLogins || []);
  const [loading, setLoading] = useState(!cachedLogins);

  useEffect(() => {
    if (isOpen) {
      if (cachedLogins) {
        setLogins(cachedLogins);
        setLoading(false);
        return;
      }

      const fetchLogins = async () => {
        setLoading(true);
        try {
          const data = await mockApi.getMockLoginDetails();
          cachedLogins = data;
          setLogins(data);
        } catch (error) {
          console.error("Failed to fetch mock logins", error);
        } finally {
          setLoading(false);
        }
      };
      fetchLogins();
    }
  }, [isOpen]);

  const groupedLogins = logins.reduce((acc, user) => {
    (acc[user.role] = acc[user.role] || []).push(user);
    return acc;
  }, {} as Record<Role, MockLoginCredential[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mock User Login Details">
      <div className="p-4 transition-all duration-300 ease-in-out">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 font-medium">Retrieving secure sandbox credentials...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {Object.values(Role).map(role => (
              groupedLogins[role] && (
                <div key={role}>
                  <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                    <RoleBadge role={role} />
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-black/30">
                        <tr>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">College ID</th>
                          <th className="px-4 py-2">Password</th>
                        </tr>
                      </thead>
      
                      <tbody>
                        {groupedLogins[role].map(user => (
                          <tr key={user.college_id} className="border-b border-white/10">
                            <td className="px-4 py-2 font-medium">{user.name}</td>
                            <td className="px-4 py-2 font-mono">
                                <div className="flex items-center justify-between">
                                    <span>{user.college_id}</span>
                                    <CopyButton textToCopy={user.college_id} />
                                </div>
                            </td>
                            <td className="px-4 py-2 font-mono">
                               <div className="flex items-center justify-between">
                                    <span>{user.password}</span>
                                    <CopyButton textToCopy={user.password || ''} />
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MockLoginModal;