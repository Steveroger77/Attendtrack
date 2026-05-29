import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { 
  Globe, 
  Laptop, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Server,
  FileJson,
  Terminal,
  QrCode
} from 'lucide-react';

const APP_KEYS = [
  'db_users',
  'db_enrollments',
  'db_attendance_records',
  'db_attendance_audits',
  'db_timetable',
  'db_settings',
  'db_holidays',
  'db_leave_requests',
  'db_announcements',
  'db_next_ids',
];

const DeploymentView: React.FC = () => {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedDocker, setCopiedDocker] = useState(false);
    const [copiedElectron, setCopiedElectron] = useState(false);
    const [stats, setStats] = useState({
        users: 0,
        records: 0,
        timetable: 0,
    });
    const [activeTab, setActiveTab] = useState<'pwa' | 'electron'>('pwa');

    // Get live web url
    const liveUrl = window.location.origin;

    useEffect(() => {
        // Calculate database stats for admin
        try {
            const users = JSON.parse(localStorage.getItem('db_users') || '[]');
            const records = JSON.parse(localStorage.getItem('db_attendance_records') || '[]');
            const timetable = JSON.parse(localStorage.getItem('db_timetable') || '[]');
            setStats({
                users: users.length,
                records: records.length,
                timetable: timetable.length,
            });
        } catch (e) {
            console.error("Failed to load local DB stats", e);
        }
    }, []);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(liveUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handleExportBackup = () => {
        const backup: Record<string, any> = {};
        APP_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) {
                try {
                    backup[key] = JSON.parse(val);
                } catch (e) {
                    backup[key] = val;
                }
            }
        });

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `attendtrack_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                
                // Confirm it has general structure or is correct json
                const keysFound = Object.keys(parsed).filter(key => APP_KEYS.includes(key));
                if (keysFound.length === 0) {
                    alert("Invalid backup file. No AttendTrack database keys found.");
                    return;
                }

                if (window.confirm("Are you sure you want to restore database from backup? This will overwrite existing users, classes, and attendance records with the backup file data.")) {
                    keysFound.forEach(key => {
                        localStorage.setItem(key, JSON.stringify(parsed[key]));
                    });
                    alert("Database restored successfully! The application will now reload to apply all restored parameters.");
                    window.location.reload();
                }
            } catch (err) {
                alert("Error restoring backup: " + (err as Error).message);
            }
        };
        reader.readAsText(file);
    };

    const dockerfileCode = `# AttendTrack Dockerfile (Multi-stage Build)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Setup default port redirection
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

    const handleCopyDocker = () => {
        navigator.clipboard.writeText(dockerfileCode);
        setCopiedDocker(true);
        setTimeout(() => setCopiedDocker(false), 2000);
    };

    const electronMainCode = `// main.js - Native PC App Wrapper for AttendTrack
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "AttendTrack",
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Direct native launcher to the college web hosting portal
  mainWindow.loadURL("${liveUrl}");
  Menu.setApplicationMenu(null); // Simple Kiosk Mode
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});`;

    const handleCopyElectron = () => {
        navigator.clipboard.writeText(electronMainCode);
        setCopiedElectron(true);
        setTimeout(() => setCopiedElectron(false), 2000);
    };

    const handleDownloadElectronConfig = () => {
        const pkgJson = {
            name: "attendtrack-desktop",
            version: "1.0.0",
            main: "main.js",
            scripts: {
                "start": "electron .",
                "dist": "electron-builder -w -m -l"
            },
            devDependencies: {
                "electron": "^28.0.0",
                "electron-builder": "^24.9.0"
            }
        };

        const blobPkg = new Blob([JSON.stringify(pkgJson, null, 2)], { type: 'application/json' });
        const blobMain = new Blob([electronMainCode], { type: 'text/javascript' });

        const d1 = document.createElement('a');
        d1.href = URL.createObjectURL(blobPkg);
        d1.setAttribute("download", "package.json");
        document.body.appendChild(d1);
        d1.click();
        d1.remove();

        setTimeout(() => {
            const d2 = document.createElement('a');
            d2.href = URL.createObjectURL(blobMain);
            d2.setAttribute("download", "main.js");
            document.body.appendChild(d2);
            d2.click();
            d2.remove();
        }, 300);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-200 mb-2">College Deployment Center</h1>
                <p className="text-lg text-gray-500 mb-6">Explainers, installer configuration tools, and local backups for university administrators and computer labs.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* 1. Web Deployment Information */}
                <Card className="flex flex-col h-full border border-white/5 hover:border-purple-500/15 transition-all">
                    <div className="p-6 border-b border-white/10 flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg text-green-400 font-bold shrink-0">
                            <Globe className="h-6 w-6 font-bold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">1. Live Web Portal</h2>
                            <p className="text-xs text-gray-500 font-medium">Accessible by all instructors & students online</p>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 space-y-4">
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            No setup needed! Your application is fully built and deployed live on high-performance cloud containers. It provides instant web portal access without manual file installations or hardware dependencies.
                        </p>

                        <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-3">
                            <span className="text-xs text-gray-500 font-mono tracking-wide uppercase">Your Institution Portal URL</span>
                            <div className="flex items-center space-x-2">
                                <input 
                                    readOnly 
                                    value={liveUrl} 
                                    className="flex-1 bg-black/60 border border-white/10 rounded-lg py-2 px-3 text-sm font-mono text-gray-300 outline-none select-all"
                                />
                                <Button onClick={handleCopyUrl} variant="secondary" className="!p-2.5 h-10 border border-white/10 shrink-0">
                                    {copiedUrl ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 bg-purple-500/10 border border-purple-500/25 rounded-xl p-4">
                            <div className="mt-0.5 p-1 bg-purple-500/20 rounded-full text-purple-400 shrink-0">
                                <QrCode className="h-4 w-4 font-bold" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-purple-300">Quick QR-code Generation</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                    Print this Portal URL on physical lecturer handouts or classroom walls to let students perform rapid attendance check-ins using smartphones!
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. PC & Mobile Installer Hub */}
                <Card className="flex flex-col h-full border border-white/5 hover:border-purple-500/15 transition-all">
                    <div className="p-6 border-b border-white/10 flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg text-purple-400 font-bold shrink-0">
                            <Laptop className="h-6 w-6 font-bold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">2. PC & Laptop Native Setup</h2>
                            <p className="text-xs text-gray-500 font-medium">Run as permanent Desktop App in college labs</p>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col space-y-4">
                        <div className="flex bg-black/40 border border-white/10 p-1 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('pwa')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'pwa' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow' : 'text-gray-400 hover:text-gray-300'}`}
                            >
                                Desktop Shortcut (PWA)
                            </button>
                            <button 
                                onClick={() => setActiveTab('electron')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'electron' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow' : 'text-gray-400 hover:text-gray-300'}`}
                            >
                                Double-Click EXE Wrapper
                            </button>
                        </div>

                        {activeTab === 'pwa' ? (
                            <div className="space-y-3 flex-1 justify-center">
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    Any browser (Google Chrome, Microsoft Edge, Safari) enables colleges to install this app standalone onto any Windows PC, Mac, or mobile phone like a permanent application:
                                </p>
                                <ul className="space-y-2.5 text-xs text-gray-400 font-medium">
                                    <li className="flex items-start space-x-2">
                                        <span className="w-5 h-5 flex items-center justify-center bg-white/5 border border-white/10 text-purple-400 rounded-full font-mono font-bold shrink-0">1</span>
                                        <span>Open the Portal link on your PC using Google Chrome or Edge.</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <span className="w-5 h-5 flex items-center justify-center bg-white/5 border border-white/10 text-purple-400 rounded-full font-mono font-bold shrink-0">2</span>
                                        <span>Locate the <strong>"Install AttendTrack"</strong> icon in the address bar (next to bookmarks) or click <strong>Settings (...) → Save and Share → Install page as App</strong>.</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <span className="w-5 h-5 flex items-center justify-center bg-white/5 border border-white/10 text-purple-400 rounded-full font-mono font-bold shrink-0">3</span>
                                        <span>The app will launch in its own standalone, immersive borderless window with an icon placed automatically on your <strong>Windows Desktop and Taskbar</strong>.</span>
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1 flex flex-col justify-between">
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    Prefer packaging a dedicated, double-clickable offline execution file (`.exe` for Windows, `.app` for macOS)? Here are target parameters to wrap this web application inside an Electron.js sandbox:
                                </p>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 font-mono">electron-main.js configuration</span>
                                        <div className="flex space-x-1">
                                            <Button onClick={handleCopyElectron} variant="secondary" className="!p-1 h-7 border border-white/10 font-bold text-[10px]">
                                                {copiedElectron ? <Check className="h-3 w-3 text-green-400 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                                Copy JS
                                            </Button>
                                            <Button onClick={handleDownloadElectronConfig} variant="secondary" className="!p-1 h-7 border border-white/10 font-bold text-[10px] text-purple-300">
                                                <Download className="h-3 w-3 mr-1" /> Download Setup
                                            </Button>
                                        </div>
                                    </div>
                                    <pre className="p-3 bg-black/60 border border-white/10 rounded-lg text-[10px] font-mono text-gray-400 overflow-x-auto max-h-36">
                                        {electronMainCode}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* 3. Local Datastore Backups */}
                <Card className="flex flex-col h-full border border-white/5 hover:border-purple-500/15 transition-all">
                    <div className="p-6 border-b border-white/10 flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg text-blue-400 font-bold shrink-0">
                            <FileJson className="h-6 w-6 font-bold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">3. System Backups & Recovery</h2>
                            <p className="text-xs text-gray-500 font-medium">Safeguard, download, or migrate your local structures</p>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 space-y-4">
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            AttendTrack stores schedules and logs in the local web client DB to secure high speed. You can download complete backups at the end of semesters and restore them on other PCs instantly.
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-white/5">
                            <div className="p-2">
                                <p className="text-xl font-bold text-purple-400">{stats.users}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Enrolled Users</p>
                            </div>
                            <div className="p-2 border-x border-white/5">
                                <p className="text-xl font-bold text-blue-400">{stats.records}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Marked Logs</p>
                            </div>
                            <div className="p-2">
                                <p className="text-xl font-bold text-green-400">{stats.timetable}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Time Blocks</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                            <Button onClick={handleExportBackup} className="flex-1 filter saturate-105 font-bold">
                                <Download className="h-4 w-4 mr-2" />
                                Save Backup (.json)
                            </Button>
                            <label className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-white/10 hover:border-white/20 active:scale-95 text-sm font-bold rounded-xl text-gray-200 cursor-pointer transition-all">
                                <Upload className="h-4 w-4 mr-2" />
                                Load Backup (.json)
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    onChange={handleImportBackup} 
                                    className="hidden" 
                                />
                            </label>
                        </div>
                    </div>
                </Card>

                {/* 4. Custom Private-Server Deployment */}
                <Card className="flex flex-col h-full border border-white/5 hover:border-purple-500/15 transition-all">
                    <div className="p-6 border-b border-white/10 flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg text-yellow-400 font-bold shrink-0">
                            <Server className="h-6 w-6 font-bold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">4. Secure Institution Self-Hosting</h2>
                            <p className="text-xs text-gray-500 font-medium">Run AttendTrack on local university servers</p>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col space-y-4">
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            For additional security or offline campus network regulations, the complete static build can be run natively using standard containers or local enterprise virtualization:
                        </p>

                        <div className="space-y-2 flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-mono flex items-center font-semibold">
                                    <Terminal className="h-3 w-3 mr-1" /> Custom Dockerfile Setup
                                </span>
                                <Button onClick={handleCopyDocker} variant="secondary" className="!p-1 h-7 border border-white/10 font-bold text-[10px]">
                                    {copiedDocker ? <Check className="h-3 w-3 text-green-400 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                    Copy Script
                                </Button>
                            </div>
                            <pre className="p-3 bg-black/60 border border-white/10 rounded-lg text-[10px] font-mono text-gray-400 overflow-x-auto max-h-36">
                                {dockerfileCode}
                            </pre>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default DeploymentView;
