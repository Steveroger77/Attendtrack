import React, { useState, useEffect, FormEvent } from 'react';
import { SystemSettings } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Shield, Database, Lock, FileText } from 'lucide-react';

const SettingsView: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const data = await mockApi.getSystemSettings();
                setSettings(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await mockApi.updateSystemSettings(settings);
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings({
            ...settings,
            [name]: value === '' ? '' : Number(value),
        });
    };
    
    if (loading) return <p>Loading settings...</p>;
    if (error && !settings) return <p className="text-red-400">{error}</p>;

    return (
        <div className="max-w-6xl">
            <h1 className="text-3xl font-bold text-gray-200 mb-2">System Settings</h1>
            <p className="text-lg text-gray-500 mb-6 font-sans">Configure global application rules and review system policies.</p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Rules Form Column */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="w-full">
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                                    <span className="p-1 px-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm">⚙️</span>
                                    Attendance Rules
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="edit_window_days" className="block text-sm font-medium text-gray-300">
                                            Attendance Edit Window (in days)
                                        </label>
                                        <input
                                            id="edit_window_days"
                                            name="edit_window_days"
                                            type="number"
                                            value={settings?.edit_window_days !== undefined ? settings.edit_window_days : ''}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            className="mt-1 block w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-200"
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500 font-sans">
                                            The number of past days a lecturer can modify attendance records. 0 means only today.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="required_attendance_percentage" className="block text-sm font-medium text-gray-300">
                                            Required Attendance Threshold (%)
                                        </label>
                                        <input
                                            id="required_attendance_percentage"
                                            name="required_attendance_percentage"
                                            type="number"
                                            value={settings?.required_attendance_percentage !== undefined ? settings.required_attendance_percentage : 75}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            max="100"
                                            className="mt-1 block w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-200"
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500 font-sans">
                                            The minimum attendance required to clear a course (default: 75%). Falling below this causes a critical alert.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="warning_attendance_percentage" className="block text-sm font-medium text-gray-300">
                                            Warning Attendance Threshold (%)
                                        </label>
                                        <input
                                            id="warning_attendance_percentage"
                                            name="warning_attendance_percentage"
                                            type="number"
                                            value={settings?.warning_attendance_percentage !== undefined ? settings.warning_attendance_percentage : 80}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            max="100"
                                            className="mt-1 block w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-200"
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500 font-sans">
                                            The threshold under which users are warned about near-critical attendance levels (default: 80%).
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <footer className="px-6 py-4 bg-gray-900/50 rounded-b-2xl flex items-center justify-between">
                                <div className="max-w-[150px] sm:max-w-xs truncate">
                                   {error && <p className="text-sm text-red-400 truncate">{error}</p>}
                                   {success && <p className="text-sm text-green-400 truncate">{success}</p>}
                                </div>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </footer>
                        </form>
                    </Card>
                </div>

                {/* Privacy Policy Column */}
                <div className="lg:col-span-7">
                    <Card className="w-full">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <span className="p-2 bg-purple-500/15 text-purple-400 rounded-xl">
                                    <Shield className="h-6 w-6" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-200">Application Privacy Policy</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Understand how AttendTrack processes & protects user data.</p>
                                </div>
                            </div>

                            <div className="space-y-5 text-sm text-gray-300">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-purple-300 flex items-center gap-1.5">
                                        <Database className="h-4 w-4 text-purple-400" />
                                        1. Data We Process & Retain
                                    </h3>
                                    <p className="text-xs leading-relaxed text-gray-400">
                                        To maintain absolute accuracy in academic rosters, AttendTrack processes:
                                    </p>
                                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-400">
                                        <li><strong className="text-gray-300">Identity Records:</strong> Name, institutional Email, unique College ID, and User role (Student, Lecturer, or Admin).</li>
                                        <li><strong className="text-gray-300">Academic Schedules:</strong> Assigned courses, timetable configurations, and lecturer pairings.</li>
                                        <li><strong className="text-gray-300">Attendance Data:</strong> Daily roll-call entries (Present, Late, Absent, Excused) with precise modification logs and timestamps.</li>
                                        <li><strong className="text-gray-300">Leave Documentation:</strong> Notes, explanatory justifications, and supportive files uploaded by students for absence validation.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-purple-300 flex items-center gap-1.5">
                                        <Lock className="h-4 w-4 text-purple-400" />
                                        2. Access Controls & Protection Shields
                                    </h3>
                                    <p className="text-xs leading-relaxed text-gray-400">
                                        All information collected is processed under strict institutional boundaries and protected by robust security measures:
                                    </p>
                                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-400">
                                        <li><strong className="text-gray-300">Role-Based Access Control (RBAC):</strong> Student views are strictly sandboxed—they can only view their own individual record. Lecturers can only edit student sheets within the administrative <span className="font-semibold text-purple-400">{settings?.edit_window_days ?? 2}-day edit window</span>.</li>
                                        <li><strong className="text-gray-300">Transport Layer Security (HSTS):</strong> The application executes HTTPS transport exclusively, using an active <em className="font-mono text-purple-400">Strict-Transport-Security</em> header config to stop any protocol downgrade vectors.</li>
                                        <li><strong className="text-gray-300">Content Integrity & Security Headers:</strong> Enhanced browser-level safeguards prevent structural injection and MIME attacks via fully integrated <em className="font-mono text-purple-400">Content-Security-Policy (CSP)</em> and <em className="font-mono text-purple-400">X-Content-Type-Options: nosniff</em> defenses.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-purple-300 flex items-center gap-1.5">
                                        <FileText className="h-4 w-4 text-purple-400" />
                                        3. Processing Objectives & Thresholds
                                    </h3>
                                    <p className="text-xs leading-relaxed text-gray-400">
                                        Roster tracking serves purely academic compliance purposes. It is processed to:
                                    </p>
                                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-400">
                                        <li>Automatically analyze attendance safety levels relative to the institutional <span className="font-semibold text-purple-400">{settings?.required_attendance_percentage ?? 75}% compliance threshold</span>.</li>
                                        <li>Dispatch student warning flags if overall module attendance slips below <span className="font-semibold text-purple-400">{settings?.warning_attendance_percentage ?? 80}%</span>.</li>
                                        <li>Log an immutable ledger audit trail showing precisely when and by whom attendance states were modified.</li>
                                        <li>Retain schedules and absence notes strictly for the duration of the current academic year, after which they are archived or purged according to college retention schedules.</li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                                    <h4 className="text-xs font-semibold text-purple-300 mb-1">Administrative Privacy Notice</h4>
                                    <p className="text-[11px] text-gray-400 leading-normal">
                                        This system enforces compliance with GDPR and academic records guidelines. Raw log entry audits protect against arbitrary entries, and file verification paths remain strictly private to authorized departmental staff. No metrics are traded for marketing or advertising purposes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
