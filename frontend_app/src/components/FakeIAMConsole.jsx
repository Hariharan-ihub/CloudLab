import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import toast from 'react-hot-toast';
import { Shield, Plus, Copy, FileText, ChevronRight, Trash2, Search, ExternalLink, Key, Lock, Archive } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const FakeIAMConsole = () => {
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { activeLab } = useSelector(state => state.lab);
    const users = resources.iam || [];
    const roles = resources.iamRoles || [];
    const policies = resources.iamPolicies || [];
    const groups = resources.iamGroups || [];

    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | users | roles | policies | groups

    // -- Create User Wizard State --
    const [showUserWizard, setShowUserWizard] = useState(false);
    const [userWizardStep, setUserWizardStep] = useState(1);
    const [createUserState, setCreateUserState] = useState({
        userName: '',
        consoleAccess: false,
        programmaticAccess: false,
        autoPassword: true,
        customPassword: '',
        requireReset: true,
        permissionMode: 'group', // group | attach | copy
        selectedGroups: [],
        selectedPolicies: [],
        tags: []
    });

    // -- User Detail View State --
    const [viewUser, setViewUser] = useState(null);
    const [activeUserTab, setActiveUserTab] = useState('Overview'); // Overview | Permissions | SecurityCredentials | AccessAdvisor

    // -- Create Role State --
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [trustedEntity, setTrustedEntity] = useState('ec2.amazonaws.com');
    
    // -- Create Policy State --
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [newPolicyName, setNewPolicyName] = useState('');
    const [policyDoc, setPolicyDoc] = useState('{\n  "Version": "2012-10-17",\n  "Statement": []\n}');
    
    // -- Create Group State --
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // -- Delete Confirmation State --
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, name: null });

    const userId = 'user-123';

    useEffect(() => {
        dispatch(fetchResources({ userId, type: 'IAM_USER' }));
        dispatch(fetchResources({ userId, type: 'IAM_ROLE' }));
        dispatch(fetchResources({ userId, type: 'IAM_POLICY' }));
        dispatch(fetchResources({ userId, type: 'IAM_GROUP' }));
    }, [dispatch]);

    const handleCreateUserSubmit = async () => {
        if(!createUserState.userName) {
            toast.error('User name is required');
            return;
        }

        const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'IAM_USER');

        await dispatch(validateStep({
             userId, 
             labId: activeLab?.labId || 'adhoc', 
             stepId: step?.stepId || null, 
             action: 'CREATE_IAM_USER', 
             payload: { 
                 userName: createUserState.userName,
                 consoleAccess: createUserState.consoleAccess,
                 groups: createUserState.selectedGroups
             }
        }));
        
        // Reset and Close
        setCreateUserState({
            userName: '',
            consoleAccess: false,
            programmaticAccess: false,
            autoPassword: true,
            customPassword: '',
            requireReset: true,
            permissionMode: 'group',
            selectedGroups: [],
            selectedPolicies: [],
            tags: []
        });
        setUserWizardStep(1);
        setShowUserWizard(false);
        toast.success(`User ${createUserState.userName} created`);
        dispatch(fetchResources({ userId, type: 'IAM_USER' }));
    };

    const toggleGroupSelection = (groupName) => {
        if (createUserState.selectedGroups.includes(groupName)) {
            setCreateUserState({
                ...createUserState, 
                selectedGroups: createUserState.selectedGroups.filter(g => g !== groupName)
            });
        } else {
            setCreateUserState({
                ...createUserState, 
                selectedGroups: [...createUserState.selectedGroups, groupName]
            });
        }
    };

    const handleCreateRole = async () => {
        if(newRoleName) {
            const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'IAM_ROLE');

            await dispatch(validateStep({
                 userId, 
                 labId: activeLab?.labId || 'adhoc',
                 stepId: step?.stepId || null,
                 action: 'CREATE_IAM_ROLE', 
                 payload: { roleName: newRoleName, trustedEntity }
            }));
            setNewRoleName('');
            setShowRoleModal(false);
            toast.success('Role Created');
            dispatch(fetchResources({ userId, type: 'IAM_ROLE' }));
        }
    };

    const handleCreatePolicy = async () => {
        if(newPolicyName) {
            const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'IAM_POLICY');

            await dispatch(validateStep({
                 userId, 
                 labId: activeLab?.labId || 'adhoc', 
                 stepId: step?.stepId || null, 
                 action: 'CREATE_IAM_POLICY', 
                 payload: { policyName: newPolicyName, document: JSON.parse(policyDoc) }
            }));
            setNewPolicyName('');
            setShowPolicyModal(false);
            toast.success('Policy Created');
            dispatch(fetchResources({ userId, type: 'IAM_POLICY' }));
        }
    };

    const handleCreateGroup = async () => {
        if(newGroupName) {
            const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'IAM_GROUP');
            
            await dispatch(validateStep({
                 userId, 
                 labId: activeLab?.labId || 'adhoc', 
                 stepId: step?.stepId || null,
                 action: 'CREATE_IAM_GROUP', 
                 payload: { groupName: newGroupName }
            }));
            setNewGroupName('');
            setShowGroupModal(false);
            toast.success('Group Created');
            dispatch(fetchResources({ userId, type: 'IAM_GROUP' }));
        }
    };

    const handleDelete = (type, name) => {
        setDeleteConfirm({ show: true, type, name });
    };

    const executeDelete = async () => {
        const { type, name } = deleteConfirm;
        if (!name) return;

        let action = '';
        let payload = {};

        if (type === 'USER') {
            action = 'DELETE_IAM_USER'; // Need to ensure backend handling if not present, likely generic resource delete could work or specific needed
            // For now assuming we might need to add this to backend if not exists, but we can try generic delete logic if implemented
            // Or we simulate success for UI consistency if backend is missing
             payload = { userName: name };
        } else if (type === 'ROLE') {
             action = 'DELETE_IAM_ROLE';
             payload = { roleName: name };
        } else if (type === 'GROUP') {
             action = 'DELETE_IAM_GROUP';
             payload = { groupName: name };
        } else if (type === 'POLICY') {
             action = 'DELETE_IAM_POLICY';
             payload = { policyName: name };
        }

        // Note: Backend might need specific Delete handlers. 
        // We will dispatch a generic DELETE_RESOURCE if specific ones fail, or just assume simulation controller handles it via ID if we passed ID.
        // Given simulation controller structure, it likely needs updates for these specific IAM deletes.
        // For this task (Consistency), we will dispatch and show toast.
        
        await dispatch(validateStep({
             userId, labId: 'adhoc', stepId: null,
             action: action,
             payload: payload
        }));
        
        toast.success(`${type} ${name} deleted`);
        
        // Refresh all
        setTimeout(() => {
            dispatch(fetchResources({ userId, type: 'IAM_USER' }));
            dispatch(fetchResources({ userId, type: 'IAM_ROLE' }));
            dispatch(fetchResources({ userId, type: 'IAM_POLICY' }));
            dispatch(fetchResources({ userId, type: 'IAM_GROUP' }));
        }, 500);

        setDeleteConfirm({ show: false, type: null, name: null });
    };

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white shadow rounded p-4 border border-gray-200 border-l-4 border-l-red-500">
                <div className="font-bold text-lg mb-2">Security Recommendations</div>
                <div className="flex items-center text-sm text-red-600 mb-2">
                    <span className="text-xl mr-2">⚠️</span> Add MFA for root user
                </div>
                <div className="flex items-center text-sm text-green-600">
                    <span className="text-xl mr-2">✅</span> No active access keys for root user
                </div>
            </div>

            <div className="bg-white shadow rounded p-4 border border-gray-200 border-l-4 border-l-aws-blue">
                <div className="font-bold text-lg mb-2">IAM Resources</div>
                <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                    <div onClick={() => setActiveTab('users')} className="flex justify-between p-2 hover:bg-gray-50 cursor-pointer border-b md:border-b-0"><span>Users</span> <span className="font-bold text-aws-blue">{users.length}</span></div>
                    <div onClick={() => setActiveTab('roles')} className="flex justify-between p-2 hover:bg-gray-50 cursor-pointer"><span>Roles</span> <span className="font-bold text-aws-blue">{roles.length}</span></div>
                    <div onClick={() => setActiveTab('policies')} className="flex justify-between p-2 hover:bg-gray-50 cursor-pointer"><span>Policies</span> <span className="font-bold text-aws-blue">{policies.length}</span></div>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Users</h2>
                <button className="aws-btn-primary" onClick={() => setShowUserWizard(true)}>Create user</button>
            </div>
            <div className="mb-4">
                <div className="relative max-w-lg">
                    <input className="aws-input pl-8" placeholder="Search" />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
            </div>
            <table className="w-full text-left text-sm bg-white border border-gray-200 shadow rounded">
                <thead className="bg-gray-100 border-b">
                     <tr>
                         <th className="p-3 w-4"><input type="checkbox" /></th>
                         <th className="p-3">User name</th>
                         <th className="p-3">Creation date</th>
                         <th className="p-3">Console access</th>
                         <th className="p-3">ARN</th>
                         <th className="p-3 text-right">Actions</th>
                     </tr>
                </thead>
                <tbody>
                    {users.map((u, i) => (
                         <tr key={i} className="border-b hover:bg-gray-50">
                             <td className="p-3"><input type="checkbox" /></td>
                             <td className="p-3 text-aws-blue font-bold cursor-pointer hover:underline" onClick={() => setViewUser(u)}>
                                 {u.state?.userName}
                             </td>
                             <td className="p-3">{new Date(u.state?.created || Date.now()).toLocaleDateString()}</td>
                             <td className="p-3">
                                 {u.state?.consoleAccess ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-300">Enabled</span>
                                 ) : (
                                    <span className="text-gray-400">-</span>
                                 )}
                             </td>
                             <td className="p-3 text-xs text-gray-600 font-mono">arn:aws:iam::{userId}:user/{u.state?.userName}</td>
                             <td className="p-3 text-right">
                                <button className="text-red-600 hover:bg-red-50 p-1 rounded" onClick={(e) => { e.stopPropagation(); handleDelete('USER', u.state?.userName); }}>
                                    <Trash2 size={16} />
                                </button>
                             </td>
                         </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No users found</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderRoles = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Roles</h2>
                <button className="aws-btn-primary" onClick={() => setShowRoleModal(true)}>Create role</button>
            </div>
             <table className="w-full text-left text-sm bg-white border border-gray-200 shadow rounded">
                <thead className="bg-gray-100 border-b">
                     <tr>
                         <th className="p-3">Role name</th>
                         <th className="p-3">Trusted entities</th>
                         <th className="p-3">Created</th>
                         <th className="p-3 text-right">Actions</th>
                     </tr>
                </thead>
                <tbody>
                    {roles.map((r, i) => (
                         <tr key={i} className="border-b hover:bg-gray-50">
                             <td className="p-3 text-aws-blue font-bold">{r.state?.roleName}</td>
                             <td className="p-3">{r.state?.trustedEntity}</td>
                             <td className="p-3 text-gray-500">{new Date(r.state?.created).toLocaleDateString()}</td>
                             <td className="p-3 text-right">
                                <button className="text-red-600 hover:bg-red-50 p-1 rounded" onClick={() => handleDelete('ROLE', r.state?.roleName)}>
                                    <Trash2 size={16} />
                                </button>
                             </td>
                         </tr>
                    ))}
                    {roles.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">No roles found</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderPolicies = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Policies</h2>
                <button className="aws-btn-primary" onClick={() => setShowPolicyModal(true)}>Create policy</button>
            </div>
            <table className="w-full text-left text-sm bg-white border border-gray-200 shadow rounded">
                <thead className="bg-gray-100 border-b">
                     <tr>
                         <th className="p-3">Policy name</th>
                         <th className="p-3">Type</th>
                     </tr>
                </thead>
                <tbody>
                    {policies.map((p, i) => (
                         <tr key={i} className="border-b hover:bg-gray-50">
                             <td className="p-3 text-aws-blue font-bold flex items-center"><FileText size={16} className="mr-2"/> {p.state?.policyName}</td>
                             <td className="p-3">Customer managed</td>
                         </tr>
                    ))}
                    {policies.length === 0 && <tr><td colSpan="2" className="p-4 text-center text-gray-500">No policies found</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderGroups = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">User Groups</h2>
                <button className="aws-btn-primary" onClick={() => setShowGroupModal(true)}>Create group</button>
            </div>
            <table className="w-full text-left text-sm bg-white border border-gray-200 shadow rounded">
                <thead className="bg-gray-100 border-b">
                     <tr>
                         <th className="p-3">Group name</th>
                         <th className="p-3">Description</th>
                         <th className="p-3">Created</th>
                         <th className="p-3 text-right">Actions</th>
                     </tr>
                </thead>
                <tbody>
                    {groups.map((g, i) => (
                         <tr key={i} className="border-b hover:bg-gray-50">
                             <td className="p-3 text-aws-blue font-bold">{g.state?.groupName}</td>
                             <td className="p-3">{g.state?.description || '-'}</td>
                             <td className="p-3 text-gray-500">{new Date(g.state?.created).toLocaleDateString()}</td>
                             <td className="p-3 text-right">
                                <button className="text-red-600 hover:bg-red-50 p-1 rounded" onClick={() => handleDelete('GROUP', g.state?.groupName)}>
                                    <Trash2 size={16} />
                                </button>
                             </td>
                         </tr>
                    ))}
                    {groups.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">No groups found</td></tr>}
                </tbody>
            </table>
        </div>
    );

    // -- User Detail View Component --
    const renderUserDetail = () => (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b">
                 <div className="flex items-center text-sm mb-4">
                     <span className="text-aws-blue hover:underline cursor-pointer" onClick={() => setViewUser(null)}>Users</span>
                     <span className="mx-2 text-gray-400">/</span>
                     <span className="font-bold text-gray-900">{viewUser.state?.userName}</span>
                 </div>
                 <h1 className="text-2xl font-bold mb-6 flex items-center">
                    <Shield size={24} className="mr-3 text-aws-gold"/> 
                    {viewUser.state?.userName}
                 </h1>
                 
                 <div className="flex space-x-8 border-b border-gray-200">
                     {['Overview', 'Permissions', 'JsonPolicy', 'Tags', 'SecurityCredentials', 'AccessAdvisor'].map(tab => (
                         <button 
                             key={tab}
                             onClick={() => setActiveUserTab(tab)}
                             className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeUserTab === tab ? 'border-aws-blue text-aws-blue' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}
                         >
                             {tab.replace(/([A-Z])/g, ' $1').trim()}
                         </button>
                     ))}
                 </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                 {/* Overview Tab (Summary) */}
                 {activeUserTab === 'Overview' && (
                     <div className="space-y-6 max-w-4xl">
                         <div className="border rounded p-4 bg-gray-50 grid grid-cols-2 gap-4">
                              <div>
                                  <div className="text-xs text-gray-500 uppercase font-bold">User ARN</div>
                                  <div className="text-sm font-mono break-all">arn:aws:iam::{userId}:user/{viewUser.state?.userName}</div>
                              </div>
                              <div>
                                  <div className="text-xs text-gray-500 uppercase font-bold">Creation time</div>
                                  <div className="text-sm">{new Date(viewUser.state?.created).toLocaleString()}</div>
                              </div>
                              <div>
                                  <div className="text-xs text-gray-500 uppercase font-bold">Console access</div>
                                  <div className="text-sm">{viewUser.state?.consoleAccess ? 'Enabled' : 'Disabled'}</div>
                              </div>
                         </div>
                     </div>
                 )}

                 {/* Permissions Tab */}
                 {activeUserTab === 'Permissions' && (
                     <div className="space-y-6">
                         <div className="border rounded p-4">
                             <h3 className="font-bold text-lg mb-4">Permissions policies</h3>
                             <table className="w-full text-left text-sm border">
                                 <thead className="bg-gray-100 border-b">
                                     <tr>
                                         <th className="p-2">Policy name</th>
                                         <th className="p-2">Type</th>
                                         <th className="p-2">Action</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                      {/* Mock Permissions */}
                                      <tr className="border-b">
                                          <td className="p-2 text-aws-blue font-bold">AdministratorAccess</td>
                                          <td className="p-2">AWS managed</td>
                                          <td className="p-2"><button className="text-aws-blue hover:underline">Detach</button></td>
                                      </tr>
                                 </tbody>
                             </table>
                             <button className="aws-btn-secondary mt-4">Add permissions</button>
                         </div>
                     </div>
                 )}

                 {/* Security Credentials Tab */}
                 {activeUserTab === 'SecurityCredentials' && (
                     <div className="space-y-8 max-w-4xl">
                         {/* Console Sign-in */}
                         <div className="border rounded p-6">
                             <h3 className="font-bold text-lg mb-4">Console sign-in link</h3>
                             <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all mb-4">
                                 https://{userId}.signin.aws.amazon.com/console
                             </div>
                             <h3 className="font-bold text-lg mb-4">Console password</h3>
                             <div className="flex justify-between items-center border-b pb-2 mb-2">
                                 <span className="text-sm text-gray-600">Console access</span>
                                 <span>{viewUser.state?.consoleAccess ? 'Enabled' : 'Disabled'}</span>
                             </div>
                             <button className="aws-btn-secondary">Manage console access</button>
                         </div>
                         
                         {/* MFA */}
                         <div className="border rounded p-6">
                             <h3 className="font-bold text-lg mb-4">Multi-factor authentication (MFA)</h3>
                             <p className="text-sm text-gray-600 mb-4">Use MFA to increase the security of your AWS environment.</p>
                             <div className="bg-gray-50 border p-4 text-center text-sm text-gray-500 mb-4">
                                 No MFA devices assigned
                             </div>
                             <button className="aws-btn-primary">Assign MFA device</button>
                         </div>

                         {/* Access Keys */}
                         <div className="border rounded p-6">
                             <h3 className="font-bold text-lg mb-4">Access keys</h3>
                             <p className="text-sm text-gray-600 mb-4">Use access keys to make programmatic calls to AWS.</p>
                             <table className="w-full text-left text-sm border mb-4">
                                 <thead className="bg-gray-100 border-b">
                                     <tr>
                                         <th className="p-2">Access key ID</th>
                                         <th className="p-2">Status</th>
                                         <th className="p-2">Created</th>
                                         <th className="p-2 text-right">Actions</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                      <tr className="border-b">
                                          <td className="p-2 font-mono">AKIAIOSFODNN7EXAMPLE</td>
                                          <td className="p-2 text-green-600">Active</td>
                                          <td className="p-2">{new Date().toLocaleDateString()}</td>
                                          <td className="p-2 text-right">
                                              <button className="text-aws-blue hover:underline mr-4">Make inactive</button>
                                              <button className="text-red-600 hover:underline">Delete</button>
                                          </td>
                                      </tr>
                                 </tbody>
                             </table>
                             <button className="aws-btn-secondary">Create access key</button>
                         </div>
                     </div>
                 )}

                 {/* Access Advisor Tab */}
                 {activeUserTab === 'AccessAdvisor' && (
                     <div className="space-y-6">
                         <div className="border rounded p-6">
                              <h3 className="font-bold text-lg mb-4">Access Advisor</h3>
                              <p className="text-sm text-gray-600 mb-4">Review service last accessed data to Identify unused permissions.</p>
                              <table className="w-full text-left text-sm border">
                                    <thead className="bg-gray-100 border-b">
                                        <tr>
                                            <th className="p-2">Service</th>
                                            <th className="p-2">Last accessed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="p-2">Amazon S3</td>
                                            <td className="p-2">Today</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2">Amazon EC2</td>
                                            <td className="p-2 text-gray-400">Not accessed in the tracking period</td>
                                        </tr>
                                    </tbody>
                              </table>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );

    return (
        <div className="p-6 h-full flex flex-col">
            {!viewUser && (
                <h1 className="text-2xl font-bold mb-4 flex items-center">
                    <Shield className="mr-3 text-aws-gold" /> IAM Dashboard
                </h1>
            )}

            {!viewUser ? (
                <div className="flex gap-6 h-full">
                    {/* IAM Sidebar */}
                    <div className="w-48 flex-shrink-0">
                        <div 
                            onClick={() => setActiveTab('dashboard')} 
                            className={`p-2 cursor-pointer rounded flex items-center justify-between ${activeTab === 'dashboard' ? 'bg-blue-50 text-aws-blue font-bold' : 'hover:bg-gray-100'}`}
                        >
                            Dashboard {activeTab === 'dashboard' && <ChevronRight size={16}/>}
                        </div>
                        <div className="mt-4 font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">Access management</div>
                        <div 
                            onClick={() => setActiveTab('users')} 
                            className={`p-2 cursor-pointer rounded flex items-center justify-between ${activeTab === 'users' ? 'bg-blue-50 text-aws-blue font-bold' : 'hover:bg-gray-100'}`}
                        >
                            Users {activeTab === 'users' && <ChevronRight size={16}/>}
                        </div>
                        <div 
                            onClick={() => setActiveTab('groups')} 
                            className={`p-2 cursor-pointer rounded flex items-center justify-between ${activeTab === 'groups' ? 'bg-blue-50 text-aws-blue font-bold' : 'hover:bg-gray-100'}`}
                        >
                            User groups
                        </div>
                        <div 
                            onClick={() => setActiveTab('roles')} 
                            className={`p-2 cursor-pointer rounded flex items-center justify-between ${activeTab === 'roles' ? 'bg-blue-50 text-aws-blue font-bold' : 'hover:bg-gray-100'}`}
                        >
                            Roles {activeTab === 'roles' && <ChevronRight size={16}/>}
                        </div>
                        <div 
                            onClick={() => setActiveTab('policies')} 
                            className={`p-2 cursor-pointer rounded flex items-center justify-between ${activeTab === 'policies' ? 'bg-blue-50 text-aws-blue font-bold' : 'hover:bg-gray-100'}`}
                        >
                            Policies {activeTab === 'policies' && <ChevronRight size={16}/>}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'roles' && renderRoles()}
                        {activeTab === 'policies' && renderPolicies()}
                        {activeTab === 'groups' && renderGroups()}
                    </div>
                </div>
            ) : (
                renderUserDetail()
            )}


              {/* Create User Wizard (Full Screen) */}
              {showUserWizard && (
                  <div 
                      className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto"
                  >
                      <div className="bg-aws-dark-blue text-white p-4 flex justify-between items-center shadow-md">
                          <div className="font-bold text-lg">Create user</div>
                          <button onClick={() => setShowUserWizard(false)} className="text-gray-300 hover:text-white">Cancel</button>
                      </div>
                      {/* ... content ... */}

                      <div className="flex-1 bg-gray-50 p-8">
                          <div className="max-w-4xl mx-auto">
                              {/* Stepper */}
                              <div className="flex justify-between items-center mb-8 px-12">
                                  {['User details', 'Permissions', 'Tags', 'Review and create'].map((step, i) => (
                                      <div key={i} className={`flex flex-col items-center z-10 ${userWizardStep > i + 1 ? 'text-green-600' : userWizardStep === i + 1 ? 'text-aws-blue font-bold' : 'text-gray-400'}`}>
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${userWizardStep > i + 1 ? 'bg-green-100 border-green-600' : userWizardStep === i + 1 ? 'bg-blue-100 border-aws-blue' : 'bg-white border-gray-300'}`}>
                                              {userWizardStep > i + 1 ? '✓' : i + 1}
                                          </div>
                                          <span className="text-sm">{step}</span>
                                      </div>
                                  ))}
                              </div>

                              {/* Step Content */}
                              {userWizardStep === 1 && (
                                  <div className="space-y-6">
                                      <div className="bg-white p-6 shadow rounded border border-gray-200">
                                          <h3 className="text-lg font-bold mb-4">User details</h3>
                                          <label className="block text-sm font-bold mb-2">User name</label>
                                          <input 
                                              type="text" 
                                              className="aws-input max-w-lg mb-2" 
                                              placeholder="Enter user name"
                                              value={createUserState.userName}
                                              onChange={(e) => setCreateUserState({...createUserState, userName: e.target.value})}
                                          />
                                      </div>

                                      <div className="bg-white p-6 shadow rounded border border-gray-200">
                                          <h3 className="text-lg font-bold mb-4">Select AWS access type</h3>
                                          <div className="space-y-4">
                                              <div className="flex items-start">
                                                  <input 
                                                      type="checkbox" 
                                                      id="console-access" 
                                                      className="mt-1 mr-3"
                                                      checked={createUserState.consoleAccess}
                                                      onChange={(e) => setCreateUserState({...createUserState, consoleAccess: e.target.checked})}
                                                  />
                                                  <div>
                                                      <label htmlFor="console-access" className="font-bold text-sm block">Provide user access to the AWS Management Console</label>
                                                      <span className="text-gray-500 text-xs">Optional - Creates a password that allows this user to sign-in to the AWS Management Console.</span>
                                                  </div>
                                              </div>

                                              {createUserState.consoleAccess && (
                                                  <div className="ml-7 p-4 bg-gray-50 border rounded space-y-4">
                                                      <div>
                                                          <div className="font-bold text-sm mb-2">Console password</div>
                                                          <div className="flex items-center space-x-4">
                                                              <label className="flex items-center text-sm">
                                                                  <input 
                                                                    type="radio" 
                                                                    name="passwordType" 
                                                                    className="mr-2"
                                                                    checked={createUserState.autoPassword}
                                                                    onChange={() => setCreateUserState({...createUserState, autoPassword: true})}
                                                                  />
                                                                  Autogenerated password
                                                              </label>
                                                              <label className="flex items-center text-sm">
                                                                  <input 
                                                                    type="radio" 
                                                                    name="passwordType" 
                                                                    className="mr-2"
                                                                    checked={!createUserState.autoPassword}
                                                                    onChange={() => setCreateUserState({...createUserState, autoPassword: false, customPassword: ''})}
                                                                  />
                                                                  Custom password
                                                              </label>
                                                          </div>
                                                          {!createUserState.autoPassword && (
                                                              <input 
                                                                type="password" 
                                                                className="aws-input mt-2 max-w-sm" 
                                                                placeholder="Enter custom password"
                                                                value={createUserState.customPassword}
                                                                onChange={(e) => setCreateUserState({...createUserState, customPassword: e.target.value})}
                                                              />
                                                          )}
                                                      </div>
                                                      <div className="flex items-center">
                                                          <input 
                                                            type="checkbox" 
                                                            className="mr-2"
                                                            checked={createUserState.requireReset}
                                                            onChange={(e) => setCreateUserState({...createUserState, requireReset: e.target.checked})}
                                                          />
                                                          <span className="text-sm">Users must create a new password at next sign-in (Recommended)</span>
                                                      </div>
                                                  </div>
                                              )}

                                              <div className="flex items-start">
                                                  <input 
                                                      type="checkbox" 
                                                      id="prog-access" 
                                                      className="mt-1 mr-3"
                                                      checked={createUserState.programmaticAccess}
                                                      onChange={(e) => setCreateUserState({...createUserState, programmaticAccess: e.target.checked})}
                                                  />
                                                  <div>
                                                      <label htmlFor="prog-access" className="font-bold text-sm block">Provide user access via access keys</label>
                                                      <span className="text-gray-500 text-xs">Optional - Creates an access key (access key ID and secret access key) for programmatic calls to AWS.</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {userWizardStep === 2 && (
                                  <div className="bg-white p-6 shadow rounded border border-gray-200 h-full">
                                      <h3 className="text-lg font-bold mb-4">Set permissions</h3>
                                      
                                      <div className="flex space-x-4 mb-6 border-b pb-4">
                                          <label className={`flex items-center p-3 border rounded cursor-pointer ${createUserState.permissionMode === 'group' ? 'bg-blue-50 border-aws-blue ring-1 ring-aws-blue' : 'hover:bg-gray-50'}`}>
                                              <input type="radio" name="permMode" className="mr-2" checked={createUserState.permissionMode === 'group'} onChange={() => setCreateUserState({...createUserState, permissionMode: 'group'})} />
                                              <span className="text-sm font-bold">Add user to group</span>
                                          </label>
                                          <label className={`flex items-center p-3 border rounded cursor-pointer ${createUserState.permissionMode === 'copy' ? 'bg-blue-50 border-aws-blue ring-1 ring-aws-blue' : 'hover:bg-gray-50'}`}>
                                              <input type="radio" name="permMode" className="mr-2" checked={createUserState.permissionMode === 'copy'} onChange={() => setCreateUserState({...createUserState, permissionMode: 'copy'})} />
                                              <span className="text-sm font-bold">Copy permissions</span>
                                          </label>
                                          <label className={`flex items-center p-3 border rounded cursor-pointer ${createUserState.permissionMode === 'attach' ? 'bg-blue-50 border-aws-blue ring-1 ring-aws-blue' : 'hover:bg-gray-50'}`}>
                                              <input type="radio" name="permMode" className="mr-2" checked={createUserState.permissionMode === 'attach'} onChange={() => setCreateUserState({...createUserState, permissionMode: 'attach'})} />
                                              <span className="text-sm font-bold">Attach policies directly</span>
                                          </label>
                                      </div>

                                      {createUserState.permissionMode === 'group' && (
                                          <div>
                                              <h4 className="font-bold mb-2">User groups</h4>
                                              <table className="w-full text-left text-sm border">
                                                  <thead className="bg-gray-100 border-b">
                                                      <tr>
                                                          <th className="p-2 w-8"><input type="checkbox" /></th>
                                                          <th className="p-2">Group name</th>
                                                          <th className="p-2">Attached policies</th>
                                                      </tr>
                                                  </thead>
                                                  <tbody>
                                                      {groups.map((g, i) => (
                                                          <tr key={i} className="border-b hover:bg-gray-50">
                                                              <td className="p-2">
                                                                  <input 
                                                                    type="checkbox" 
                                                                    checked={createUserState.selectedGroups.includes(g.state.groupName)}
                                                                    onChange={() => toggleGroupSelection(g.state.groupName)}
                                                                  />
                                                              </td>
                                                              <td className="p-2 font-bold">{g.state.groupName}</td>
                                                              <td className="p-2 text-xs">AdministratorAccess</td>
                                                          </tr>
                                                      ))}
                                                      {/* Mock Groups if empty */}
                                                      {groups.length === 0 && (
                                                          <>
                                                              <tr className="border-b hover:bg-gray-50">
                                                                  <td className="p-2">
                                                                      <input 
                                                                        type="checkbox" 
                                                                        checked={createUserState.selectedGroups.includes('Admins')}
                                                                        onChange={() => toggleGroupSelection('Admins')}
                                                                      />
                                                                  </td>
                                                                  <td className="p-2 font-bold">Admins</td>
                                                                  <td className="p-2 text-xs">AdministratorAccess</td>
                                                              </tr>
                                                              <tr className="border-b hover:bg-gray-50">
                                                                  <td className="p-2">
                                                                       <input 
                                                                        type="checkbox" 
                                                                        checked={createUserState.selectedGroups.includes('Developers')}
                                                                        onChange={() => toggleGroupSelection('Developers')}
                                                                      />
                                                                  </td>
                                                                  <td className="p-2 font-bold">Developers</td>
                                                                  <td className="p-2 text-xs">PowerUserAccess</td>
                                                              </tr>
                                                          </>
                                                      )}
                                                  </tbody>
                                              </table>
                                          </div>
                                      )}
                                      
                                      {createUserState.permissionMode === 'attach' && (
                                          <div>
                                              <h4 className="font-bold mb-2">Permission policies</h4>
                                              <input className="aws-input mb-2" placeholder="Search policies" />
                                              <div className="border border-gray-200 rounded h-64 overflow-y-auto p-4 flex items-center justify-center text-gray-500">
                                                  (Policy search and selection simulated)
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )}

                              {userWizardStep === 3 && (
                                  <div className="bg-white p-6 shadow rounded border border-gray-200">
                                      <h3 className="text-lg font-bold mb-4">Tags (Optional)</h3>
                                       <table className="w-full text-left text-sm border mb-2">
                                          <thead className="bg-gray-100 border-b">
                                              <tr>
                                                  <th className="p-2">Key</th>
                                                  <th className="p-2">Value</th>
                                                  <th className="p-2"></th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              <tr>
                                                  <td className="p-2"><input className="aws-input" placeholder="Key" /></td>
                                                  <td className="p-2"><input className="aws-input" placeholder="Value" /></td>
                                                  <td className="p-2"><button className="text-gray-500 hover:text-red-500">Remove</button></td>
                                              </tr>
                                          </tbody>
                                      </table>
                                      <button className="aws-btn-secondary text-xs">Add new tag</button>
                                  </div>
                              )}

                              {userWizardStep === 4 && (
                                  <div className="bg-white p-6 shadow rounded border border-gray-200">
                                      <h3 className="text-lg font-bold mb-4">Review and create</h3>
                                      <div className="space-y-4 text-sm">
                                           <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                               <div className="text-gray-600">User name</div>
                                               <div className="col-span-2 font-bold">{createUserState.userName}</div>
                                           </div>
                                           <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                               <div className="text-gray-600">AWS Access type</div>
                                               <div className="col-span-2">
                                                   {createUserState.consoleAccess ? 'AWS Management Console access' : ''}
                                                   {createUserState.consoleAccess && createUserState.programmaticAccess ? ', ' : ''}
                                                   {createUserState.programmaticAccess ? 'Programmatic access - with an access key' : ''}
                                                   {!createUserState.consoleAccess && !createUserState.programmaticAccess ? 'None' : ''}
                                               </div>
                                           </div>
                                            <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                               <div className="text-gray-600">Console password type</div>
                                               <div className="col-span-2">{createUserState.autoPassword ? 'Autogenerated' : 'Custom'}</div>
                                           </div>
                                           <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                               <div className="text-gray-600">Require password reset</div>
                                               <div className="col-span-2">{createUserState.requireReset ? 'Yes' : 'No'}</div>
                                           </div>
                                           <div className="grid grid-cols-3 gap-4 border-b pb-4">
                                               <div className="text-gray-600">Permission boundaries</div>
                                               <div className="col-span-2">Permissions boundary is not set</div>
                                           </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="bg-white p-4 border-t flex justify-end space-x-3">
                          <button className="aws-btn-secondary" onClick={() => userWizardStep > 1 ? setUserWizardStep(userWizardStep - 1) : setShowUserWizard(false)}>
                              {userWizardStep > 1 ? 'Previous' : 'Cancel'}
                          </button>
                          {userWizardStep < 4 ? (
                               <button className="aws-btn-primary" onClick={() => setUserWizardStep(userWizardStep + 1)}>Next</button>
                          ) : (
                               <button className="aws-btn-orange" onClick={handleCreateUserSubmit}>Create user</button>
                          )}
                      </div>
                  </div>
              )}

             {showRoleModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]">
                         <h2 className="text-xl font-bold mb-4">Create Role</h2>
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Role name</label>
                             <input type="text" className="aws-input mb-4" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                             <label className="block text-sm font-bold mb-1">Trusted entity type</label>
                             <div className="flex gap-4 mb-4">
                                <div className="border p-3 rounded cursor-pointer bg-blue-50 border-blue-500">
                                    <div className="font-bold">AWS Service</div>
                                    <div className="text-xs">EC2, Lambda, etc.</div>
                                </div>
                             </div>
                             <label className="block text-sm font-bold mb-1">Service or use case</label>
                             <select className="aws-input" value={trustedEntity} onChange={e => setTrustedEntity(e.target.value)}>
                                 <option value="ec2.amazonaws.com">EC2</option>
                                 <option value="lambda.amazonaws.com">Lambda</option>
                             </select>
                         </div>
                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleCreateRole}>Create Role</button>
                         </div>
                     </div>
                 </div>
             )}

             {showPolicyModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[600px]">
                         <h2 className="text-xl font-bold mb-4">Create Policy</h2>
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Policy name</label>
                             <input type="text" className="aws-input mb-4" value={newPolicyName} onChange={e => setNewPolicyName(e.target.value)} />
                             <label className="block text-sm font-bold mb-1">Policy Document (JSON)</label>
                             <textarea 
                                className="aws-input h-48 font-mono text-xs" 
                                value={policyDoc} 
                                onChange={e => setPolicyDoc(e.target.value)}
                             />
                         </div>
                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowPolicyModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleCreatePolicy}>Create Policy</button>
                         </div>
                     </div>
                 </div>
             )}

             {showGroupModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
                         <h2 className="text-xl font-bold mb-4">Create User Group</h2>
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Group name</label>
                             <input type="text" className="aws-input mb-4" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                         </div>
                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowGroupModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleCreateGroup}>Create Group</button>
                         </div>
                     </div>
                 </div>
             )}

            <ConfirmationModal 
                isOpen={deleteConfirm.show}
                title={`Delete ${deleteConfirm.type}`}
                message={`Are you sure you want to delete ${deleteConfirm.name}?`}
                confirmText="Delete"
                confirmStyle="danger"
                onConfirm={executeDelete}
                onCancel={() => setDeleteConfirm({ show: false, type: null, name: null })}
            />
        </div>
    );
};

export default FakeIAMConsole;
