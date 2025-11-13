
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Course, Section, TimetableEntry, Role } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface CourseSection {
  course: Course;
  section: Section;
}

const LecturerAssignmentsView: React.FC = () => {
    const [lecturers, setLecturers] = useState<User[]>([]);
    const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
    const [assignments, setAssignments] = useState<Record<number, number | null>>({});
    const [initialAssignments, setInitialAssignments] = useState<Record<number, number | null>>({});
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [users, sections, timetable] = await Promise.all([
                mockApi.getAllUsers(),
                mockApi.getAllCoursesAndSections(),
                mockApi.getFullTimetable()
            ]);

            setLecturers(users.filter(u => u.role === Role.LECTURER));
            setCourseSections(sections);

            const assignmentsMap: Record<number, number | null> = {};
            sections.forEach(cs => {
                const entry = timetable.find(t => t.section_id === cs.section.id);
                assignmentsMap[cs.section.id] = entry?.lecturer_id ?? null;
            });
            
            setAssignments(assignmentsMap);
            setInitialAssignments(assignmentsMap);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isDirty = useMemo(() => {
        return JSON.stringify(assignments) !== JSON.stringify(initialAssignments);
    }, [assignments, initialAssignments]);

    const handleAssignmentChange = (sectionId: number, lecturerId: number | null) => {
        setAssignments(prev => ({
            ...prev,
            [sectionId]: lecturerId,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await mockApi.updateAllAssignments(assignments);
            // Refresh data to confirm save and reset dirty state
            await fetchData();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Loading assignment data...</p>;
    if (error) return <p className="text-red-400">{error}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-200">Lecturer Assignments</h1>
                    <p className="text-lg text-gray-500">Assign lecturers to course sections.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={!isDirty || saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
            
            <Card className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900/70 backdrop-blur-sm sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3 sticky left-0 bg-gray-900/70 backdrop-blur-sm">Course / Section</th>
                            {lecturers.map(lecturer => (
                                <th key={lecturer.id} scope="col" className="px-6 py-3 text-center">{lecturer.name}</th>
                            ))}
                            <th scope="col" className="px-6 py-3 text-center">Unassigned</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courseSections.map(({ course, section }) => (
                            <tr key={section.id} className="border-b border-purple-900/60 hover:bg-purple-500/10">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-200 whitespace-nowrap sticky left-0 bg-black/80 backdrop-blur-sm">
                                    {course.title} <span className="text-gray-500">({section.section_name})</span>
                                </th>
                                {lecturers.map(lecturer => (
                                    <td key={lecturer.id} className="px-6 py-4 text-center">
                                        <input
                                            type="radio"
                                            name={`section-${section.id}`}
                                            value={lecturer.id}
                                            checked={assignments[section.id] === lecturer.id}
                                            onChange={() => handleAssignmentChange(section.id, lecturer.id)}
                                            className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-600 focus:ring-2"
                                        />
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="radio"
                                        name={`section-${section.id}`}
                                        checked={assignments[section.id] === null || assignments[section.id] === -1}
                                        onChange={() => handleAssignmentChange(section.id, null)}
                                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-600 focus:ring-2"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default LecturerAssignmentsView;
