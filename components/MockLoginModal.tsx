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
  const [error, setError] = useState<string | null>(null);

  const fetchLogins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockApi.getMockLoginDetails();
      if (Array.isArray(data)) {
        setLogins(data);
      } else {
        throw new Error("Received invalid data format from server.");
      }
    } catch (err: any) {
      console.error("Failed to fetch mock logins", err);
      setError(err?.message || "Failed to fetch mock credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogins();
    }
  }, [isOpen]);

  const groupedLogins = logins.reduce((acc, user) => {
    if (user) {
      const rawRole = user.role || 'STUDENT';
      const roleKey = String(rawRole).toUpperCase() as Role;
      (acc[roleKey] = acc[roleKey] || []).push({
        ...user,
        role: roleKey
      });
    }
    return acc;
  }, {} as Record<Role, MockLoginCredential[]>);

  const rolesList = Object.keys(groupedLogins) as Role[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mock User Login Details">
      <div className="p-4">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading details...</p>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">
              Error: {error}
            </p>
            <Button onClick={fetchLogins} className="!px-4 !py-2 bg-purple-600 hover:bg-purple-700">
              Retry Loader
            </Button>
          </div>
        ) : logins.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">
              No mock credentials found on server.
            </p>
            <Button onClick={fetchLogins} className="!px-4 !py-2 bg-purple-600 hover:bg-purple-700">
              Retry Loader
            </Button>
          </div>
        ) : rolesList.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm font-medium">All Mock Accounts:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-black/30">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">College ID</th>
                    <th className="px-4 py-2">Password</th>
                    <th className="px-4 py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.map((user, idx) => (
                    <tr key={user.college_id || idx} className="border-b border-white/10">
                      <td className="px-4 py-2 font-medium">{user.name}</td>
                      <td className="px-4 py-2 font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <span>{user.college_id}</span>
                          <CopyButton textToCopy={user.college_id} />
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <span>{user.password}</span>
                          <CopyButton textToCopy={user.password || ''} />
                        </div>
                      </td>
                      <td className="px-4 py-2 capitalize">{String(user.role).toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {rolesList.map(role => (
              groupedLogins[role] && groupedLogins[role].length > 0 && (
                <div key={role}>
                  <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                    <RoleBadge role={role} /> {String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase()}s
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
                        {groupedLogins[role].map((user, idx) => (
                          <tr key={user.college_id || idx} className="border-b border-white/10">
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