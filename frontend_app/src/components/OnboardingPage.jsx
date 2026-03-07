import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import RoleSelector from './Lab/RoleSelector';
import ProjectIngestion from './Lab/ProjectIngestion';
import JenkinsConsole from './Lab/JenkinsConsole';

const OnboardingPage = () => {
    const { preLabPhase } = useSelector(state => state.simulation);
    const { user, isAuthenticated } = useSelector(state => state.auth);
    const isOnboarded = user?.hasCompletedOnboarding || preLabPhase === 'completed';

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isOnboarded) {
        const roleSlug = user?.selectedRole?.title ? slugify(user.selectedRole.title) : 'full-stack-developer';
        return <Navigate to={`/${roleSlug}/services`} replace />;
    }

    const getEffectivePhase = () => {
        if (preLabPhase === 'role' && user?.selectedRole) return 'project';
        return preLabPhase;
    };

    const effectivePhase = getEffectivePhase();

    const renderPhase = () => {
        switch (effectivePhase) {
            case 'role':
                return <RoleSelector />;
            case 'project':
                return <ProjectIngestion />;
            case 'jenkins':
                return <JenkinsConsole />;
            default:
                return <RoleSelector />;
        }
    };

    return (
        <div className="min-h-screen bg-aws-bg flex flex-col">
            {/* Simple Header for Onboarding */}
            <header className="bg-aws-nav text-white py-4 px-8 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-aws-orange rounded-lg flex items-center justify-center font-black text-white">CL</div>
                    <span className="font-bold text-lg tracking-tight">CloudLab <span className="text-aws-orange text-xs uppercase ml-1 opacity-80 tracking-widest font-black">Onboarding</span></span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${effectivePhase === 'role' ? 'bg-aws-orange' : 'bg-green-500'}`}></div>
                        <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Role</span>
                    </div>
                    <div className="w-8 h-[1px] bg-white/20"></div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${effectivePhase === 'project' ? 'bg-aws-orange' : (effectivePhase === 'jenkins' || preLabPhase === 'completed') ? 'bg-green-500' : 'bg-white/20'}`}></div>
                        <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Project</span>
                    </div>
                    <div className="w-8 h-[1px] bg-white/20"></div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${effectivePhase === 'jenkins' ? 'bg-aws-orange' : preLabPhase === 'completed' ? 'bg-green-500' : 'bg-white/20'}`}></div>
                        <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Pipeline</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                {renderPhase()}
            </main>

            <footer className="py-6 text-center text-gray-400 text-xs">
                &copy; 2026 CloudLab Engineering. All rights reserved.
            </footer>
        </div>
    );
};

export default OnboardingPage;
