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
        <Button variant="ghost" className="!text-xs !px-2 !py-1" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
        </Button>
    );
};

const MockLoginModal: React.FC<MockLoginModalProps> = ({ isOpen, onClose }) => {
  const [logins, setLogins] = useState<MockLoginCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchLogins = async () => {
        setLoading(true);
        try {
          const data = await mockApi.getMockLoginDetails();
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
      <div className="p-4">
        {loading ? (
          <p>Loading details...</p>
        ) : (
          <div className="space-y-6">
            {Object.values(Role).map(role => (
              groupedLogins[role] && (
                <div key={role}>
                  <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                    <RoleBadge role={role} /> {role.charAt(0) + role.slice(1).toLowerCase()}s
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