import React, { useState, useEffect, useMemo } from 'react';
import { CourseReport } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';
import { ICONS } from '../../constants';

const getISODateString = (date: Date) => date.toISOString().split('T')[0];

const ReportsView: React.FC = () => {
    const [reports, setReports] = useState<CourseReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Date filter state
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState<string>(getISODateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState<string>(getISODateString(today));

    useEffect(() => {
        const fetchReports = async () => {
            if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
                setReports([]);
                return;
            }
            setLoading(true);
            try {
                const data = await mockApi.getLecturerAttendanceReports(startDate, endDate);
                setReports(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [startDate, endDate]);

    const filteredReports = useMemo(() => {
        if (!searchQuery) {
            return reports;
        }
        return reports.filter(report =>
            report.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.course.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reports, searchQuery]);

    const handleExport = () => {
        if (filteredReports.length === 0) return;

        const headers = ["Course Title", "Course Code", "Section", "Attendance Percentage", "Marked Classes", "Total Possible Classes"];
        const csvHeader = headers.join(',') + '\n';

        const csvRows = filteredReports.map(report => {
            const row = [
                `"${report.course.title}"`,
                report.course.code,
                report.section.section_name,
                report.attendance_percentage,
                report.total_marked,
                report.total_possible
            ];
            return row.join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const setPresetDateRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        setStartDate(getISODateString(start));
        setEndDate(getISODateString(end));
    };

    const setThisMonth = () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(getISODateString(start));
        setEndDate(getISODateString(today));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Attendance Reports</h1>
            <p className="text-lg text-gray-500 mb-6">Overall attendance summary for your courses.</p>
            
            <Card className="p-4 mb-6">
                 <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4">
                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div>
                            <label htmlFor="startDate" className="text-xs font-medium text-gray-400">Start Date</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate} className="mt-1 block w-full bg-black/30 border border-white/10 rounded-lg shadow-sm text-sm p-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="text-xs font-medium text-gray-400">End Date</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="mt-1 block w-full bg-black/30 border border-white/10 rounded-lg shadow-sm text-sm p-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500" />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                            <Button variant="ghost" className="!text-xs !py-1" onClick={() => setPresetDateRange(7)}>Last 7 Days</Button>
                            <Button variant="ghost" className="!text-xs !py-1" onClick={() => setPresetDateRange(30)}>Last 30 Days</Button>
                            <Button variant="ghost" className="!text-xs !py-1" onClick={setThisMonth}>This Month</Button>
                        </div>
                    </div>

                    {/* Search and Export */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">{ICONS.search}</span>
                            <input
                                type="text"
                                placeholder="Search course..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <Button onClick={handleExport} disabled={filteredReports.length === 0 || loading} variant="secondary">
                            {ICONS.export}
                            Export CSV
                        </Button>
                    </div>
                 </div>
            </Card>

            {loading && <p>Loading reports...</p>}
            {error && <p className="text-red-400">{error}</p>}
            
            {!loading && filteredReports.length === 0 && (
                <Card className="p-8 text-center">
                    <h3 className="text-xl font-semibold">No attendance reports found.</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
                </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredReports.map(report => (
                    <Card key={`${report.course.id}-${report.section.id}`} className="p-6">
                        <h3 className="text-xl font-bold">{report.course.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{report.course.code} - Section {report.section.section_name}</p>

                        <div className="flex items-center justify-between mb-1">
                            <span className="text-base font-medium text-gray-200">Overall Attendance</span>
                             <span className={`text-xl font-bold ${report.attendance_percentage >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {report.attendance_percentage}%
                            </span>
                        </div>
                        <ProgressBar percentage={report.attendance_percentage} />
                        <p className="text-xs text-gray-500 text-right mt-1">
                            Based on {report.total_marked} attendances / {report.total_possible} possible
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ReportsView;