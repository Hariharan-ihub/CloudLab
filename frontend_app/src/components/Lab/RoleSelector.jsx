import React from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedRole, setPreLabPhase } from '../../store/simulationSlice';
import { saveRole } from '../../store/authSlice';
import { Layout, Cloud, Database, Shield, Settings, Terminal } from 'lucide-react';

const roles = [
    { id: 'fullstack', title: 'Full Stack Developer', iconName: 'Layout', color: 'bg-blue-500', available: true },
    { id: 'cloud', title: 'Cloud Engineer', iconName: 'Cloud', color: 'bg-orange-500', available: false },
    { id: 'devops', title: 'DevOps Specialist', iconName: 'Settings', color: 'bg-green-500', available: false },
    { id: 'data', title: 'Data Engineer', iconName: 'Database', color: 'bg-purple-500', available: false },
    { id: 'security', title: 'Security Architect', iconName: 'Shield', color: 'bg-red-500', available: false }
];

const IconComponent = ({ iconName, size }) => {
    switch (iconName) {
        case 'Layout': return <Layout size={size} />;
        case 'Cloud': return <Cloud size={size} />;
        case 'Settings': return <Settings size={size} />;
        case 'Database': return <Database size={size} />;
        case 'Shield': return <Shield size={size} />;
        default: return <Terminal size={size} />;
    }
};

const RoleSelector = () => {
    const dispatch = useDispatch();

    const handleSelectRole = (role) => {
        if (!role.available) return;
        // Dispatch only serializable data
        const serializableRole = { ...role };
        delete serializableRole.icon; // Already changed to iconName but just to be safe
        dispatch(setSelectedRole(serializableRole));
        dispatch(saveRole(serializableRole));
        dispatch(setPreLabPhase('project'));
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-700">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Choose Your Career Path</h1>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">Select a role to tailor your cloud learning journey. Your onboarding will be customized based on this selection.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((role) => (
                    <div 
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`group relative p-8 rounded-3xl border-2 transition-all duration-300 ${
                            role.available 
                                ? 'bg-white border-gray-100 hover:border-aws-blue hover:shadow-2xl hover:shadow-blue-100 cursor-pointer active:scale-95' 
                                : 'bg-gray-50 border-transparent grayscale cursor-not-allowed opacity-75'
                        }`}
                    >
                        <div className="flex items-start gap-6">
                            <div className={`p-4 rounded-2xl text-white shadow-lg ${role.available ? role.color : 'bg-gray-400'}`}>
                                <IconComponent iconName={role.iconName} size={32} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
                                    {!role.available && (
                                        <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded-md">Coming Soon</span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {role.available 
                                        ? "Master modern web architectures, CI/CD, and cloud scaling." 
                                        : "Advanced cloud infrastructure and automation patterns."}
                                </p>
                            </div>
                        </div>

                        {role.available && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-aws-blue px-3 py-1 rounded-full text-xs font-bold">
                                SELECT ROLE
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-12 text-center p-6 bg-blue-50 rounded-2xl border border-blue-100 border-dashed">
                <p className="text-aws-blue text-sm font-medium">
                    "Choose Full Stack Developer to experience the complete deployment flow from GitHub to AWS."
                </p>
            </div>
        </div>
    );
};

export default RoleSelector;
