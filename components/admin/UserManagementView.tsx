import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Role } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import RoleBadge from '../ui/RoleBadge';
import { ICONS } from '../../constants';
import UserFormModal from './UserFormModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useAuth } from '../../hooks/useAuth';

const TABS = [Role.STUDENT, Role.LECTURER, Role.ADMIN];

const UserManagementView: React.FC = () => {
    const { user: currentUser, updateCurrentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<Role>(TABS[0]);
    
    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await mockApi.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => user.role === activeTab)
            .filter(user => {
                if (!searchQuery) return true;
                return (
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.college_id.toLowerCase().includes(searchQuery.toLowerCase())
                );
            });
    }, [users, searchQuery, activeTab]);

    const handleCreate = () => {
        setSelectedUser(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsFormModalOpen(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleSaveUser = async (
        userData: Omit<User, 'id'> | (Partial<Omit<User, 'id'>> & { id: number }),
        assignments: number[]
    ) => {
        setActionLoading(true);
        setError(null);
        try {
            let savedUser: User;
            if ('id' in userData) {
                savedUser = await mockApi.updateUser(userData.id, userData);
                if (currentUser && savedUser.id === currentUser.id) {
                    updateCurrentUser(savedUser);
                }
            } else {
                savedUser = await mockApi.createUser(userData as Omit<User, 'id'>);
            }

            if (savedUser.role === Role.LECTURER) {
                await mockApi.updateLecturerAssignments(savedUser.id, assignments);
            }

            await fetchUsers(); // Refresh list
            setIsFormModalOpen(false);
        } catch (err) {
            setError((err as Error).message);
            alert((err as Error).message); // Show error to user in modal
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        setError(null);
        try {
            await mockApi.deleteUser(selectedUser.id);
            await fetchUsers(); // Refresh list
            setIsDeleteModalOpen(false);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(false);
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">User Management</h1>
            <p className="text-lg text-gray-500 mb-6">Create, view, edit, and remove users.</p>
            
            <div className="flex border-b border-purple-800/50 mb-6">
                {TABS.map(tabRole => (
                    <button
                        key={tabRole}
                        onClick={() => setActiveTab(tabRole)}
                        className={`px-6 py-3 text-sm font-medium transition-colors duration-200 capitalize ${
                            activeTab === tabRole
                                ? 'text-purple-300 border-b-2 border-purple-400'
                                : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                        }`}
                    >
                        {tabRole.toLowerCase()}s
                    </button>
                ))}
            </div>

            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-auto">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">{ICONS.search}</span>
                        <input
                            type="text"
                            placeholder="Search by name, email, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-80 pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <Button onClick={handleCreate}>Create User</Button>
                </div>
            </Card>

            <Card className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900/70 backdrop-blur-sm sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">College ID</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center p-8">Loading users...</td></tr>
                        ) : error ? (
                             <tr><td colSpan={5} className="text-center p-8 text-red-400">{error}</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-purple-900/60 hover:bg-purple-500/10">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-200 whitespace-nowrap">{user.name}</th>
                                    <td className="px-6 py-4 font-mono text-gray-400">{user.college_id}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" className="!p-2" onClick={() => handleEdit(user)}>{ICONS.pencil}</Button>
                                            <Button variant="ghost" className="!p-2 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(user)}>{ICONS.trash}</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

            <UserFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveUser}
                userToEdit={selectedUser}
                loading={actionLoading}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                user={selectedUser}
                loading={actionLoading}
            />
        </div>
    );
};

export default UserManagementView;