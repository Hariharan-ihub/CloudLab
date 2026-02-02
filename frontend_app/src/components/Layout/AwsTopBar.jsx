import React, { useState, useRef, useEffect } from 'react';
import { Bell, HelpCircle, ChevronDown, User, Search, Settings, LogOut, ArrowRight, Check, Terminal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

const REGIONS = [
    { code: 'us-east-1', name: 'US East (N. Virginia)' },
    { code: 'us-east-2', name: 'US East (Ohio)' },
    { code: 'us-west-1', name: 'US West (N. California)' },
    { code: 'us-west-2', name: 'US West (Oregon)' },
    { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
    { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
    { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
    { code: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
    { code: 'eu-central-1', name: 'Europe (Frankfurt)' },
    { code: 'eu-west-1', name: 'Europe (Ireland)' },
    { code: 'eu-west-2', name: 'Europe (London)' },
    { code: 'sa-east-1', name: 'South America (Sao Paulo)' }
];

const AwsTopBar = ({ onToggleCloudShell }) => {
    const [openMenu, setOpenMenu] = useState(null); // 'services', 'region', 'user', 'notifications'
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
    
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { activeLab } = useSelector(state => state.lab);
    const topBarRef = useRef(null);

    // ... (keep useEffect) ...

    const handleResourceClick = (e, resourceLink) => {
        if (activeLab) {
            const serviceName = resourceLink.split('/service/')[1];
            if (activeLab.service.toLowerCase() === serviceName) {
                e.preventDefault();
                // Find the step that expects this navigation
                const step = activeLab.steps.find(s => s.validationLogic?.type === 'URL_CONTAINS' && resourceLink.includes(s.validationLogic.value));
                if (step) {
                    dispatch(import('../../store/simulationSlice').then(mod => mod.validateStep({
                        userId: 'user-123',
                        labId: activeLab.labId,
                        stepId: step.stepId,
                        action: 'NAVIGATE',
                        payload: { url: resourceLink }
                    })));
                } // Using dynamic import to avoid circ dep if any, or just import at top
                toast.success(`You are already in the ${activeLab.service} Lab context.`);
                setSearchQuery('');
                setShowResults(false);
                return;
            }
        }
        setShowResults(false); 
        setSearchQuery('');
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (topBarRef.current && !topBarRef.current.contains(event.target)) {
                setOpenMenu(null);
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    // Flatten logic for search
    const allResources = [
        { type: 'Service', name: 'EC2', id: 'Compute', link: '/service/ec2' },
        { type: 'Service', name: 'S3', id: 'Storage', link: '/service/s3' },
        { type: 'Service', name: 'VPC', id: 'Networking', link: '/service/vpc' },
        { type: 'Service', name: 'IAM', id: 'Security', link: '/service/iam' },
        { type: 'Service', name: 'Secrets Manager', id: 'Security', link: '/service/secretsmanager' },
        { type: 'Service', name: 'CloudWatch', id: 'Management', link: '/service/cloudwatch' },
        ...(resources.ec2 || []).map(r => ({ ...r, type: 'EC2', name: r.state.name, id: r.state.instanceId, link: '/service/ec2' })),
        ...(resources.s3 || []).map(r => ({ ...r, type: 'S3', name: r.state.bucketName, id: r.state.bucketName, link: '/service/s3' })),
        ...(resources.vpc || []).map(r => ({ ...r, type: 'VPC', name: r.state.name, id: r.state.vpcId, link: '/service/vpc' })),
        ...(resources.iam || []).map(r => ({ ...r, type: 'IAM User', name: r.state.userName, id: r.state.userName, link: '/service/iam' })),
        ...(resources.secrets || []).map(r => ({ ...r, type: 'Secret', name: r.state.name, id: r.state.name, link: '/service/secretsmanager' })),
        ...(resources.logGroups || []).map(r => ({ ...r, type: 'Log Group', name: r.state.logGroupName, id: r.state.logGroupName, link: '/service/cloudwatch' }))
    ];

    const filteredResources = searchQuery 
        ? allResources.filter(r => r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.id?.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    return (
        <header ref={topBarRef} className="bg-aws-nav text-white h-[50px] flex items-center justify-between px-4 shadow-md z-50 relative select-none">
            {/* Left: Logo & Services */}
            <div className="flex items-center space-x-4 flex-1">
                <Link to="/" className="font-bold text-lg tracking-tight flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
                    {/* <span className="text-aws-orange mr-2 text-2xl">☁️</span>  */}
                    <span className="hidden md:inline">Cloud Lab</span>
                </Link>
                
                <div className="relative flex-shrink-0">
                    <button 
                        className={`flex items-center text-sm font-bold px-3 py-1.5 rounded transition-colors ${openMenu === 'services' ? 'bg-aws-navHover text-aws-orange' : 'hover:text-aws-orange'}`}
                        onClick={() => toggleMenu('services')}
                    >
                        Services <ChevronDown size={14} className={`ml-1 transition-transform ${openMenu === 'services' ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Services Dropdown */}
                    {openMenu === 'services' && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white text-gray-800 shadow-xl rounded border border-gray-200 p-2 animate-fade-in z-50">
                            <div className="py-2">
                                <Link to="/service/ec2" className="block px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => setOpenMenu(null)}>Compute (EC2)</Link>
                                <Link to="/service/s3" className="block px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => setOpenMenu(null)}>Storage (S3)</Link>
                                <div className="border-t my-1"></div>
                                <Link to="/service/vpc" className="block px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => setOpenMenu(null)}>VPC & Networking</Link>
                                <Link to="/service/iam" className="block px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => setOpenMenu(null)}>IAM & Security</Link>
                                <div className="border-t my-1"></div>
                                <Link to="/service/secretsmanager" className="block px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => setOpenMenu(null)}>Secrets Manager</Link>
                                <Link to="/service/cloudwatch" className="block px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => setOpenMenu(null)}>CloudWatch</Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative w-full max-w-xl mx-4">
                     <div className="relative">
                         <input 
                            type="text" 
                            className="w-full bg-gray-700 border border-gray-600 rounded px-9 py-1 text-sm focus:outline-none focus:bg-white focus:text-black focus:border-aws-blue transition-colors placeholder-gray-400"
                            placeholder="Search for resources, services, etc..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                         />
                         <Search size={14} className="absolute left-3 top-2 text-gray-400 pointer-events-none"/>
                     </div>
                     
                     {/* Search Results Dropdown */}
                     {showResults && searchQuery && (
                         <div className="absolute top-full left-0 right-0 mt-1 bg-white text-gray-800 shadow-xl rounded border border-gray-200 z-50 max-h-96 overflow-y-auto">
                             {filteredResources.length > 0 ? (
                                 <div>
                                     <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b">Resources</div>
                                     {filteredResources.map((r, i) => (
                                         <Link 
                                            key={i}
                                            to={r.link}
                                            className="px-4 py-3 hover:bg-blue-50 border-b flex justify-between items-center group cursor-pointer"
                                            onClick={(e) => handleResourceClick(e, r.link)}
                                         >
                                             <div>
                                                 <div className="font-bold text-aws-blue text-sm">{r.name}</div>
                                                 <div className="text-xs text-gray-500">{r.type} • {r.id}</div>
                                             </div>
                                             <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-aws-blue"/>
                                         </Link>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="p-4 text-sm text-gray-500 text-center">No matching resources found.</div>
                             )}
                         </div>
                     )}
                </div>
            </div>

            {/* Right: Region, Tools, User */}
            <div className="flex items-center space-x-2 md:space-x-4 h-full flex-shrink-0">
                
                {/* Region Selector */}
                <div className="relative h-full flex items-center">
                    <button 
                        className={`hidden md:flex items-center px-2 py-1 rounded cursor-pointer transition-colors text-xs font-bold ${openMenu === 'region' ? 'bg-aws-navHover text-aws-orange' : 'hover:bg-aws-navHover text-aws-orange'}`}
                        onClick={() => toggleMenu('region')}
                    >
                        {selectedRegion.name}
                        <ChevronDown size={14} className="ml-1" />
                    </button>
                    
                    {/* Region Dropdown */}
                     {openMenu === 'region' && (
                        <div className="absolute top-full right-0 mt-1 w-64 bg-white text-gray-800 shadow-xl rounded border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b sticky top-0 bg-white">Select a Region</div>
                             {REGIONS.map((region) => (
                                 <div 
                                    key={region.code}
                                    className={`px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer flex justify-between items-center ${selectedRegion.code === region.code ? 'text-aws-blue bg-blue-50' : 'text-gray-700'}`}
                                    onClick={() => {
                                        setSelectedRegion(region);
                                        setOpenMenu(null);
                                    }}
                                 >
                                     <span className="truncate mr-2">{region.name}</span> 
                                     <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{region.code}</span>
                                     {selectedRegion.code === region.code && <Check size={14} className="ml-2 text-aws-blue" />}
                                 </div>
                             ))}
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative">
                     <button 
                        className={`p-2 rounded hover:text-white transition-colors ${openMenu === 'notifications' ? 'text-white' : 'text-gray-300'}`}
                        onClick={() => toggleMenu('notifications')}
                     >
                        <Bell size={18} />
                     </button>
                      {openMenu === 'notifications' && (
                        <div className="absolute top-full right-0 mt-1 w-72 bg-white text-gray-800 shadow-xl rounded border border-gray-200 z-50">
                            <div className="p-3 border-b font-bold text-sm bg-gray-50 rounded-t">Notifications</div>
                            <div className="p-4 text-sm text-gray-500 text-center">No new notifications.</div>
                        </div>
                    )}
                </div>

                <button 
                    className="text-gray-300 hover:text-white p-2"
                    onClick={onToggleCloudShell}
                    title="CloudShell"
                >
                    <Terminal size={18} />
                </button>
                <button className="text-gray-300 hover:text-white p-2"><HelpCircle size={18} /></button>


                {/* User Menu */}
                <div className="relative h-full flex items-center">
                    <button 
                        className={`flex items-center cursor-pointer hover:text-white transition-colors p-1 ${openMenu === 'user' ? 'text-white' : 'text-gray-300'}`}
                        onClick={() => toggleMenu('user')}
                    >
                        <User size={18} className="mr-1" />
                        <span className="text-sm font-bold hidden md:inline">Student</span>
                        <ChevronDown size={14} className="ml-1" />
                    </button>

                     {openMenu === 'user' && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white text-gray-800 shadow-xl rounded border border-gray-200 py-1 z-50">
                             <div className="px-4 py-2 border-b text-xs text-gray-500">
                                 Account ID: 1234-5678-9012
                             </div>
                             <Link to="/settings" className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setOpenMenu(null)}>
                                 <Settings size={14} className="mr-2"/> Settings
                             </Link>
                             <div className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer text-red-600">
                                 <LogOut size={14} className="mr-2"/> Sign Out
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AwsTopBar;
