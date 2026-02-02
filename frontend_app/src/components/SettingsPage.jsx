import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

const SettingsPage = () => {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Simulation Settings</h1>
            
            <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
                <h2 className="font-bold text-lg mb-4 border-b pb-2">User Preferences</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">Dark Mode (Coming Soon)</label>
                         <div className="w-10 h-5 bg-gray-300 rounded-full relative cursor-not-allowed">
                             <div className="w-5 h-5 bg-gray-500 rounded-full shadow absolute left-0"></div>
                         </div>
                    </div>
                    <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">Show Hints Automatically</label>
                         <div className="w-10 h-5 bg-aws-orange rounded-full relative cursor-pointer">
                             <div className="w-5 h-5 bg-white rounded-full shadow absolute right-0"></div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
                <h2 className="font-bold text-lg mb-4 border-b pb-2">Account</h2>
                <div className="text-sm text-gray-600 mb-4">
                    You are currently using a simulated Student account.
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <div className="flex">
                        <AlertCircle className="text-blue-500 mr-2" size={20} />
                        <p className="text-sm text-blue-700">Account data is reset when the backend server restarts.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    className="aws-btn-primary flex items-center"
                    onClick={handleSave}
                >
                    <Save size={16} className="mr-2" /> Save Settings
                </button>
            </div>

            {saved && (
                <div className="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-3 rounded shadow-lg animate-fade-in-up">
                    Settings Saved Successfully!
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
