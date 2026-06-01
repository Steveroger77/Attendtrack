import React, { useState, useEffect, FormEvent } from 'react';
import { Course, Section, Announcement } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { ICONS } from '../../constants';
import CustomSelect from '../ui/CustomSelect';

const AnnouncementsView: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<{ course: Course; section: Section; id: string }[]>([]);
    const [announcements, setAnnouncements] = useState<(Announcement & { course: Course; section: Section })[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedCourseSectionId, setSelectedCourseSectionId] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    const fetchAnnouncementsList = async () => {
        if (!user) return;
        setLoadingAnnouncements(true);
        try {
            const data = await mockApi.getAnnouncementsForLecturer(user.id);
            setAnnouncements(data);
        } catch (err) {
            console.error('Failed to fetch announcements:', err);
        } finally {
            setLoadingAnnouncements(false);
        }
    };

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
        fetchAnnouncementsList();
    }, [user]);

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
            await fetchAnnouncementsList();
            setTimeout(() => setSubmitSuccess(null), 3000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <p className="text-gray-400">Loading courses...</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Announcements Hub</h1>
            <p className="text-lg text-gray-500 mb-6">Create, broadcast, and review announcements sent to your student groups.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Compose form */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-fit">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 font-sans-default">
                                {ICONS.megaphone}
                                New broadcast
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Course & Section
                                    </label>
                                    <CustomSelect
                                        id="course-section"
                                        value={selectedCourseSectionId}
                                        onChange={(e) => setSelectedCourseSectionId(String(e.target.value))}
                                        options={courses.map(({ course, section, id }) => ({
                                            value: id,
                                            label: `${course.title} - Section ${section.section_name}`,
                                        }))}
                                    />
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
                                        rows={6}
                                        placeholder="e.g., Reminder: Assignment 2 is due this Friday."
                                        className="mt-1 block w-full px-3 py-2 bg-black/35 border border-white/10 rounded-lg shadow-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    ></textarea>
                                </div>
                            </div>
                            <footer className="px-6 py-4 bg-black/45 border-t border-white/10 rounded-b-3xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                                <div className="text-left w-full sm:w-auto">
                                    {error && <p className="text-xs text-red-400">{error}</p>}
                                    {submitSuccess && <p className="text-xs text-green-400">{submitSuccess}</p>}
                                </div>
                                <Button type="submit" disabled={isSubmitting || !content || !selectedCourseSectionId} className="w-full sm:w-auto font-sans-default">
                                    {isSubmitting ? 'Posting...' : 'Post Announcement'}
                                </Button>
                            </footer>
                        </form>
                    </Card>
                </div>

                {/* Column 2: History feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-2 font-sans-default">
                            Your Posted History
                        </h2>
                        <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full font-mono font-medium">
                            {announcements.length} {announcements.length === 1 ? 'Announcement' : 'Announcements'}
                        </span>
                    </div>

                    {loadingAnnouncements ? (
                        <p className="text-gray-400">Loading your history...</p>
                    ) : announcements.length > 0 ? (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 animate-fadeIn">
                            {announcements.map((ann) => (
                                <Card key={ann.id} className="p-5 flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs bg-purple-500/25 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-md font-semibold">
                                                {ann.course?.title || 'Unknown Course'}
                                            </span>
                                            <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-0.5 rounded-md">
                                                Sec {ann.section?.section_name || 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                                    </div>
                                    <div className="text-right whitespace-nowrap self-end md:self-start">
                                        <p className="text-xs text-gray-400 font-mono">{new Date(ann.created_at).toLocaleString()}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center bg-black/10 border-white/5">
                            <p className="text-gray-500">You haven't posted any announcements yet.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsView;
