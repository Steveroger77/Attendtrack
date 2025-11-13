import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { TimetableEntry } from '../../types';

interface EditTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: TimetableEntry) => Promise<void>;
  entry: TimetableEntry;
}

const EditTimetableModal: React.FC<EditTimetableModalProps> = ({ isOpen, onClose, onSave, entry }) => {
  const [formData, setFormData] = useState(entry);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(entry);
  }, [entry]);
  
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'day_of_week' || name === 'period_index' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };
  
  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit: ${entry.course.title}`}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-300">Day of Week</label>
            <select name="day_of_week" id="day_of_week" value={formData.day_of_week} onChange={handleChange} className={inputClasses}>
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="period_index" className="block text-sm font-medium text-gray-300">Period Index</label>
            <input type="number" name="period_index" id="period_index" value={formData.period_index} onChange={handleChange} required min="1" max="10" className={inputClasses} />
          </div>
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-300">Start Time</label>
            <input type="time" name="start_time" id="start_time" value={formData.start_time} onChange={handleChange} required className={inputClasses} />
          </div>
           <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-300">End Time</label>
            <input type="time" name="end_time" id="end_time" value={formData.end_time} onChange={handleChange} required className={inputClasses} />
          </div>
        </div>
        <footer className="px-6 py-4 bg-black/40 border-t border-white/10 rounded-b-3xl flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </footer>
      </form>
    </Modal>
  );
};

export default EditTimetableModal;