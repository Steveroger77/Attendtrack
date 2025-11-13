
import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ICONS } from '../../constants';
import { mockApi } from '../../services/api';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

const DataImportView: React.FC = () => {
    const [userCsv, setUserCsv] = useState<string | null>(null);
    const [enrollmentCsv, setEnrollmentCsv] = useState<string | null>(null);
    const [userResult, setUserResult] = useState<ImportResult | null>(null);
    const [enrollmentResult, setEnrollmentResult] = useState<ImportResult | null>(null);
    const [isUserImporting, setIsUserImporting] = useState(false);
    const [isEnrollmentImporting, setIsEnrollmentImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setter(event.target?.result as string);
            };
            reader.readAsText(file);
        } else {
            setter(null);
        }
    };
    
    const handleDownloadTemplate = (type: 'users' | 'enrollments') => {
        let content = '';
        let filename = '';
        if (type === 'users') {
            content = 'name,email,college_id,role\nJohn Doe,john.doe@btech.edu,BT2024001,STUDENT\nJane Smith,jane.smith@btech.edu,L006,LECTURER';
            filename = 'user_import_template.csv';
        } else {
            content = 'student_college_id,course_code,section_name\nBT2024001,CC501,A\nBT2024001,WD601,A';
            filename = 'enrollment_import_template.csv';
        }
        
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUserImport = async () => {
        if (!userCsv) return;
        setIsUserImporting(true);
        setUserResult(null);
        try {
            const result = await mockApi.bulkImportUsers(userCsv);
            setUserResult(result);
        } catch(e) {
            setUserResult({ success: 0, failed: 0, errors: [(e as Error).message] });
        } finally {
            setIsUserImporting(false);
        }
    };

    const handleEnrollmentImport = async () => {
        if (!enrollmentCsv) return;
        setIsEnrollmentImporting(true);
        setEnrollmentResult(null);
         try {
            const result = await mockApi.bulkImportEnrollments(enrollmentCsv);
            setEnrollmentResult(result);
        } catch(e) {
            setEnrollmentResult({ success: 0, failed: 0, errors: [(e as Error).message] });
        } finally {
            setIsEnrollmentImporting(false);
        }
    };

    const ImportResultDisplay: React.FC<{ result: ImportResult | null }> = ({ result }) => {
        if (!result) return null;
        return (
            <div className="mt-4 p-4 bg-black/30 rounded-lg text-sm">
                <p className="font-semibold">Import Complete:</p>
                <p><span className="text-green-400">{result.success}</span> rows imported successfully.</p>
                <p><span className="text-red-400">{result.failed}</span> rows failed.</p>
                {result.errors.length > 0 && (
                    <div className="mt-2">
                        <p className="font-semibold text-yellow-400">Error Details:</p>
                        <ul className="list-disc list-inside max-h-32 overflow-y-auto text-xs text-gray-400">
                            {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Bulk Data Import</h1>
            <p className="text-lg text-gray-500 mb-6">Import users and enrollments from CSV files.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-semibold p-6 border-b border-white/10">User Import</h2>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-400">Upload a CSV with columns: `name`, `email`, `college_id`, `role`.</p>
                        <Button variant="secondary" onClick={() => handleDownloadTemplate('users')}>Download User Template</Button>
                        <input type="file" accept=".csv" onChange={e => handleFileChange(e, setUserCsv)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/10 file:text-sm file:font-semibold file:bg-black/30 file:text-gray-300 hover:file:bg-black/50"/>
                        <Button onClick={handleUserImport} disabled={!userCsv || isUserImporting} className="w-full">
                            {ICONS.upload}
                            {isUserImporting ? 'Importing...' : `Import ${userCsv ? 'Users' : ''}`}
                        </Button>
                        <ImportResultDisplay result={userResult} />
                    </div>
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold p-6 border-b border-white/10">Enrollment Import</h2>
                     <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-400">Upload a CSV with columns: `student_college_id`, `course_code`, `section_name`.</p>
                        <Button variant="secondary" onClick={() => handleDownloadTemplate('enrollments')}>Download Enrollment Template</Button>
                        <input type="file" accept=".csv" onChange={e => handleFileChange(e, setEnrollmentCsv)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/10 file:text-sm file:font-semibold file:bg-black/30 file:text-gray-300 hover:file:bg-black/50"/>
                        <Button onClick={handleEnrollmentImport} disabled={!enrollmentCsv || isEnrollmentImporting} className="w-full">
                            {ICONS.upload}
                            {isEnrollmentImporting ? 'Importing...' : `Import ${enrollmentCsv ? 'Enrollments' : ''}`}
                        </Button>
                        <ImportResultDisplay result={enrollmentResult} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DataImportView;
