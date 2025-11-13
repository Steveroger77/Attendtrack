import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, Role, Course, Section } from '../../types';
import { mockApi } from '../../services/api';

interface CourseSection {
  course: Course;
  section: Section;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    user: Omit<User, 'id'> | (Partial<Omit<User, 'id'>> & { id: number }),
    assignments: number[]
  ) => Promise<void>;
  userToEdit?: User | null;
  loading: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college_id: '',
    role: Role.STUDENT,
  });

  // State for lecturer assignments
  const [allCourseSections, setAllCourseSections] = useState<CourseSection[]>([]);
  const [assignedSections, setAssignedSections] = useState<Set<number>>(new Set());
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const isEditMode = !!userToEdit;
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm";


  useEffect(() => {
    const fetchAssignments = async () => {
      if (formData.role !== Role.LECTURER) return;

      setLoadingAssignments(true);
      try {
        const [allData, assignedData] = await Promise.all([
          mockApi.getAllCoursesAndSections(),
          isEditMode ? mockApi.getAssignedSectionsForLecturer(userToEdit.id) : Promise.resolve([]),
        ]);
        setAllCourseSections(allData);
        setAssignedSections(new Set(assignedData));
      } catch (error) {
        console.error("Failed to load assignments", error);
      } finally {
        setLoadingAssignments(false);
      }
    };

    if (isOpen) {
      if (isEditMode) {
        setFormData({
          name: userToEdit.name,
          email: userToEdit.email,
          college_id: userToEdit.college_id,
          role: userToEdit.role,
        });
      } else {
        setFormData({ name: '', email: '', college_id: '', role: Role.STUDENT });
        setAssignedSections(new Set()); // Reset on create
      }
      fetchAssignments();
    }
  }, [userToEdit, isEditMode, isOpen, formData.role]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAssignmentChange = (sectionId: number) => {
    setAssignedSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) {
            newSet.delete(sectionId);
        } else {
            newSet.add(sectionId);
        }
        return newSet;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = isEditMode ? { ...formData, id: userToEdit.id } : formData;
    const assignments = formData.role === Role.LECTURER ? Array.from(assignedSections) : [];
    onSave(payload, assignments);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit User' : 'Create New User'}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputClasses} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="college_id" className="block text-sm font-medium text-gray-300">College ID</label>
                <input type="text" name="college_id" id="college_id" value={formData.college_id} onChange={handleChange} required className={inputClasses} />
              </div>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
            <select name="role" id="role" value={formData.role} onChange={handleChange} className={inputClasses}>
              {Object.values(Role).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          {formData.role === Role.LECTURER && (
            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-300">Subject Assignments</label>
                {loadingAssignments ? <p className="text-sm text-gray-500 mt-2">Loading subjects...</p> : (
                <div className="mt-2 p-3 border border-gray-700 rounded-md max-h-48 overflow-y-auto space-y-2 bg-black/30">
                    {allCourseSections.map(({ course, section }) => (
                        <div key={section.id} className="flex items-center">
                           <input
                                id={`section-${section.id}`}
                                type="checkbox"
                                checked={assignedSections.has(section.id)}
                                onChange={() => handleAssignmentChange(section.id)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-600"
                            />
                            <label htmlFor={`section-${section.id}`} className="ml-3 text-sm text-gray-300">
                                {course.title} - Section {section.section_name}
                            </label>
                        </div>
                    ))}
                </div>
                )}
            </div>
          )}
        </div>
        <footer className="px-6 py-4 bg-black/40 border-t border-white/10 rounded-b-3xl flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save User'}</Button>
        </footer>
      </form>
    </Modal>
  );
};

export default UserFormModal;