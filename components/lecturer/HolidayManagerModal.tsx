import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Holiday } from '../../types';
import { mockApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ICONS } from '../../constants';

interface HolidayManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HolidayManagerModal: React.FC<HolidayManagerModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newReason, setNewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm";

  const fetchHolidays = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await mockApi.getLecturerHolidays(user.id);
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHolidays(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHolidays();
    }
  }, [isOpen, user]);

  const handleAddHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDate || !newReason) {
      alert("Please provide both a date and a reason.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await mockApi.addHoliday(newDate, newReason);
      setNewDate(new Date().toISOString().split('T')[0]);
      setNewReason('');
      await fetchHolidays(); // Refresh list
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteHoliday = async (holidayId: number) => {
    if (!window.confirm("Are you sure you want to remove this holiday?")) return;
    setError(null);
    try {
      await mockApi.removeHoliday(holidayId);
      await fetchHolidays(); // Refresh list
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Holidays & Non-Teaching Days">
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Holiday Form */}
        <div className="md:col-span-1 p-4 bg-gray-900/50 rounded-lg border border-purple-800/30">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Add New Holiday</h3>
            <form onSubmit={handleAddHoliday} className="space-y-4">
                <div>
                    <label htmlFor="holiday-date" className="block text-sm font-medium text-gray-400">Date</label>
                    <input type="date" id="holiday-date" value={newDate} onChange={e => setNewDate(e.target.value)} required className={inputClasses}/>
                </div>
                 <div>
                    <label htmlFor="holiday-reason" className="block text-sm font-medium text-gray-400">Reason</label>
                    <input type="text" id="holiday-reason" value={newReason} onChange={e => setNewReason(e.target.value)} required placeholder="e.g., College Fest" className={inputClasses} />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Adding...' : 'Add Holiday'}
                </Button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </form>
        </div>
        
        {/* Holiday List */}
        <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Scheduled Holidays</h3>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                 {loading ? <p>Loading holidays...</p> : 
                    holidays.length === 0 ? <p className="text-gray-500 italic">You have not added any holidays yet.</p> :
                    <ul className="space-y-3">
                        {holidays.map(holiday => (
                            <li key={holiday.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-200">{new Date(holiday.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                                    <p className="text-sm text-gray-400">{holiday.reason}</p>
                                </div>
                                <Button variant="ghost" className="!p-2 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteHoliday(holiday.id)}>
                                    {ICONS.trash}
                                </Button>
                            </li>
                        ))}
                    </ul>
                 }
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default HolidayManagerModal;