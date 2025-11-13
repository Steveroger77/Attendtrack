import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  page?: string;
  setPage?: (page: string) => void;
  pendingLeaveCount?: number;
}

interface NavLinkProps {
    icon: React.ReactNode;
    label: string;
    target?: string;
    currentPage?: string;
    setPage?: (page: string) => void;
}

// NavLink now renders the link/button content, to be wrapped in <li> by the parent
const NavLink: React.FC<NavLinkProps> = ({ icon, label, target, currentPage, setPage }) => {
    const content = (
        <>
            {icon}
            <span className="ml-3 transition-opacity duration-200 ease-in-out delay-150 lg:opacity-0 lg:group-hover:opacity-100">{label}</span>
        </>
    );

    // Fallback for roles that don't use the page system yet
    if (!setPage || !currentPage || !target) {
        return (
            <a href="#" className="flex items-center p-3 text-gray-300 rounded-lg hover:bg-purple-500/10 transition-colors duration-200">
                {content}
            </a>
        );
    }

    const isActive = currentPage === target;
    return (
        <button
            onClick={() => setPage(target)}
            className={`flex items-center p-3 text-gray-300 rounded-lg transition-colors duration-200 w-full text-left ${isActive ? 'bg-purple-500/20 text-white' : 'hover:bg-purple-500/10'}`}
        >
            {content}
        </button>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, page, setPage, pendingLeaveCount }) => {
    const { user } = useAuth();
    const sidebar = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
          if (!sidebar.current || !sidebarOpen) return;
          if (!sidebar.current.contains(target as Node)) {
            setSidebarOpen(false);
          }
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    }, [sidebarOpen, setSidebarOpen]);
    
    // Close on ESC key press
    useEffect(() => {
        const keyHandler = ({ key }: KeyboardEvent) => {
          if (!sidebarOpen || key !== 'Escape') return;
          setSidebarOpen(false);
        };
        document.addEventListener('keydown', keyHandler);
        return () => document.removeEventListener('keydown', keyHandler);
    }, [sidebarOpen, setSidebarOpen]);
    
    // Close on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && sidebarOpen) { // Tailwind's lg breakpoint
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarOpen, setSidebarOpen]);

    const lecturerLinks = (
        <>
            <li><NavLink icon={ICONS.dashboard} label="Dashboard" target="dashboard" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.calendar} label="Timetable" target="timetable" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.clipboard} label="Marking" target="marking" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.chart} label="Reports" target="reports" currentPage={page} setPage={setPage} /></li>
            <li className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-200 ease-in-out delay-150 lg:opacity-0 lg:group-hover:opacity-100">Communication</li>
            <li className="relative">
                <NavLink icon={ICONS.inbox} label="Leave Requests" target="leave" currentPage={page} setPage={setPage} />
                {pendingLeaveCount > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-5 min-w-[1.25rem] px-1 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-black/30 pointer-events-none">
                        {pendingLeaveCount}
                    </span>
                )}
            </li>
            <li><NavLink icon={ICONS.megaphone} label="Announcements" target="announcements" currentPage={page} setPage={setPage} /></li>
        </>
    );

    const studentLinks = (
         <>
            <li><NavLink icon={ICONS.dashboard} label="Dashboard" target="dashboard" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.calendar} label="Timetable" target="timetable" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.inbox} label="Leave Requests" target="leave" currentPage={page} setPage={setPage} /></li>
        </>
    );

    const adminLinks = (
         <>
            <li><NavLink icon={ICONS.dashboard} label="Dashboard" target="dashboard" currentPage={page} setPage={setPage} /></li>
            <li className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-200 ease-in-out delay-150 lg:opacity-0 lg:group-hover:opacity-100">Admin</li>
            <li><NavLink icon={ICONS.user} label="Users" target="users" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.assignments} label="Assignments" target="assignments" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.upload} label="Data Import" target="import" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.admin} label="Settings" target="settings" currentPage={page} setPage={setPage} /></li>
            <li><NavLink icon={ICONS.clipboard} label="Audit Log" target="audit" currentPage={page} setPage={setPage} /></li>
        </>
    );
    
  return (
    <>
    <div className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden="true"></div>
    <div
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 transform h-screen overflow-y-auto no-scrollbar w-64 lg:w-20 lg:hover:w-64 shrink-0 bg-black/20 backdrop-blur-2xl border-r border-white/10 p-4 transition-[width] duration-300 ease-in-out group ${ sidebarOpen ? 'translate-x-0' : '-translate-x-64'}`}
    >
        <div className="flex justify-between mb-10 pr-3 sm:px-2 items-center">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 transition-opacity duration-200 ease-in-out delay-150 lg:opacity-0 lg:group-hover:opacity-100">
                AttendTrack
            </h1>
        </div>

      <nav>
        <ul className="space-y-2">
            {user?.role === Role.LECTURER && lecturerLinks}
            {user?.role === Role.STUDENT && studentLinks}
            {user?.role === Role.ADMIN && adminLinks}
        </ul>
      </nav>
    </div>
    </>
  );
};

export default Sidebar;