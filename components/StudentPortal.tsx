
import React, { useState } from 'react';
import Layout from './Layout';
import StudentDashboard from './StudentDashboard';
import StudentTimetableView from './student/TimetableView';
import LeaveRequestsView from './student/LeaveRequestsView';

const StudentPortal: React.FC = () => {
    const [page, setPage] = useState('dashboard');

    const renderPage = () => {
        switch (page) {
            case 'timetable':
                return <StudentTimetableView />;
            case 'leave':
                return <LeaveRequestsView />;
            case 'dashboard':
            default:
                return <StudentDashboard />;
        }
    };

    return (
        <Layout page={page} setPage={setPage}>
            {renderPage()}
        </Layout>
    );
};

export default StudentPortal;
