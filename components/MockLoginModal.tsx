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
const FALLBACK_LOGINS: MockLoginCredential[] = [
  { name: 'tanguturi prakasam panthulu', college_id: 'L001', role: Role.LECTURER, password: 'l001pass' },
  { name: 'veereham bhakalam panthulu', college_id: 'L002', role: Role.LECTURER, password: 'l002pass' },
  { name: 'pingali venkayya', college_id: 'L003', role: Role.LECTURER, password: 'l003pass' },
  { name: 'bossu', college_id: 'L004', role: Role.LECTURER, password: 'l004pass' },
  { name: 'heisenberg', college_id: 'L005', role: Role.LECTURER, password: 'l005pass' },
  { name: 'amit', college_id: 'BT2023001', role: Role.STUDENT, password: 'bt2023001pass' },
  { name: 'jon snow', college_id: 'BT2023002', role: Role.STUDENT, password: 'bt2023002pass' },
  { name: 'pedhodu', college_id: 'BT2023003', role: Role.STUDENT, password: 'bt2023003pass' },
  { name: 'chinnodu', college_id: 'BT2023004', role: Role.STUDENT, password: 'bt2023004pass' },
  { name: 'zukir', college_id: 'BT2023005', role: Role.STUDENT, password: 'bt2023005pass' },
  { name: 'relangi Mavayya', college_id: 'ADMIN01', role: Role.ADMIN, password: 'admin01pass' }
];

let cachedLogins: MockLoginCredential[] | null = FALLBACK_LOGINS;
let isPrefetching = false;

// Proactively kick off prefetch when the bundler loads this file
const prefetchMockLogins = async () => {
  if (isPrefetching) return;
  isPrefetching = true;
  try {
    const data = await mockApi.getMockLoginDetails();
    if (data && data.length > 0) {
      cachedLogins = data;
    }
  } catch (e) {
    console.warn('Silent live prefetch failed, using offline fallback credentials:', e);
  } finally {
    isPrefetching = false;
  }
};
prefetchMockLogins();

const MockLoginModal: React.FC<MockLoginModalProps> = ({ isOpen, onClose }) => {
  const [logins, setLogins] = useState<MockLoginCredential[]>(cachedLogins || FALLBACK_LOGINS);
  const [loading, setLoading] = useState(false); // No loading spinner needed since we have fallbacks immediately

  useEffect(() => {
    if (isOpen) {
      const fetchLogins = async () => {
        try {
          const data = await mockApi.getMockLoginDetails();
          if (data && data.length > 0) {
            cachedLogins = data;
            setLogins(data);
          }
        } catch (error) {
          console.warn("Failed to refresh mock logins from DB, continuing with cached/fallback credentials", error);
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