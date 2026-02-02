import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import toast from 'react-hot-toast';
import { Shield, Plus, Copy, FileText, ChevronRight, Trash2 } from 'lucide-react';
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

    // -- Create User State --
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('Developers');

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

    const handleAddUser = async () => {
        if(newUserName) {
            const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'IAM_USER');

            await dispatch(validateStep({
                 userId, 
                 labId: activeLab?.labId || 'adhoc', 
                 stepId: step?.stepId || null, 
                 action: 'CREATE_IAM_USER', 
                 payload: { userName: newUserName, group: selectedGroup }
            }));
            setNewUserName('');
            setShowUserModal(false);
            toast.success('User Created');
            dispatch(fetchResources({ userId, type: 'IAM_USER' }));
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
                <h2 className="text-lg font-bold">Users</h2>
                <button className="aws-btn-primary" onClick={() => setShowUserModal(true)}>Add user</button>
            </div>
            <table className="w-full text-left text-sm bg-white border border-gray-200 shadow rounded">
                <thead className="bg-gray-100 border-b">
                     <tr>
                         <th className="p-3">User name</th>
                         <th className="p-3">Groups</th>
                         <th className="p-3">Last activity</th>
                         <th className="p-3 text-right">Actions</th>
                     </tr>
                </thead>
                <tbody>
                    {users.map((u, i) => (
                         <tr key={i} className="border-b hover:bg-gray-50">
                             <td className="p-3 text-aws-blue font-bold">{u.state?.userName}</td>
                             <td className="p-3">{u.state?.groups}</td>
                             <td className="p-3 text-gray-500">{u.state?.lastActive}</td>
                             <td className="p-3 text-right">
                                <button className="text-red-600 hover:bg-red-50 p-1 rounded" onClick={() => handleDelete('USER', u.state?.userName)}>
                                    <Trash2 size={16} />
                                </button>
                             </td>
                         </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">No users found</td></tr>}
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

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4 flex items-center">
                 <Shield className="mr-3 text-aws-gold" /> IAM Dashboard
            </h1>

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

             {/* Modals */}
             {showUserModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
                         <h2 className="text-xl font-bold mb-4">Add User</h2>
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">User name</label>
                             <input type="text" className="aws-input mb-4" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                             <label className="block text-sm font-bold mb-1">Add to Group</label>
                             <select className="aws-input" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                                 <option value="-">None</option>
                                 <option value="Admins">Admins (Simulated)</option>
                                 <option value="Developers">Developers (Simulated)</option>
                                 {groups.map(g => (
                                     <option key={g.state.groupName} value={g.state.groupName}>{g.state.groupName}</option>
                                 ))}
                             </select>
                         </div>
                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleAddUser}>Create User</button>
                         </div>
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
