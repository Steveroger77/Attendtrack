
import React, { useState, useEffect, FormEvent } from 'react';
import { StudentCourseSummary, LeaveRequestStatus, StudentConsolidatedLeaveRequest } from '../../types';
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

const OverallStatusBadge: React.FC<{ status: StudentConsolidatedLeaveRequest['overallStatus'] }> = ({ status }) => {
    const styles = {
        PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        APPROVED: 'bg-green-500/20 text-green-300 border-green-500/30',
        DENIED: 'bg-red-500/20 text-red-300 border-red-500/30',
        PARTIAL: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    const text = {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        DENIED: 'Denied',
        PARTIAL: 'Partially Reviewed'
    }
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${styles[status]}`}>
            {text[status]}
        </span>
    );
}

const LeaveRequestsView: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<StudentCourseSummary[]>([]);
    const [requests, setRequests] = useState<StudentConsolidatedLeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [leaveType, setLeaveType] = useState<'single' | 'bulk'>('bulk');
    const [selectedCourseSectionId, setSelectedCourseSectionId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodIndex, setPeriodIndex] = useState('1');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm";

    const fetchAllData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const [coursesData, requestsData] = await Promise.all([
                mockApi.getStudentDashboardSummary(user.id),
                mockApi.getConsolidatedLeaveRequestsForStudent(user.id)
            ]);
            setCourses(coursesData);
            setRequests(requestsData);
            if (coursesData.length > 0 && !selectedCourseSectionId) {
                setSelectedCourseSectionId(`${coursesData[0].course_id}-${coursesData[0].section_id}`);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !reason) {
            alert("Please fill all required fields.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setSubmitSuccess(null);

        try {
            if (leaveType === 'single') {
                if (!selectedCourseSectionId || !date || !periodIndex) {
                    throw new Error("Missing fields for single period request.");
                }
                const [courseId, sectionId] = selectedCourseSectionId.split('-').map(Number);
                await mockApi.createLeaveRequest({
                    student_id: user.id,
                    course_id: courseId,
                    section_id: sectionId,
                    date,
                    period_index: parseInt(periodIndex, 10),
                    reason
                });
            } else { // bulk
                if (!startDate || !endDate) {
                    throw new Error("Missing fields for full day request.");
                }
                 if (new Date(startDate) > new Date(endDate)) {
                    throw new Error("Start date cannot be after end date.");
                }
                await mockApi.createBulkLeaveRequest(user.id, startDate, endDate, reason);
            }
            
            window.dispatchEvent(new CustomEvent('leaverequest_submitted'));

            setSubmitSuccess("Leave request submitted successfully!");
            setReason(''); // Reset reason
            await fetchAllData(); // Refresh the entire view

            setTimeout(() => setSubmitSuccess(null), 3000);
        } catch(err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">My Leave Requests</h1>
            <p className="text-lg text-gray-500 mb-6">Apply for leave and view your request history.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                         <h2 className="text-xl font-semibold p-6 border-b border-white/10">Apply for Leave</h2>
                         <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
                               <div className="flex bg-black/30 border border-white/10 rounded-lg p-1">
                                    <button type="button" onClick={() => setLeaveType('single')} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${leaveType === 'single' ? 'bg-purple-700' : 'hover:bg-purple-900/50'}`}>Single Period</button>
                                    <button type="button" onClick={() => setLeaveType('bulk')} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${leaveType === 'bulk' ? 'bg-purple-700' : 'hover:bg-purple-900/50'}`}>Full Day(s)</button>
                               </div>
                            </div>

                            {leaveType === 'single' ? (
                                <>
                                    <div>
                                        <label htmlFor="course-select" className="block text-sm font-medium text-gray-300">Course</label>
                                        <select id="course-select" value={selectedCourseSectionId} onChange={e => setSelectedCourseSectionId(e.target.value)} className={inputClasses}>
                                        {courses.map(c => (
                                            <option key={`${c.course_id}-${c.section_id}`} value={`${c.course_id}-${c.section_id}`}>{c.title}</option>
                                        ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-300">Date</label>
                                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses}/>
                                        </div>
                                        <div>
                                            <label htmlFor="period" className="block text-sm font-medium text-gray-300">Period</label>
                                            <input type="number" id="period" value={periodIndex} onChange={e => setPeriodIndex(e.target.value)} min="1" max="10" className={inputClasses}/>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Start Date</label>
                                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses}/>
                                    </div>
                                     <div>
                                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">End Date</label>
                                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className={inputClasses}/>
                                    </div>
                                </div>
                            )}

                             <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-300">Reason</label>
                                <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={4} className={inputClasses} required placeholder="e.g., Medical appointment"></textarea>
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                            {submitSuccess && <p className="text-sm text-center text-green-400">{submitSuccess}</p>}
                            {error && <p className="text-sm text-center text-red-400">{error}</p>}
                         </form>
                    </Card>
                </div>
                 <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold text-gray-200 mb-4">Request History</h2>
                    {loading ? <p>Loading history...</p> : (
                        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                            {requests.map(req => (
                                <Card key={req.groupId} className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-200">
                                                {formatDateRange(req.startDate, req.endDate)}
                                            </p>
                                            <p className="text-sm italic text-gray-500 mt-1">"{req.reason}"</p>
                                        </div>
                                        <OverallStatusBadge status={req.overallStatus} />
                                    </div>
                                    <div className="space-y-2 pt-3 border-t border-purple-800/30">
                                        {req.details.map((detail, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <p className="text-gray-300">{detail.courseTitle} <span className="text-gray-500 text-xs">({detail.lecturerName})</span></p>
                                                <LeaveStatusBadge status={detail.status} />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default LeaveRequestsView;
