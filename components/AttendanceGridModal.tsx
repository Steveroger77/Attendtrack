
import React, { useState, useEffect, useCallback } from 'react';
import { TimetableEntry, StudentRecord, AttendanceStatus, Role, StudentPeriodAttendanceDetails } from '../types';
import { mockApi } from '../services/api';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Tooltip from './ui/Tooltip';
import { ICONS, STATUS_STYLES, STATUS_CYCLE } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface AttendanceGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: TimetableEntry;
  date: string; // YYYY-MM-DD
}

const AttendanceStatusToggle: React.FC<{status?: AttendanceStatus, onClick: () => void, disabled: boolean}> = ({ status, onClick, disabled }) => {
    const currentStatus = status || AttendanceStatus.PRESENT;
    const style = STATUS_STYLES[currentStatus];

    return (
        <button 
          onClick={onClick} 
          disabled={disabled}
          className={`w-24 text-center px-3 py-1.5 rounded-md text-sm font-semibold border transition-all duration-200 ${style.color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
        >
          {style.label}
        </button>
    );
};

const StudentAttendanceView: React.FC<{details: StudentPeriodAttendanceDetails | null, loading: boolean, error: string | null}> = ({ details, loading, error }) => {
    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading attendance details...</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-400">{error}</div>;
    }
    if (!details) {
        return <div className="p-8 text-center text-gray-500">Attendance has not been marked for this period yet.</div>;
    }

    const style = STATUS_STYLES[details.status];

    return (
        <div className="p-6 text-gray-200">
            <div className="bg-black/40 rounded-lg p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Your Status</p>
                        <span className={`px-4 py-2 text-lg font-bold rounded-lg border ${style.color}`}>{style.label}</span>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-sm text-gray-500">Marked By</p>
                        <p className="font-semibold">{details.marked_by}</p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-sm text-gray-500">Marked At</p>
                        <p className="font-semibold font-mono text-sm">{new Date(details.marked_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">History of Changes</h3>
                {details.history.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No changes have been made to this record.</p>
                ) : (
                    <ul className="space-y-3 border-l-2 border-purple-800/50 pl-4">
                        {details.history.map((event, index) => (
                            <li key={index} className="relative">
                                <span className="absolute -left-[2.1rem] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-900 ring-4 ring-black/50">
                                    {ICONS.clock}
                                </span>
                                <div className="ml-4">
                                    <p className="font-semibold">
                                        Status changed from <span className="font-bold text-yellow-400">{event.old_status || 'UNMARKED'}</span> to <span className="font-bold text-green-400">{event.new_status}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">by {event.changed_by} on {new Date(event.changed_at).toLocaleString()}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const AttendanceGridModal: React.FC<AttendanceGridModalProps> = ({ isOpen, onClose, period, date }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentDetails, setStudentDetails] = useState<StudentPeriodAttendanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Real-life PIN session management states
  const [activePin, setActivePin] = useState<string | null>(null);
  const [generatingPin, setGeneratingPin] = useState(false);
  const [pinTimer, setPinTimer] = useState<number>(0);
  const [editWindowDays, setEditWindowDays] = useState<number>(2);

  useEffect(() => {
    mockApi.getEditWindowDays().then(setEditWindowDays).catch(console.error);
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const recordDate = new Date(date); recordDate.setHours(0,0,0,0);

  const daysDiff = (today.getTime() - recordDate.getTime()) / (1000 * 3600 * 24);
  const isEditLocked = daysDiff > editWindowDays;
  const daysLeft = Math.max(0, editWindowDays - daysDiff);

  // Load existing active PIN if any
  useEffect(() => {
    if (isOpen && user?.role === Role.LECTURER && period) {
      const loadActivePin = async () => {
        try {
          const fetchedPin = await mockApi.getActivePinForTimetable(period.id);
          if (fetchedPin) {
            setActivePin(fetchedPin);
            setPinTimer(90); // 90s countdown fallback simulation
          } else {
            setActivePin(null);
          }
        } catch (e) {
          console.error("Failed to load active PIN", e);
        }
      };
      loadActivePin();
    }
  }, [isOpen, user, period]);

  // Handle countdown timer
  useEffect(() => {
    if (activePin && pinTimer > 0) {
      const interval = setInterval(() => {
        setPinTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (pinTimer === 0 && activePin) {
      setActivePin(null);
    }
  }, [pinTimer, activePin]);

  const handleGeneratePin = async () => {
    if (isEditLocked || generatingPin) return;
    setGeneratingPin(true);
    try {
      const pin = await mockApi.generateSessionPin(period.id);
      setActivePin(pin);
      setPinTimer(120); // 2 minutes active code timer
    } catch (err) {
      setError("Failed to generate Check-In PIN: " + (err as Error).message);
    } finally {
      setGeneratingPin(false);
    }
  };

  const fetchLecturerData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const data = await mockApi.getSectionStudents(period.section_id, date, period.period_index);
      
      const unmarkedIds = data.filter(s => s.status === undefined).map(s => s.enrollment_id);
      setStudents(data.map(s => ({ ...s, status: s.status || AttendanceStatus.PRESENT })));
      
      if (unmarkedIds.length > 0) {
        setDirtyRows(new Set(unmarkedIds));
      } else {
        setDirtyRows(new Set());
      }
    } catch (err) { setError((err as Error).message); } 
    finally { setLoading(false); }
  }, [period.section_id, date, period.period_index]);

  const fetchStudentData = useCallback(async () => {
    if (!user) return;
    try {
        setLoading(true); setError(null);
        const data = await mockApi.getStudentAttendanceDetails(user.id, period.course.id, period.section.id, date, period.period_index);
        setStudentDetails(data);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [user, date, period]);

  useEffect(() => {
    if (isOpen) {
        // Delay fetching data until after the modal's animation has started
        requestAnimationFrame(() => {
            if (user?.role === Role.STUDENT) {
                fetchStudentData();
            } else {
                fetchLecturerData();
            }
        });
    }
  }, [isOpen, user, fetchLecturerData, fetchStudentData]);

  const handleStatusChange = (enrollmentId: number, newStatus: AttendanceStatus) => {
    if (isEditLocked) return;
    setStudents(prev => prev.map(s => s.enrollment_id === enrollmentId ? { ...s, status: newStatus } : s));
    setDirtyRows(prev => new Set(prev).add(enrollmentId));
  };
  
  const handleToggleStatus = (enrollmentId: number) => {
    if(isEditLocked) return;
    const student = students.find(s => s.enrollment_id === enrollmentId);
    if (!student || !student.status) return;
    
    const currentIndex = STATUS_CYCLE.indexOf(student.status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    handleStatusChange(enrollmentId, STATUS_CYCLE[nextIndex]);
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    if (isEditLocked) return;
    const targetIds = selectedRows.size > 0 ? Array.from(selectedRows) : students.map(s => s.enrollment_id);
    const newDirty = new Set(dirtyRows);
    setStudents(prev => prev.map(s => {
        if (targetIds.includes(s.enrollment_id)) {
            newDirty.add(s.enrollment_id);
            return { ...s, status };
        }
        return s;
    }));
    setDirtyRows(newDirty);
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    const itemsToSave = students
        .filter(s => dirtyRows.has(s.enrollment_id))
        .map(s => ({ enrollment_id: s.enrollment_id, status: s.status! }));
    
    try {
        await mockApi.bulkMarkAttendance(date, period.period_index, itemsToSave);
        setDirtyRows(new Set());
    } catch (err) { setError((err as Error).message); } 
    finally { setSaving(false); }
  };
  
  const handleSelectRow = (enrollmentId: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId);
    } else {
      newSelected.add(enrollmentId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(students.map(s => s.enrollment_id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleModalClose = async () => {
    if (dirtyRows.size > 0 && !isEditLocked && user?.role === Role.LECTURER && !saving) {
      setSaving(true);
      setError(null);
      const itemsToSave = students
          .filter(s => dirtyRows.has(s.enrollment_id))
          .map(s => ({ enrollment_id: s.enrollment_id, status: s.status! }));
      
      try {
          await mockApi.bulkMarkAttendance(date, period.period_index, itemsToSave);
          setDirtyRows(new Set());
      } catch (err) {
          console.error("Auto-save on close failed:", err);
      } finally {
          setSaving(false);
          onClose();
      }
    } else {
      onClose();
    }
  };

  const title = `${period.course.title} (${period.course.code}) - Section ${period.section.section_name}`;

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={title}>
      {user?.role === Role.STUDENT ? (
        <StudentAttendanceView details={studentDetails} loading={loading} error={error}/>
      ) : (
      <div className="flex flex-col h-full">
        <div className="p-4 bg-black/30 rounded-t-lg border-b border-white/10 space-y-3 shrink-0">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              <span className="font-semibold">{new Date(date).toDateString()}</span> — Period {period.period_index}
            </div>
            <Tooltip text={`Lecturers may edit attendance for up to ${editWindowDays} days. After that, changes require admin override.`}>
              <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full ${isEditLocked ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                {isEditLocked ? ICONS.lock : ICONS.info}
                <span>{isEditLocked ? 'Edit Locked' : `Edit Window: ${daysLeft} day(s) left`}</span>
              </div>
            </Tooltip>
          </div>

          {/* Real-Life Classroom Self Registration PIN */}
          {!isEditLocked && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-3 bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/20 rounded-lg gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-200">Classroom Self-Registration PIN</p>
                <p className="text-xs text-gray-400">
                  Broadcast this PIN to your students to let them securely enter attendance on their dashboard.
                </p>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                {activePin ? (
                  <div className="flex items-center gap-3 bg-black/50 px-3 py-1.5 border border-green-500/30 rounded-lg shadow">
                    <span className="text-xl font-mono font-black text-green-400 tracking-widest leading-none">{activePin}</span>
                    <span className="text-xs font-mono text-gray-400 border-l border-white/10 pl-3 leading-none">
                      {Math.floor(pinTimer / 60)}:{(pinTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={handleGeneratePin} disabled={generatingPin} className="!text-xs !py-1.5">
                    {generatingPin ? 'Generating...' : '🔑 Generate Check-In PIN'}
                  </Button>
                )}
                {activePin && (
                  <Button variant="secondary" onClick={handleGeneratePin} className="!text-xs !py-1.5 border border-white/5 bg-black/20 text-gray-400">
                     Refresh Code
                  </Button>
                )}
              </div>
            </div>
          )}

           <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => handleBulkMark(AttendanceStatus.PRESENT)} disabled={isEditLocked}>Mark Selected Present</Button>
                <Button variant="secondary" onClick={() => handleBulkMark(AttendanceStatus.ABSENT)} disabled={isEditLocked}>Mark Selected Absent</Button>
                <Button variant="secondary" onClick={() => handleBulkMark(AttendanceStatus.EXCUSED)} disabled={isEditLocked}>Mark Selected Excused</Button>
                <div className="flex-grow"></div>
                <Tooltip text="Refresh student list (picks up student self-check-ins instantly)">
                  <Button 
                      variant="secondary" 
                      onClick={fetchLecturerData} 
                      disabled={loading} 
                      className="!p-0 w-10 h-10 !rounded-full flex items-center justify-center shrink-0 border border-white/10 hover:bg-white/5 hover:border-white/20 mr-2 shadow-inner transition-transform duration-200 active:scale-95"
                  >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 shrink-0 ${loading ? 'animate-spin' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2.5}
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 0 1 15-7l3 3M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-15 7l-3-3M3 21v-5h5" />
                      </svg>
                  </Button>
                </Tooltip>
                <Button onClick={handleSave} disabled={dirtyRows.size === 0 || saving || isEditLocked}>
                    {saving ? 'Saving...' : `Save ${dirtyRows.size > 0 ? `(${dirtyRows.size})` : ''} Changes`}
                </Button>
            </div>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>

        <div className="flex-grow overflow-auto">
          <table className="w-full min-w-[600px] text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-900/70 backdrop-blur-sm sticky top-0">
              <tr>
                <th scope="col" className="p-4">
                  <input type="checkbox" onChange={handleSelectAll} className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-600" />
                </th>
                <th scope="col" className="px-6 py-3">College ID</th>
                <th scope="col" className="px-6 py-3">Student Name</th>
                <th scope="col" className="px-6 py-3 text-center">Status</th>
                <th scope="col" className="px-6 py-3 text-center">Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} className="text-center p-8">Loading students...</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.enrollment_id} className={`border-b border-purple-900/60 transition-colors duration-200 ${dirtyRows.has(student.enrollment_id) ? 'bg-yellow-500/10' : 'hover:bg-purple-500/10'}`}>
                    <td className="w-4 p-4">
                        <input type="checkbox" checked={selectedRows.has(student.enrollment_id)} onChange={() => handleSelectRow(student.enrollment_id)} className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-600" />
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">{student.college_id}</td>
                    <th scope="row" className="px-6 py-4 font-medium text-gray-200 whitespace-nowrap">{student.name}</th>
                    <td className="px-6 py-4 flex justify-center">
                        <AttendanceStatusToggle status={student.status} onClick={() => handleToggleStatus(student.enrollment_id)} disabled={isEditLocked}/>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Tooltip text="View attendance history for this student">
                        <button className="text-gray-500 hover:text-blue-400 transition-colors">
                            {ICONS.clock}
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </Modal>
  );
};

export default AttendanceGridModal;
