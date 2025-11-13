
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ConsolidatedLeaveRequest, LeaveRequestStatus } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { formatDateRange } from '../../utils/date';

const LeaveStatusBadge: React.FC<{ status: LeaveRequestStatus }> = ({ status }) => {
    const styles = {
        [LeaveRequestStatus.PENDING]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        [LeaveRequestStatus.APPROVED]: 'bg-green-500/20 text-green-300 border-green-500/30',
        [LeaveRequestStatus.DENIED]: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${styles[status]}`}>
            {status}
        </span>
    );
};


const LeaveRequestsView: React.FC = () => {
    const { user } = useAuth();
    const [allRequests, setAllRequests] = useState<ConsolidatedLeaveRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Store groupId of request being processed
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const data = await mockApi.getConsolidatedLeaveRequestsForLecturer(user.id);
            setAllRequests(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);
    
    const { pendingRequests, historyRequests } = useMemo(() => {
        const pending = allRequests.filter(r => r.status === LeaveRequestStatus.PENDING);
        const history = allRequests.filter(r => r.status !== LeaveRequestStatus.PENDING);
        return { pendingRequests: pending, historyRequests: history };
    }, [allRequests]);

    const handleReview = async (groupId: string, status: LeaveRequestStatus.APPROVED | LeaveRequestStatus.DENIED) => {
        setActionLoading(groupId);
        setError(null);
        try {
            await mockApi.reviewLeaveRequestsByGroup(groupId, status);
            // Refresh list after action
            await fetchRequests();
        } catch(err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(null);
        }
    }

    const requestsToDisplay = activeTab === 'pending' ? pendingRequests : historyRequests;
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Leave Requests</h1>
            <p className="text-lg text-gray-500 mb-6">Review and respond to student leave applications.</p>

            <div className="flex border-b border-purple-800/50 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${ activeTab === 'pending' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Pending ({pendingRequests.length})
                </button>
                 <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${ activeTab === 'history' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    History
                </button>
            </div>
            
            {loading ? (
                <p>Loading leave requests...</p>
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : requestsToDisplay.length === 0 ? (
                <Card className="p-8 text-center">
                    <h3 className="text-xl font-semibold">No {activeTab} leave requests.</h3>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requestsToDisplay.map(req => (
                        <Card key={req.groupId} className="p-5">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-lg text-gray-200">{req.student.name} <span className="text-sm font-mono text-gray-500">({req.student.college_id})</span></div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                Requesting leave for <span className="font-semibold text-gray-300">{formatDateRange(req.startDate, req.endDate)}</span>.
                                            </div>
                                        </div>
                                         <div className="md:hidden"><LeaveStatusBadge status={req.status} /></div>
                                    </div>
                                    
                                    <p className="mt-3 p-3 bg-black/30 rounded-md text-sm italic text-gray-300">"{req.reason}"</p>
                                    
                                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-purple-800/30">
                                        <p><span className="font-semibold">{req.periodCount}</span> period(s) across: {req.courseTitles.join(', ')}</p>
                                        {req.status !== LeaveRequestStatus.PENDING && (
                                            <p className="mt-1">Reviewed by {req.reviewed_by_name} on {new Date(req.reviewed_at!).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 shrink-0">
                                    {req.status === LeaveRequestStatus.PENDING ? (
                                        <>
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => handleReview(req.groupId, LeaveRequestStatus.DENIED)}
                                                disabled={actionLoading === req.groupId}
                                            >
                                                {actionLoading === req.groupId ? '...' : 'Deny'}
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                onClick={() => handleReview(req.groupId, LeaveRequestStatus.APPROVED)}
                                                disabled={actionLoading === req.groupId}
                                            >
                                                {actionLoading === req.groupId ? '...' : 'Approve'}
                                            </Button>
                                        </>
                                    ) : (
                                       <div className="hidden md:block"><LeaveStatusBadge status={req.status} /></div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaveRequestsView;
