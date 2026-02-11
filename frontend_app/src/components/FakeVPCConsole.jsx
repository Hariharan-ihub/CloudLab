import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import { useAuth } from '../hooks/useAuth';
import ConfirmationModal from './ConfirmationModal';
import toast from 'react-hot-toast';
import { Network, Plus, Trash2, ArrowRight } from 'lucide-react';

const FakeVPCConsole = () => {
  const dispatch = useDispatch();
  const { resources } = useSelector(state => state.simulation);
  const { userId } = useAuth();
  const vpcs = resources.vpc || [];
  const subnets = resources.subnet || [];
  const securityGroups = resources.securityGroup || [];

  const [activeTab, setActiveTab] = useState('vpcs'); // vpcs, subnets, sgs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalData, setModalData] = useState({}); // Generic map for form data

  // Delete modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    if (activeTab === 'vpcs') dispatch(fetchResources({ userId, type: 'VPC' }));
    if (activeTab === 'subnets') {
        dispatch(fetchResources({ userId, type: 'VPC' })); // Need VPCs for mapping names
        dispatch(fetchResources({ userId, type: 'SUBNET' }));
    }
    if (activeTab === 'sgs') {
        dispatch(fetchResources({ userId, type: 'VPC' }));
        dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
    }
  }, [dispatch, activeTab]);

  const handleCreate = async () => {
    let action, type;
    if (activeTab === 'vpcs') {
      await dispatch(validateStep({ userId, labId: 'adhoc', action: 'CREATE_VPC', payload: { name: modalData.name, cidrBlock: modalData.cidr } }));
      type = 'VPC';
    } else if (activeTab === 'subnets') {
      await dispatch(validateStep({ userId, labId: 'adhoc', action: 'CREATE_SUBNET', payload: { name: modalData.name, cidrBlock: modalData.cidr, vpcId: modalData.vpcId, az: modalData.az } }));
      type = 'SUBNET';
    } else if (activeTab === 'sgs') {
      await dispatch(validateStep({ userId, labId: 'adhoc', action: 'CREATE_SECURITY_GROUP', payload: { groupName: modalData.name, description: modalData.description, vpcId: modalData.vpcId } }));
      type = 'SECURITY_GROUP';
    }
    
    toast.success(`${activeTab.slice(0, -1).toUpperCase()} Created`);
    setShowCreateModal(false);
    setModalData({});
    dispatch(fetchResources({ userId, type }));
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    let action, type;
    
    if (activeTab === 'vpcs') { action = 'DELETE_VPC'; type = 'VPC'; }
    if (activeTab === 'subnets') { action = 'DELETE_SUBNET'; type = 'SUBNET'; }
    if (activeTab === 'sgs') { action = 'DELETE_SECURITY_GROUP'; type = 'SECURITY_GROUP'; }

    await dispatch(validateStep({ userId, labId: 'adhoc', action, payload: { resourceId: itemToDelete._id } }));
    
    toast.success('Resource Deleted');
    setConfirmDeleteOpen(false);
    setItemToDelete(null);
    dispatch(fetchResources({ userId, type }));
  };

  // --- Render Helpers ---
  const renderVpcTable = () => (
      <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-100 text-gray-700">
              <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">VPC ID</th>
                  <th className="px-4 py-3">IPv4 CIDR</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
              </tr>
          </thead>
          <tbody>
              {vpcs.map(vpc => (
                  <tr key={vpc._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-aws-blue cursor-pointer">{vpc.state.name}</td>
                      <td className="px-4 py-3">{vpc.state.vpcId}</td>
                      <td className="px-4 py-3">{vpc.state.cidrBlock}</td>
                      <td className="px-4 py-3 text-green-600">{vpc.state.status}</td>
                      <td className="px-4 py-3">
                          <button onClick={() => { setItemToDelete(vpc); setConfirmDeleteOpen(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                      </td>
                  </tr>
              ))}
          </tbody>
      </table>
  );

  const renderSubnetTable = () => (
      <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-100 text-gray-700">
              <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Subnet ID</th>
                  <th className="px-4 py-3">VPC</th>
                  <th className="px-4 py-3">CIDR</th>
                  <th className="px-4 py-3">AZ</th>
                  <th className="px-4 py-3">Actions</th>
              </tr>
          </thead>
          <tbody>
              {subnets.map(s => {
                  const vpc = vpcs.find(v => v.state.vpcId === s.state.vpcId);
                  return (
                      <tr key={s._id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-aws-blue cursor-pointer">{s.state.name}</td>
                          <td className="px-4 py-3">{s.state.subnetId}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{vpc ? vpc.state.name : s.state.vpcId}</td>
                          <td className="px-4 py-3">{s.state.cidrBlock}</td>
                          <td className="px-4 py-3">{s.state.availabilityZone}</td>
                          <td className="px-4 py-3">
                              <button onClick={() => { setItemToDelete(s); setConfirmDeleteOpen(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                          </td>
                      </tr>
                  );
              })}
          </tbody>
      </table>
  );

  const renderSgTable = () => (
      <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-100 text-gray-700">
              <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Security Group ID</th>
                  <th className="px-4 py-3">VPC ID</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Inbound Rules</th>
                  <th className="px-4 py-3">Actions</th>
              </tr>
          </thead>
          <tbody>
              {securityGroups.map(sg => (
                  <tr key={sg._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-aws-blue cursor-pointer">{sg.state.groupName}</td>
                      <td className="px-4 py-3">{sg.state.groupId}</td>
                      <td className="px-4 py-3">{sg.state.vpcId}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{sg.state.description}</td>
                      <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                              {(sg.state.inboundRules || []).length} Rules
                          </span>
                      </td>
                      <td className="px-4 py-3">
                          <button onClick={() => { setItemToDelete(sg); setConfirmDeleteOpen(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                      </td>
                  </tr>
              ))}
          </tbody>
      </table>
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
              <Network className="mr-3 text-aws-orange" /> VPC Dashboard
          </h1>
          <button onClick={() => setShowCreateModal(true)} className="aws-btn-primary flex items-center">
              <Plus size={16} className="mr-2" /> Create {activeTab === 'vpcs' ? 'VPC' : activeTab === 'subnets' ? 'Subnet' : 'Security Group'}
          </button>
      </div>

      <div className="flex bg-white border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab('vpcs')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'vpcs' ? 'border-aws-orange text-aws-orange' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Your VPCs</button>
          <button onClick={() => setActiveTab('subnets')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'subnets' ? 'border-aws-orange text-aws-orange' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Subnets</button>
          <button onClick={() => setActiveTab('sgs')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sgs' ? 'border-aws-orange text-aws-orange' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Security Groups</button>
      </div>

      <div className="bg-white shadow rounded border border-gray-200 overflow-hidden flex-1">
          {activeTab === 'vpcs' && renderVpcTable()}
          {activeTab === 'subnets' && renderSubnetTable()}
          {activeTab === 'sgs' && renderSgTable()}
          
          {(activeTab === 'vpcs' && vpcs.length === 0) && <div className="p-8 text-center text-gray-500">No VPCs found. Create one to get started.</div>}
          {(activeTab === 'subnets' && subnets.length === 0) && <div className="p-8 text-center text-gray-500">No Subnets found.</div>}
          {(activeTab === 'sgs' && securityGroups.length === 0) && <div className="p-8 text-center text-gray-500">No Security Groups found.</div>}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded p-6 w-[500px] shadow-xl">
                 <h2 className="text-xl font-bold mb-4">Create {activeTab === 'vpcs' ? 'VPC' : activeTab === 'subnets' ? 'Subnet' : 'Security Group'}</h2>
                 
                 <div className="mb-4 space-y-4">
                     <div>
                         <label className="block text-sm font-bold mb-1">Name tag</label>
                         <input type="text" className="aws-input" placeholder={activeTab === 'sgs' ? 'sg-web-access' : 'my-resource'} value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} />
                     </div>
                     
                     {activeTab === 'vpcs' && (
                         <div>
                             <label className="block text-sm font-bold mb-1">IPv4 CIDR block</label>
                             <input type="text" className="aws-input" placeholder="10.0.0.0/16" value={modalData.cidr || ''} onChange={e => setModalData({...modalData, cidr: e.target.value})} />
                         </div>
                     )}

                     {(activeTab === 'subnets' || activeTab === 'sgs') && (
                         <div>
                            <label className="block text-sm font-bold mb-1">VPC</label>
                            <select className="aws-input" value={modalData.vpcId || ''} onChange={e => setModalData({...modalData, vpcId: e.target.value})}>
                                <option value="">Select a VPC</option>
                                {vpcs.map(v => <option key={v._id} value={v.state.vpcId}>{v.state.name} ({v.state.vpcId})</option>)}
                            </select>
                         </div>
                     )}

                     {activeTab === 'subnets' && (
                         <>
                            <div>
                                <label className="block text-sm font-bold mb-1">Availability Zone</label>
                                <select className="aws-input" value={modalData.az || ''} onChange={e => setModalData({...modalData, az: e.target.value})}>
                                    <option value="us-east-1a">us-east-1a</option>
                                    <option value="us-east-1b">us-east-1b</option>
                                    <option value="us-east-1c">us-east-1c</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">IPv4 CIDR block</label>
                                <input type="text" className="aws-input" placeholder="10.0.1.0/24" value={modalData.cidr || ''} onChange={e => setModalData({...modalData, cidr: e.target.value})} />
                            </div>
                         </>
                     )}
                     
                     {activeTab === 'sgs' && (
                         <div>
                             <label className="block text-sm font-bold mb-1">Description</label>
                             <input type="text" className="aws-input" placeholder="Allow web traffic" value={modalData.description || ''} onChange={e => setModalData({...modalData, description: e.target.value})} />
                         </div>
                     )}
                 </div>

                 <div className="flex justify-end space-x-2">
                     <button className="aws-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                     <button className="aws-btn-primary" onClick={handleCreate}>Create</button>
                 </div>
             </div>
         </div>
      )}

      <ConfirmationModal 
         isOpen={confirmDeleteOpen}
         title={`Delete ${activeTab.slice(0,1).toUpperCase() + activeTab.slice(1, -1)}`}
         message="Are you sure you want to delete this resource?"
         onConfirm={handleDelete}
         onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};

export default FakeVPCConsole;
