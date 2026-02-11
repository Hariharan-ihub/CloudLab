import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Shield, Plus, Trash2, Edit2, X, Save } from 'lucide-react';

const FakeSecurityGroupConsole = () => {
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { userId } = useAuth();
    const securityGroups = resources.securityGroup || [];
    const instances = resources.ec2 || [];
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Create State
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    
    // Edit State
    const [editingGroup, setEditingGroup] = useState(null);
    const [editRules, setEditRules] = useState([]); // [{ type, protocol, portRange, source }]

    useEffect(() => {
        dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
    }, [dispatch]);

    const handleCreateGroup = async () => {
        if(!newGroupName) return;
        await dispatch(validateStep({
             userId, labId: 'adhoc', stepId: null,
             action: 'CREATE_SECURITY_GROUP',
             payload: { groupName: newGroupName, description: newGroupDesc, vpcId: 'vpc-12345678' }
        }));
        setNewGroupName(''); setNewGroupDesc('');
        setShowCreateModal(false);
        toast.success(`Security group ${newGroupName} created.`);
        dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
    };

    const handleDeleteGroup = async (groupId) => {
         if(!confirm('Are you sure? This might impact running instances.')) return;
         await dispatch(validateStep({
             userId, labId: 'adhoc', stepId: null,
             action: 'DELETE_SECURITY_GROUP',
             payload: { groupId }
         }));
         toast.success('Security Group deleted.');
         dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
    };

    const openEditRules = (sg) => {
        setEditingGroup(sg);
        // Deep copy rules to local state or clean init
        setEditRules(sg.state.inboundRules ? JSON.parse(JSON.stringify(sg.state.inboundRules)) : []);
        setShowEditModal(true);
    };

    const saveRules = async () => {
         await dispatch(validateStep({
             userId, labId: 'adhoc', stepId: null,
             action: 'UPDATE_SECURITY_GROUP_RULES',
             payload: { groupId: editingGroup.state.groupId, rules: editRules }
         }));
         toast.success('Inbound rules updated.');
         setShowEditModal(false);
         setEditingGroup(null);
         dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center text-aws-blue">
                 <Shield className="mr-3" /> Security Groups
            </h1>

            <div className="bg-white shadow rounded p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-64">
                         <input className="aws-input" placeholder="Filter security groups" />
                    </div>
                    <button className="aws-btn-primary" onClick={() => setShowCreateModal(true)}>Create security group</button>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Security Group ID</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Inbound Rules</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {securityGroups.map((sg, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-aws-blue font-bold">{sg.state.groupName}</td>
                                <td className="p-3 text-gray-600">{sg.state.groupId}</td>
                                <td className="p-3">{sg.state.description}</td>
                                <td className="p-3 text-xs">
                                    {(sg.state.inboundRules || []).map((r, ri) => (
                                        <div key={ri}>{r.portRange} ({r.protocol}) from {r.source}</div>
                                    ))}
                                    {(sg.state.inboundRules || []).length === 0 && <span className="text-gray-400">No rules</span>}
                                </td>
                                <td className="p-3 text-right">
                                    <button className="text-aws-blue hover:underline mr-4" onClick={() => openEditRules(sg)}>Edit inbound rules</button>
                                    <button className="text-red-600 hover:bg-red-50 p-1 rounded" onClick={() => handleDeleteGroup(sg.state.groupId)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]">
                        <h2 className="text-xl font-bold mb-4">Create Security Group</h2>
                        <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Name</label>
                             <input className="aws-input mb-2" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                             <label className="block text-sm font-bold mb-1">Description</label>
                             <input className="aws-input" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
                        </div>
                        <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleCreateGroup}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Rules Modal */}
            {showEditModal && editingGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-[800px]">
                        <h2 className="text-xl font-bold mb-4">Edit inbound rules: {editingGroup.state.groupName}</h2>
                        
                        <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
                             <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 mb-2">
                                 <div className="col-span-3">Type</div>
                                 <div className="col-span-2">Protocol</div>
                                 <div className="col-span-2">Port range</div>
                                 <div className="col-span-3">Source</div>
                                 <div className="col-span-2"></div>
                             </div>
                             {editRules.map((rule, i) => (
                                 <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                      <div className="col-span-3">
                                          <select 
                                            className="aws-input" 
                                            value={rule.type}
                                            onChange={(e) => {
                                                const newRules = [...editRules];
                                                newRules[i].type = e.target.value;
                                                if(e.target.value === 'SSH') { newRules[i].protocol = 'TCP'; newRules[i].portRange = '22'; }
                                                if(e.target.value === 'HTTP') { newRules[i].protocol = 'TCP'; newRules[i].portRange = '80'; }
                                                if(e.target.value === 'HTTPS') { newRules[i].protocol = 'TCP'; newRules[i].portRange = '443'; }
                                                setEditRules(newRules);
                                            }}
                                          >
                                              <option value="Custom TCP">Custom TCP</option>
                                              <option value="SSH">SSH</option>
                                              <option value="HTTP">HTTP</option>
                                              <option value="HTTPS">HTTPS</option>
                                              <option value="All traffic">All traffic</option>
                                          </select>
                                      </div>
                                      <div className="col-span-2"><input className="aws-input" value={rule.protocol} disabled /></div>
                                      <div className="col-span-2"><input className="aws-input" value={rule.portRange} onChange={e => { const n = [...editRules]; n[i].portRange = e.target.value; setEditRules(n); }} /></div>
                                      <div className="col-span-3"><input className="aws-input" value={rule.source} onChange={e => { const n = [...editRules]; n[i].source = e.target.value; setEditRules(n); }} /></div>
                                      <div className="col-span-2 text-right">
                                          <button className="text-gray-500 hover:text-red-600" onClick={() => setEditRules(editRules.filter((_, idx) => idx !== i))}>Remove</button>
                                      </div>
                                 </div>
                             ))}
                             <button className="aws-btn-secondary mt-2 flex items-center text-xs" onClick={() => setEditRules([...editRules, { type: 'Custom TCP', protocol: 'TCP', portRange: '8080', source: '0.0.0.0/0' }])}>
                                 <Plus size={12} className="mr-1"/> Add rule
                             </button>
                        </div>

                        <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={saveRules}>Save rules</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FakeSecurityGroupConsole;
