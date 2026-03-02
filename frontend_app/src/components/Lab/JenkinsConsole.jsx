import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateJenkinsStage, setJenkinsStatus, setPreLabPhase } from '../../store/simulationSlice';
import { completeOnboarding } from '../../store/authSlice';
import { 
    Settings, Play, CheckCircle2, Circle, Loader2, 
    Terminal as TerminalIcon, AlertTriangle, Search, 
    User, HelpCircle, ChevronRight, Activity, 
    FileText, GitBranch, Layout, ExternalLink, Clock
} from 'lucide-react';

const JenkinsConsole = () => {
    const dispatch = useDispatch();
    const { repoInfo, jenkinsStatus, selectedRole } = useSelector(state => state.simulation);
    const [activeLogs, setActiveLogs] = useState([]);
    const scrollRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const STAGE_CONFIG = [
        { name: 'Declarative: Checkout SCM', duration: 2500, logs: [
            `> git clone https://github.com/${repoInfo?.fullName}.git`,
            'Cloning into \'.\'...',
            'remote: Enumerating objects: 452, done.',
            `Successfully checked out branch 'main'`
        ]},
        { name: 'AWS ECR Login', duration: 2000, logs: [
            `> aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 1234567890.dkr.ecr.us-east-1.amazonaws.com`,
            'Login Succeeded'
        ]},
        { name: 'Build & Push Docker Image', duration: 8000, logs: [
            `> docker build -t ${repoInfo?.name || 'app'}:latest .`,
            'Step 1/8 : FROM node:18-alpine',
            'Step 2/8 : WORKDIR /app',
            'Step 7/8 : EXPOSE 80',
            'Successfully built image',
            `> docker push 1234567890.dkr.ecr.us-east-1.amazonaws.com/${repoInfo?.name || 'app'}:latest`
        ]},
        { name: 'Register New Task Definition with Latest Image', duration: 3000, logs: [
            `> aws ecs register-task-definition --family ${repoInfo?.name || 'app'}-task --container-definitions [...]`,
            'Task definition registered: arn:aws:ecs:us-east-1:1234567890:task-definition/app-task:42'
        ]},
        { name: 'Update ECS Service with New Task Definition', duration: 4000, logs: [
            `> aws ecs update-service --cluster cloudlab-cluster --service ${repoInfo?.name || 'app'}-service --task-definition app-task:42`,
            'Service updated successfully. Waiting for deployments...',
            'Deployment status: PRIMARY'
        ]},
        { name: 'Declarative: Post Actions', duration: 3000, logs: [
            'Post-build success notification sent to CloudLab.',
            'Cleaning up temporary Docker layers...',
            'Finished: SUCCESS'
        ]}
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (jenkinsStatus.status === 'success') return;

        const runPipeline = async () => {
            dispatch(setJenkinsStatus('running'));

            for (let i = 0; i < STAGE_CONFIG.length; i++) {
                const stage = STAGE_CONFIG[i];
                
                // Start Stage
                dispatch(updateJenkinsStage({ stageIndex: i, status: 'running', log: `Starting Stage: ${stage.name}` }));
                
                // Simulate logs one by one
                for (const logLine of stage.logs) {
                    await new Promise(r => setTimeout(r, stage.duration / stage.logs.length));
                    dispatch(updateJenkinsStage({ stageIndex: i, log: logLine }));
                    setActiveLogs(prev => [...prev.slice(-50), `[${stage.name}] ${logLine}`]);
                }

                // Complete Stage
                dispatch(updateJenkinsStage({ stageIndex: i, status: 'success' }));
            }

            dispatch(setJenkinsStatus('success'));
            dispatch(completeOnboarding());

            setTimeout(() => {
                dispatch(setPreLabPhase('completed'));
            }, 3000);
        };

        if (jenkinsStatus.status === 'idle') {
            runPipeline();
        }
    }, [dispatch]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeLogs]);

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
            {/* Top Navigation Bar (Black) */}
            <nav className="bg-black text-white h-12 px-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-8 h-full">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black border-2 border-white rounded flex items-center justify-center font-black">J</div>
                        <span className="font-bold text-xl tracking-wide">Jenkins</span>
                    </div>
                    <div className="relative h-8 w-64">
                         <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                         <input 
                            type="text" 
                            placeholder="Search (Ctrl + K)" 
                            className="bg-white/10 w-full h-full rounded pl-9 text-xs focus:bg-white/20 outline-none border-none transition-all"
                         />
                    </div>
                </div>
                <div className="flex items-center gap-6 h-full text-gray-300 text-xs">
                    <div className="flex items-center gap-4 border-r border-white/20 pr-6 h-1/2 mr-2">
                        <HelpCircle size={16} />
                        <div className="flex items-center gap-1.5">
                            <User size={16} />
                            <span>Cloud User</span>
                        </div>
                    </div>
                    <button className="hover:text-white transition-colors">log out</button>
                </div>
            </nav>

            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-gray-200 h-10 px-6 flex items-center text-[13px] text-gray-500 gap-2">
                <span className="hover:underline cursor-pointer">Dashboard</span>
                <ChevronRight size={14} className="opacity-40" />
                <span className="hover:underline cursor-pointer">CloudLab-Platforms</span>
                <ChevronRight size={14} className="opacity-40" />
                <span className="text-gray-900 font-medium">{repoInfo?.name || 'ims-backend'}</span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col pt-6">
                    <div className="space-y-1.5 mb-10">
                        <SidebarLink active icon={<Activity size={18} />} label="Status" />
                        <SidebarLink icon={<FileText size={18} />} label="Changes" />
                        <SidebarLink icon={<Layout size={18} />} label="Full Stage View" />
                        <SidebarLink icon={<ExternalLink size={18} />} label="Open Blue Ocean" />
                    </div>

                    <div className="flex-1">
                        <h4 className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-4">
                            Build History
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            </div>
                        </h4>
                        
                        <div className="space-y-px border rounded">
                             <BuildRow number="77" status={jenkinsStatus.status} date={currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} time={currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
                             <BuildRow 
                                number="76" status="success" 
                                date={new Date(currentTime.getTime() - 3600000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                                time={new Date(currentTime.getTime() - 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} 
                             />
                             <BuildRow 
                                number="75" status="success" 
                                date={new Date(currentTime.getTime() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                                time={new Date(currentTime.getTime() - 86400000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} 
                             />
                             <BuildRow 
                                number="74" status="success" 
                                date={new Date(currentTime.getTime() - 172800000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                                time={new Date(currentTime.getTime() - 172800000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} 
                             />
                        </div>
                    </div>
                </aside>

                {/* Main Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
                    <div className="max-w-7xl mx-auto">
                        {/* Project Header */}
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-1 bg-green-50 border border-green-200 rounded-full">
                                    <CheckCircle2 className="text-green-600" size={32} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 leading-none mb-2">{repoInfo?.name || 'ims-backend'}</h1>
                                    <p className="text-sm text-gray-500">Full project name: PF4b/{repoInfo?.fullName || 'ims-backend'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-5 py-2 bg-white border border-gray-300 rounded text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-all">
                                    <GitBranch size={16} /> 1 commit
                                </button>
                            </div>
                        </div>

                        {/* Stage View Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Stage View</h2>
                        </div>

                        {/* Jenkins Stage Grid Implementation */}
                        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                            <div className="grid grid-cols-[140px_repeat(6,1fr)] bg-gray-50 border-b border-gray-100">
                                <div className="p-4 border-r border-gray-100"></div>
                                {STAGE_CONFIG.map((stage, idx) => (
                                    <div key={idx} className="p-4 text-center font-bold text-[12px] text-gray-700 leading-tight border-r border-gray-100 last:border-r-0 flex items-center justify-center min-h-[60px]">
                                        {stage.name}
                                    </div>
                                ))}
                            </div>

                            {/* Average Row */}
                            <div className="grid grid-cols-[140px_repeat(6,1fr)] border-b border-gray-100 bg-[#fafafa]">
                                <div className="p-3 text-[11px] text-gray-500 flex flex-col justify-center items-center border-r border-gray-100">
                                    <span className="font-bold opacity-60">Average stage times:</span>
                                    <span className="mt-1">(full run time: ~5min 14s)</span>
                                </div>
                                {STAGE_CONFIG.map((stage, idx) => (
                                    <div key={idx} className="relative p-0 h-[60px] border-r border-gray-100 last:border-r-0">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">
                                            {idx === 2 ? '4min 58s' : idx === 5 ? '4s' : idx === 3 || idx === 4 ? '2s' : '1s'}
                                        </div>
                                        <div className="absolute bottom-0 left-[10%] right-[10%] h-[4px] bg-gray-200 rounded-full">
                                            <div className="h-full bg-blue-500 rounded-full w-2/3 opacity-30"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Current Build Row (#77) */}
                            <div className="grid grid-cols-[140px_repeat(6,1fr)] group hover:bg-gray-50 transition-colors">
                                <div className="p-5 border-r border-gray-100 flex flex-col items-center justify-center relative">
                                    <div className="bg-[#4b758b] text-white text-[11px] px-1.5 py-0.5 rounded font-bold shadow-sm mb-1 self-start">#77</div>
                                    <div className="text-[10px] text-gray-400 font-mono mb-2 text-center">
                                        {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br/>
                                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </div>
                                    <div className="bg-gray-500 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-1 font-bold">
                                        <GitBranch size={10} /> 1 commit
                                    </div>
                                </div>

                                {STAGE_CONFIG.map((stage, idx) => {
                                    const stageStatus = jenkinsStatus.stages[idx]?.status || 'idle';
                                    return (
                                        <div key={idx} className={`relative p-0 border-r border-gray-100 last:border-r-0 h-[100px] flex items-center justify-center transition-all duration-300 ${
                                            stageStatus === 'running' ? 'bg-[#e7f3ff] animate-pulse' :
                                            stageStatus === 'success' ? 'bg-[#dbf3cc]' : 'bg-transparent'
                                        }`}>
                                            <div className={`font-mono text-sm font-bold ${
                                                stageStatus === 'running' ? 'text-blue-700' :
                                                stageStatus === 'success' ? 'text-green-700' : 'text-gray-300'
                                            }`}>
                                                {stageStatus === 'running' ? (
                                                     <div className="flex flex-col items-center gap-1">
                                                        <Loader2 size={16} className="animate-spin" />
                                                        <span className="text-[10px]">Processing...</span>
                                                     </div>
                                                ) : stageStatus === 'success' ? (
                                                    idx === 2 ? '5min 3s' : idx === 5 ? '5s' : idx === 3 || idx === 4 ? '2s' : '1s'
                                                ) : '-'}
                                            </div>
                                            {stageStatus === 'running' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Realistic Console Log Panel */}
                        <div className="mt-12 bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                             <div className="bg-[#333] px-6 py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TerminalIcon className="text-gray-400" size={16} />
                                    <span className="text-xs font-mono text-gray-300 uppercase tracking-widest font-bold">Pipeline Console Output</span>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">Build ID: f781b-992a-c21</div>
                             </div>
                             <div 
                                ref={scrollRef}
                                className="p-8 h-[400px] overflow-y-auto font-mono text-[13px] text-[#00ff00] bg-black leading-relaxed"
                             >
                                <div className="mb-4 text-blue-400">Started by user CLOUD_LAB_AUTOMATION</div>
                                <div className="mb-4 text-gray-500">[Pipeline] Start of pipeline</div>
                                
                                {activeLogs.map((log, i) => (
                                    <div key={i} className="mb-1 flex gap-2">
                                        <span className="opacity-30 select-none">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={log.includes('Starting Stage') ? 'text-yellow-400 font-bold' : ''}>
                                            {log}
                                        </span>
                                    </div>
                                ))}

                                {jenkinsStatus.status === 'success' && (
                                    <div className="mt-6 pt-6 border-t border-green-500/20">
                                        <div className="text-white bg-green-900/30 p-4 rounded border border-green-500/40">
                                            [SUCCESS] Build completed in 4 min 23 sec
                                            <br/>[Pipeline] End of pipeline
                                            <br/>Finished: SUCCESS
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-white animate-bounce">
                                            <ChevronRight size={18} /> 📦 Deployment Persistent: Switching to AWS Management Console...
                                        </div>
                                    </div>
                                ) || (
                                    <div className="animate-pulse inline-block ml-1">_</div>
                                )}
                             </div>
                        </div>

                        {/* Learning Context Widget */}
                        <div className="mt-8 bg-white border-l-4 border-aws-orange p-6 rounded shadow-sm">
                             <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                <HelpCircle size={18} className="text-aws-orange" />
                                Real-World AWS Deployment Flow
                             </h4>
                             <p className="text-sm text-gray-600 leading-relaxed italic">
                                "In a production environment, you don't just 'copy' files. Your pipeline builds a hardened **Docker image**, 
                                pushes it to **ECR (Elastic Container Registry)**, and then updates your **ECS (Elastic Container Service)** 
                                with a new **Task Definition**. This ensures your application is isolated, scalable, and version-controlled. 
                                CloudLab automates this entire process for you."
                             </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const SidebarLink = ({ icon, label, active }) => (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
        active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}>
        <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
        {label}
    </div>
);

const BuildRow = ({ number, status, date, time }) => (
    <div className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0 cursor-pointer">
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
                <span className="text-[13px] font-bold text-blue-600 hover:underline">#{number}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5">{date}</span>
        </div>
        <div className="text-[10px] font-medium text-gray-400">{time}</div>
    </div>
);

export default JenkinsConsole;
