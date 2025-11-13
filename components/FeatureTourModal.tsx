
import React, { useState } from 'react';
import Modal from './ui/Modal';
import Card from './ui/Card';
import { Role } from '../types';
import { ICONS } from '../constants';

const FeatureTourModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [activeRole, setActiveRole] = useState<Role>(Role.LECTURER);

    const features = {
        [Role.LECTURER]: [
            { icon: ICONS.dashboard, title: "Dashboard", description: "Your daily mission brief. See who's showing up and who's slacking, all before your first coffee. JARVIS, handle the paperwork." },
            { icon: ICONS.clipboard, title: "Marking", description: "Zap 'em with the attendance beam. Present, absent, late... whatever. It's faster than making a new suit. Even handles those 'unscheduled' genius sessions." },
            { icon: ICONS.chart, title: "Reports", description: "Data is the new vibranium. Get tactical readouts on class performance. Identify the heroes and... the other guys." },
            { icon: ICONS.inbox, title: "Leave Requests", description: "Incoming transmissions from the student body. Give 'em the green light or a hard 'no'. Your call, boss." },
            { icon: ICONS.megaphone, title: "Announcements", description: "Broadcast mode engaged. Send directives to the entire class. No need for a carrier pigeon, we're in the 21st century." },
        ],
        [Role.STUDENT]: [
            { icon: ICONS.dashboard, title: "Dashboard", description: "Your personal heads-up display. Keep your attendance percentage in the green, or you might find your privileges... revoked." },
            { icon: ICONS.calendar, title: "Timetable", description: "Your strategic schedule. My AI has optimized your day. All you have to do is show up. Simple, right?" },
            { icon: ICONS.inbox, title: "Leave Requests", description: "Requesting shore leave? File your request here. The council of lecturers will decide your fate. Good luck." },
        ],
        [Role.ADMIN]: [
            { icon: ICONS.user, title: "User Management", description: "Welcome to the armory. Suit up new users, upgrade existing ones, or decommission obsolete models. You've got the keys to the kingdom." },
            { icon: ICONS.assignments, title: "Assignments", description: "Strategic deployment. Assign your teaching assets to their mission objectives. It's like a high-stakes game of chess, but with more coffee." },
            { icon: ICONS.upload, title: "Data Import", description: "Nanotech data infusion. Feed me your CSV files, and I'll build your user database faster than you can say 'I am Iron Man'." },
            { icon: ICONS.clipboard, title: "Audit Log", description: "The 'I told you so' protocol. Every change, every update, all logged. Nothing gets past this system. Nothing." },
        ]
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AttendTrack Feature Tour">
            <div className="p-1 md:p-4">
                <div className="flex justify-center border-b border-purple-800/50 mb-6">
                    {Object.values(Role).map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`px-3 md:px-6 py-3 text-sm font-medium transition-colors duration-200 capitalize ${
                                activeRole === role
                                    ? 'text-purple-300 border-b-2 border-purple-400'
                                    : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                            }`}
                        >
                           {role.toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto p-2">
                    {features[activeRole].map(feature => (
                        <Card key={feature.title} className="p-5 flex flex-col items-center text-center space-y-3">
                            <div className="h-8 w-8 flex items-center justify-center text-purple-400">{feature.icon}</div>
                            <h3 className="text-lg font-bold text-gray-100">{feature.title}</h3>
                            <p className="text-sm text-gray-400 flex-grow">{feature.description}</p>
                        </Card>
                    ))}
                </div>

            </div>
        </Modal>
    );
};

export default FeatureTourModal;