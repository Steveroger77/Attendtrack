import React, { useState, useEffect, useMemo } from 'react';
import { FullAuditEvent } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import { STATUS_STYLES } from '../../constants';

const getISODateString = (date: Date) => date.toISOString().split('T')[0];

const AuditStatusBadge: React.FC<{ status: FullAuditEvent['new_status'] | FullAuditEvent['old_status'] }> = ({ status }) => {
    if (status === null) {
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300 border border-gray-600">UNMARKED</span>
    }
    const style = STATUS_STYLES[status];
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${style.color}`}>
            {style.label}
        </span>
    );
};


const AuditLogView: React.FC = () => {
    const [auditLogs, setAuditLogs] = useState<FullAuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const [startDate, setStartDate] = useState<string>(getISODateString(sevenDaysAgo));
    const [endDate, setEndDate] = useState<string>(getISODateString(today));

    useEffect(() => {
        const fetchAuditLogs = async () => {
            setLoading(true);
            try {
                const data = await mockApi.getSystemAuditLogs();
                setAuditLogs(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchAuditLogs();
    }, []);
    
    const filteredLogs = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return auditLogs.filter(log => {
            const logDate = new Date(log.changed_at);
            return logDate >= start && logDate <= end;
        });
    }, [auditLogs, startDate, endDate]);


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">System Audit Log</h1>
            <p className="text-lg text-gray-500 mb-6">Tracking all attendance modifications across the system.</p>
            
            <Card className="p-4 mb-6">
                 <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div>
                            <label htmlFor="startDate" className="text-xs font-medium text-gray-400">Start Date</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate} className="mt-1 block w-full bg-black/30 border border-white/10 rounded-lg shadow-sm text-sm p-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="text-xs font-medium text-gray-400">End Date</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="mt-1 block w-full bg-black/30 border border-white/10 rounded-lg shadow-sm text-sm p-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500" />
                        </div>
                    </div>
                 </div>
            </Card>

            <Card className="overflow-x-auto">
                 <table className="w-full min-w-[768px] text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900/70 backdrop-blur-sm sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">Student</th>
                            <th scope="col" className="px-6 py-3">Course</th>
                            <th scope="col" className="px-6 py-3">Changed By</th>
                            <th scope="col" className="px-6 py-3 text-center">Change</th>
                        </tr>
                    </thead>
                    <tbody>
                         {loading ? (
                            <tr><td colSpan={5} className="text-center p-8">Loading audit logs...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={5} className="text-center p-8 text-red-400">{error}</td></tr>
                        ) : filteredLogs.length === 0 ? (
                             <tr><td colSpan={5} className="text-center p-8">No audit logs found for the selected date range.</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id} className="border-b border-purple-900/60 hover:bg-purple-500/10">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                                        {new Date(log.changed_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-200">{log.student_name}</div>
                                        <div className="text-gray-500 font-mono text-xs">{log.student_college_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-200">{log.course_title}</div>
                                        <div className="text-gray-500 text-xs">{log.course_code} - Sec {log.section_name}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-200">{log.changer_name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <AuditStatusBadge status={log.old_status} />
                                            <span>&rarr;</span>
                                            <AuditStatusBadge status={log.new_status} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                 </table>
            </Card>
        </div>
    );
};

export default AuditLogView;