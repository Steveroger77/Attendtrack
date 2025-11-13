import React, { useState, useEffect, FormEvent } from 'react';
import { SystemSettings } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';

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
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">System Settings</h1>
            <p className="text-lg text-gray-500 mb-6">Configure global application settings.</p>

            <Card className="max-w-2xl">
                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Attendance Rules</h2>
                        <div>
                            <label htmlFor="edit_window_days" className="block text-sm font-medium text-gray-300">
                                Attendance Edit Window (in days)
                            </label>
                            <input
                                id="edit_window_days"
                                name="edit_window_days"
                                type="number"
                                value={settings?.edit_window_days || ''}
                                onChange={handleInputChange}
                                required
                                min="0"
                                className="mt-1 block w-full md:w-1/2 px-3 py-2 bg-black/50 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                The number of past days a lecturer can modify attendance records. 0 means only today.
                            </p>
                        </div>
                    </div>
                    <footer className="px-6 py-4 bg-gray-900/50 rounded-b-2xl flex items-center justify-between">
                        <div>
                           {error && <p className="text-sm text-red-400">{error}</p>}
                           {success && <p className="text-sm text-green-400">{success}</p>}
                        </div>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </footer>
                </form>
            </Card>
        </div>
    );
};

export default SettingsView;
