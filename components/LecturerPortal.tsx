
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import DashboardView from './lecturer/DashboardView';
import TimetableView from './lecturer/TimetableView';
import MarkingView from './lecturer/MarkingView';
import ReportsView from './lecturer/ReportsView';
import LeaveRequestsView from './lecturer/LeaveRequestsView';
import AnnouncementsView from './lecturer/AnnouncementsView';
import { useAuth } from '../hooks/useAuth';
import { mockApi } from '../services/api';

const LecturerPortal: React.FC = () => {
    const { user } = useAuth();
    const [page, setPage] = useState('dashboard');
    const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const fetchCount = async () => {
            try {
                const count = await mockApi.getPendingLeaveRequestCount(user.id);
                setPendingLeaveCount(count);
            } catch (e) {
                console.error("Failed to fetch pending leave count", e);
            }
        };
        
        fetchCount(); // Initial fetch
        const intervalId = setInterval(fetchCount, 10000); // Poll every 10 seconds

        // Listen for custom event to trigger an immediate refetch
        const handleRefetch = () => fetchCount();
        window.addEventListener('leaverequest_submitted', handleRefetch);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('leaverequest_submitted', handleRefetch);
        };
    }, [user]);


    const renderPage = () => {
        switch (page) {
            case 'timetable':
                return <TimetableView />;
            case 'marking':
                return <MarkingView />;
            case 'reports':
                return <ReportsView />;
            case 'leave':
                return <LeaveRequestsView />;
            case 'announcements':
                return <AnnouncementsView />;
            case 'dashboard':
            default:
                return <DashboardView />;
        }
    };

    return (
        <Layout page={page} setPage={setPage} pendingLeaveCount={pendingLeaveCount}>
            {renderPage()}
        </Layout>
    );
};

export default LecturerPortal;
