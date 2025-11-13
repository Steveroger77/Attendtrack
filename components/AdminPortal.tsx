
import React, { useState } from 'react';
import Layout from './Layout';
import AdminDashboard from './AdminDashboard';
import UserManagementView from './admin/UserManagementView';
import SettingsView from './admin/SettingsView';
import AuditLogView from './admin/AuditLogView';
import LecturerAssignmentsView from './admin/LecturerAssignmentsView';
import DataImportView from './admin/DataImportView';

const AdminPortal: React.FC = () => {
    const [page, setPage] = useState('dashboard');

    const renderPage = () => {
        switch (page) {
            case 'settings':
                return <SettingsView />;
            case 'users':
                return <UserManagementView />;
            case 'audit':
                return <AuditLogView />;
            case 'assignments':
                return <LecturerAssignmentsView />;
            case 'import':
                return <DataImportView />;
            case 'dashboard':
            default:
                return <AdminDashboard setPage={setPage} />;
        }
    };

    return (
        <Layout page={page} setPage={setPage}>
            {renderPage()}
        </Layout>
    );
};

export default AdminPortal;
