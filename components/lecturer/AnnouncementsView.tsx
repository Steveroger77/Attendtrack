import React, { useState, useEffect, FormEvent } from 'react';
import { Course, Section } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

const AnnouncementsView: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<{ course: Course; section: Section; id: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedCourseSectionId, setSelectedCourseSectionId] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const data = await mockApi.getLecturerCourses();
                setCourses(data);
                if (data.length > 0) {
                    setSelectedCourseSectionId(data[0].id);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!content || !selectedCourseSectionId) {
            alert("Please select a course and enter a message.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setSubmitSuccess(null);
        try {
            const [courseId, sectionId] = selectedCourseSectionId.split('-').map(Number);
            await mockApi.createAnnouncement({
                lecturer_id: user!.id,
                course_id: courseId,
                section_id: sectionId,
                content,
            });
            setSubmitSuccess('Announcement posted successfully!');
            setContent('');
            setTimeout(() => setSubmitSuccess(null), 3000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if(loading) return <p>Loading courses...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Post an Announcement</h1>
            <p className="text-lg text-gray-500 mb-6">Communicate with your students for specific courses.</p>
            
            <Card className="max-w-2xl">
                 <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="course-section" className="block text-sm font-medium text-gray-300">
                                Course & Section
                            </label>
                            <select
                                id="course-section"
                                value={selectedCourseSectionId}
                                onChange={(e) => setSelectedCourseSectionId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            >
                                {courses.map(({ course, section, id }) => (
                                    <option key={id} value={id}>
                                        {course.title} - Section {section.section_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-300">
                                Announcement Message
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={5}
                                placeholder="e.g., Reminder: Assignment 2 is due this Friday."
                                className="mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            ></textarea>
                        </div>
                    </div>
                     <footer className="px-6 py-4 bg-black/40 border-t border-white/10 rounded-b-3xl flex items-center justify-between">
                        <div>
                           {error && <p className="text-sm text-red-400">{error}</p>}
                           {submitSuccess && <p className="text-sm text-green-400">{submitSuccess}</p>}
                        </div>
                        <Button type="submit" disabled={isSubmitting || !content || !selectedCourseSectionId}>
                            {isSubmitting ? 'Posting...' : 'Post Announcement'}
                        </Button>
                    </footer>
                </form>
            </Card>
        </div>
    );
};

export default AnnouncementsView;