import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import { store } from '../store/store';
import ConfirmationModal from './ConfirmationModal';
import SmartTerminal from './SmartTerminal';
import toast from 'react-hot-toast';
import { Terminal, Play, Square, RefreshCcw, RefreshCw, Power, ChevronDown, ChevronRight, CheckCircle, X, Trash2, Info, Lock, Activity, Server, Tag, Shield, HardDrive, Network, Search } from 'lucide-react';

const Ec2Dashboard = ({ activeLab }) => {
  const dispatch = useDispatch();
  const { currentStepId, resources, completedSteps } = useSelector(state => state.simulation);
  const { user } = useSelector(state => state.auth);
  const userId = user?.id;
  const instances = resources.ec2 || [];
  
  // Local state for wizard
  const [wizardState, setWizardState] = useState({
    ami: null,
    instanceType: null,
    name: '',
    vpcId: '',
    subnetId: '',
    securityGroups: [],
    userData: '',
    keyPair: '',
    storage: { size: 8, type: 'gp3' },

    sgMode: 'create',
    publicIp: true, // Network Settings Toggle
    sgRules: { ssh: true, http: false, https: false } // Checkbox state
  });
  
  const [keyPairs, setKeyPairs] = useState(['my-key-pair', 'dev-key']);


  const [onLaunchPage, setOnLaunchPage] = useState(false);
  const [showLaunchSuccess, setShowLaunchSuccess] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingInstance, setConnectingInstance] = useState(null);
  const [actionsOpen, setActionsOpen] = useState(null); // ID of instance with open actions menu
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewInstance, setViewInstance] = useState(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState('Details'); // Details View Tab State
  const [showKeyPairModal, setShowKeyPairModal] = useState(false); // Key Pair Modal
  const [newKeyPairName, setNewKeyPairName] = useState('');
  const [advancedDetailsOpen, setAdvancedDetailsOpen] = useState(false); // Accordion state


  
  // Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionInfo, setActionInfo] = useState({ type: '', instance: null }); // { type: 'terminate'|'stop'|'reboot', instance: ... }

  // userId is now from auth state 

  // Load instances and networking on mount
  useEffect(() => {
     if (!userId) return;
     
     dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
     dispatch(fetchResources({ userId, type: 'VPC' }));
     dispatch(fetchResources({ userId, type: 'SUBNET' }));
     dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
      const interval = setInterval(() => {
         dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
      }, 5000);
      return () => clearInterval(interval);
  }, [dispatch, userId]);

  // Validate navigation on mount (Step 1)
  useEffect(() => {
     if (activeLab?.steps) {
         const navStep = activeLab.steps.find(s => s.validationLogic?.type === 'URL_CONTAINS' && s.validationLogic.value === '/service/ec2');
         if (navStep && !completedSteps.includes(navStep.stepId)) {
             handleAction(navStep.stepId, 'NAVIGATE', { url: '/service/ec2' });
         }
     }
  }, [activeLab, dispatch, completedSteps]);

  // Restore Wizard state on Resume
  useEffect(() => {
     if (activeLab?.steps && completedSteps?.length > 0) {
         const launchBtnStep = activeLab.steps.find(s => s.validationLogic?.type === 'CLICK_BUTTON' && s.validationLogic.value === 'Launch Instance');
         const finalLaunchStep = activeLab.steps.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'EC2_INSTANCE');
         
         if (launchBtnStep && finalLaunchStep) {
             const isWizardStarted = completedSteps.includes(launchBtnStep.stepId);
             const isWizardFinished = completedSteps.includes(finalLaunchStep.stepId);
             
             if (isWizardStarted && !isWizardFinished) {
                 setOnLaunchPage(true);
             }
         }
     }
  }, [activeLab, completedSteps]);

  const handleAction = async (stepId, action, payload) => {
    console.log('🚀 [EC2 Console] handleAction called:', {
      stepId,
      action,
      payload,
      labId: activeLab?.labId,
      userId
    });

    try {
      const result = await dispatch(validateStep({
        userId,
        labId: activeLab?.labId || 'adhoc',
        stepId,
        action,
        payload
      }));

      console.log('✅ [EC2 Console] validateStep result:', result);

      if (action === 'CLICK_FINAL_LAUNCH') {
        if (result.payload?.success) {
          console.log('✅ [EC2 Console] Launch successful:', result.payload);
          setShowLaunchSuccess(true);
          toast.success('Instance launched successfully!');
          dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
        } else {
          console.error('❌ [EC2 Console] Launch failed:', result.payload);
          const errorMsg = result.payload?.message || 'Failed to launch instance.';
          toast.error(errorMsg);
        }
      } else {
        // Generic refresh for other actions
        setTimeout(() => dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' })), 500); 
      }
    } catch (error) {
      console.error('❌ [EC2 Console] handleAction error:', error);
      toast.error(`Error: ${error.message || 'Failed to process action'}`);
    }
  };

  const confirmAction = (type, inst) => {
      setActionInfo({ type, instance: inst });
      setConfirmModalOpen(true);
      setActionsOpen(null);
  };

  const handleConfirmAction = () => {
      const { type, instance } = actionInfo;
      if (!instance) return;

      let actionName = '';
      if (type === 'terminate') actionName = 'TERMINATE_INSTANCE';
      if (type === 'stop') actionName = 'STOP_INSTANCE';
      if (type === 'start') actionName = 'START_INSTANCE';
      if (type === 'reboot') actionName = 'REBOOT_INSTANCE';

      if (actionName) {
          handleAction(null, actionName, { resourceId: instance._id });
          toast.success(`Instance ${type} initiated.`);
      }
      
      setConfirmModalOpen(false);
      setActionInfo({ type: '', instance: null });
  };

  const toggleSelection = (id) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };


  const resetWizard = () => {
      setWizardState({ 
        ami: null, 
        instanceType: null, 
        name: '', 
        vpcId: '', 
        subnetId: '', 
        securityGroups: [], 
        userData: '', 
        sgMode: 'create',
        publicIp: true,
        sgRules: { ssh: true, http: false, https: false }
      });
      setShowLaunchSuccess(false);
      setOnLaunchPage(false);
  };

  if (showLaunchSuccess) {
      return (
          <div className="p-6 max-w-4xl mx-auto text-center">
              <div className="bg-green-50 border border-green-200 rounded p-8 mb-6">
                  <div className="text-green-600 font-bold text-xl mb-4 flex justify-center items-center"><CheckCircle size={32} className="mr-2"/> Instance Launched Successfully</div>
                  <p className="text-gray-700 mb-6">Your instance <strong>{wizardState.name || 'MyWebServer'}</strong> is now launching.</p>
                  <button className="aws-btn-primary" onClick={resetWizard}>View All Instances</button>
              </div>
          </div>
      );
  }

  if (viewInstance) {
      return (
          <div className="p-6">
              <div className="mb-4">
                  <button onClick={() => setViewInstance(null)} className="text-aws-blue hover:underline mb-4 text-sm">&lt; Instances</button>
                  <h1 className="text-2xl font-bold flex items-center">
                    {viewInstance.state.name} 
                    <span className="ml-4 text-sm font-normal text-gray-500">{viewInstance.state.instanceId}</span>
                    <span className={`ml-4 px-2 py-0.5 rounded-full text-xs font-bold ${viewInstance.state.status==='running'?'bg-green-100 text-green-800': 'bg-gray-100 text-gray-800'}`}>{viewInstance.state.status}</span>
                  </h1>
              </div>
              <div className="bg-white shadow rounded border border-gray-200">
                  <div className="border-b px-6">
                      <nav className="-mb-px flex space-x-6">
                          {['Details', 'Security', 'Networking', 'Storage', 'Monitoring', 'Tags'].map((tab) => (
                              <button 
                                key={tab} 
                                onClick={() => setActiveDetailsTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeDetailsTab === tab ? 'border-aws-orange text-aws-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                              >
                                {tab}
                              </button>
                          ))}
                      </nav>
                  </div>
                  <div className="p-6">
                      {activeDetailsTab === 'Details' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 text-sm">
                            <div><div className="text-gray-500 mb-1">Instance ID</div><div className="font-mono">{viewInstance.state.instanceId}</div></div>
                            <div><div className="text-gray-500 mb-1">Public IPv4 address</div><div>{viewInstance.state.status === 'running' ? `3.85.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` : '-'}</div></div>
                            <div><div className="text-gray-500 mb-1">Instance state</div><div className="capitalize flex items-center gap-1">
                                {viewInstance.state.status === 'running' ? <CheckCircle size={14} className="text-green-500"/> : <Square size={14} className="text-red-500"/>}
                                {viewInstance.state.status}
                            </div></div>
                            <div><div className="text-gray-500 mb-1">Instance type</div><div>{viewInstance.state.instanceType}</div></div>
                            <div><div className="text-gray-500 mb-1">Private IPv4 DNS</div><div>ip-172-31-{Math.floor(Math.random()*255)}-{Math.floor(Math.random()*255)}.ec2.internal</div></div>
                            <div><div className="text-gray-500 mb-1">VPC ID</div><div className="text-aws-blue cursor-pointer hover:underline">{viewInstance.state.vpcId || '-'}</div></div>
                            <div><div className="text-gray-500 mb-1">Subnet ID</div><div className="text-aws-blue cursor-pointer hover:underline">{viewInstance.state.subnetId || '-'}</div></div>
                            <div><div className="text-gray-500 mb-1">Key pair name</div><div>{viewInstance.state.keyPair || '-'}</div></div>
                            <div><div className="text-gray-500 mb-1">AMI ID</div><div>{viewInstance.state.ami}</div></div>
                            <div><div className="text-gray-500 mb-1">Launch time</div><div>2 mins ago</div></div>
                        </div>
                      )}

                      {activeDetailsTab === 'Security' && (
                          <div>
                              <h3 className="font-bold mb-4">Security groups</h3>
                              <div className="mb-4 text-aws-blue hover:underline cursor-pointer">sg-083291 (launch-wizard-1)</div>
                              <h3 className="font-bold mb-2">Inbound rules</h3>
                              <table className="w-full text-left text-sm border">
                                  <thead className="bg-gray-100">
                                      <tr><th className="p-2 border">Security group rule ID</th><th className="p-2 border">Port range</th><th className="p-2 border">Protocol</th><th className="p-2 border">Source</th></tr>
                                  </thead>
                                  <tbody>
                                      <tr><td className="p-2 border text-aws-blue">sgr-0123456789</td><td className="p-2 border">22</td><td className="p-2 border">TCP</td><td className="p-2 border">0.0.0.0/0</td></tr>
                                      <tr><td className="p-2 border text-aws-blue">sgr-9876543210</td><td className="p-2 border">80</td><td className="p-2 border">TCP</td><td className="p-2 border">0.0.0.0/0</td></tr>
                                  </tbody>
                              </table>
                          </div>
                      )}

                      {activeDetailsTab === 'Networking' && (
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                                  <div><div className="text-gray-500">Public IPv4 address</div><div>{viewInstance.state.status === 'running' ? `3.85.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` : '-'}</div></div>
                                  <div><div className="text-gray-500">Private IPv4 address</div><div>172.31.25.109</div></div>
                                  <div><div className="text-gray-500">VPC ID</div><div className="text-aws-blue">{viewInstance.state.vpcId || 'vpc-12345'}</div></div>
                                  <div><div className="text-gray-500">Subnet ID</div><div className="text-aws-blue">{viewInstance.state.subnetId || 'subnet-67890'}</div></div>
                                  <div><div className="text-gray-500">Network interface ID</div><div className="text-aws-blue">eni-0abcd1234</div></div>
                              </div>
                          </div>
                      )}

                      {activeDetailsTab === 'Storage' && (
                          <div>
                              <table className="w-full text-left text-sm border-collapse">
                                  <thead className="bg-gray-100">
                                      <tr><th className="p-2 border">Volume ID</th><th className="p-2 border">Size (GiB)</th><th className="p-2 border">Volume type</th><th className="p-2 border">Attachment status</th></tr>
                                  </thead>
                                  <tbody>
                                      <tr>
                                          <td className="p-2 border text-aws-blue">vol-0fab123987</td>
                                          <td className="p-2 border">{viewInstance.state.storage?.size || 8}</td>
                                          <td className="p-2 border">{viewInstance.state.storage?.type || 'gp3'}</td>
                                          <td className="p-2 border">Attached</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      )}

                      {activeDetailsTab === 'Monitoring' && (
                          <div className="grid grid-cols-2 gap-4">
                              <div className="border rounded p-4 h-48 flex items-center justify-center bg-gray-50 text-gray-500">CPU Utilization Graph Placeholder</div>
                              <div className="border rounded p-4 h-48 flex items-center justify-center bg-gray-50 text-gray-500">Network In/Out Graph Placeholder</div>
                              <div className="col-span-2">
                                  <label className="flex items-center space-x-2">
                                      <input type="checkbox" className="rounded text-aws-blue" />
                                      <span className="text-sm">Enable detailed monitoring (Additional charges apply)</span>
                                  </label>
                              </div>
                          </div>
                      )}

                      {activeDetailsTab === 'Tags' && (
                          <table className="w-full text-left text-sm border">
                                  <thead className="bg-gray-100">
                                      <tr><th className="p-2 border">Key</th><th className="p-2 border">Value</th></tr>
                                  </thead>
                                  <tbody>
                                      <tr><td className="p-2 border">Name</td><td className="p-2 border">{viewInstance.state.name}</td></tr>
                                      <tr><td className="p-2 border">CreatedBy</td><td className="p-2 border">CloudLab Simulation</td></tr>
                                  </tbody>
                           </table>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // Render Logic
  if (!onLaunchPage) {
      // Main Dashboard View
      return (
          <div className="p-6 relative">
              <h1 className="text-2xl font-bold mb-4">EC2 Dashboard</h1>
              <div className="flex space-x-4 mb-8">
                   <div className="bg-white p-4 shadow rounded w-64 border-t-4 border-aws-orange">
                       <div className="text-sm font-bold text-gray-500">Running Instances</div>
                       <div className="text-3xl font-bold text-gray-800">{instances.filter(i => i.state.status === 'running').length}</div>
                   </div>
                   <div className="bg-white p-4 shadow rounded w-64 border-t-4 border-blue-500">
                       <div className="text-sm font-bold text-gray-500">Total Instances</div>
                       <div className="text-3xl font-bold text-gray-800">{instances.length}</div>
                   </div>
              </div>

              <div className="bg-white shadow rounded p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg">Instances</h2>
                        <button 
                            className="aws-btn-primary"
                            onClick={() => {
                                const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'CLICK_BUTTON' && s.validationLogic.value === 'Launch Instance');
                                if (step) handleAction(step.stepId, 'CLICK_BUTTON', { value: 'Launch Instance' }); 
                                setOnLaunchPage(true);
                            }}
                        >
                            Launch Instance
                        </button>
                  </div>

                  {instances.length > 0 ? (
                     <div className="">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-100 border-b">
                                 <tr>
                                     <th className="p-3 w-4"><input type="checkbox" onChange={(e) => { if(e.target.checked) { setSelectedIds(new Set(instances.map(i => i._id))); } else { setSelectedIds(new Set()); } }} checked={instances.length > 0 && selectedIds.size === instances.length} /></th>
                                     <th className="p-3">Name</th>
                                     <th className="p-3">Instance ID</th>
                                     <th className="p-3">State</th>
                                     <th className="p-3">Type</th>
                                     <th className="p-3">Public IPv4 DNS</th>
                                     <th className="p-3 text-right">Actions</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {instances.map((inst, i) => (
                                     <tr key={i} className={`border-b hover:bg-gray-50 ${selectedIds.has(inst._id) ? 'bg-blue-50 border-blue-200' : ''}`}>
                                         <td className="p-3"><input type="checkbox" checked={selectedIds.has(inst._id)} onChange={() => toggleSelection(inst._id)} /></td>
                                         <td className="p-3 text-aws-blue font-bold hover:underline cursor-pointer" onClick={() => setViewInstance(inst)}>{inst.state.name}</td>
                                         <td className="p-3 text-gray-600">{inst.state.instanceId}</td>
                                         <td className="p-3">
                                             {inst.state.status === 'running' && <span className="text-green-600 flex items-center font-bold text-xs"><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div> Running</span>}
                                             {inst.state.status === 'stopped' && <span className="text-red-600 flex items-center font-bold text-xs"><div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div> Stopped</span>}
                                             {inst.state.status === 'pending' && <span className="text-yellow-600 flex items-center font-bold text-xs"><div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div> Pending</span>}
                                         </td>
                                         <td className="p-3">{inst.state.instanceType}</td>
                                         <td className="p-3 text-gray-500 text-xs truncate max-w-[200px]">
                                             {inst.state.status === 'running' ? `ec2-${Math.floor(Math.random()*255)}-...compute-1.amazonaws.com` : '-'}
                                         </td>
                                         <td className="p-3 text-right relative">
                                             <div className="flex justify-end space-x-2">
                                                <button 
                                                    className={`px-3 py-1 text-xs border rounded shadow-sm bg-white hover:bg-gray-50 ${inst.state.status !== 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    disabled={inst.state.status !== 'running'}
                                                    onClick={() => { setConnectingInstance(inst); setShowConnectModal(true); }}
                                                >
                                                    Connect
                                                </button>
                                                <div className="relative">
                                                    <button 
                                                        className="px-3 py-1 text-xs border rounded shadow-sm bg-white hover:bg-gray-50 flex items-center"
                                                        onClick={() => setActionsOpen(actionsOpen === inst._id ? null : inst._id)}
                                                    >
                                                        Instance State <ChevronDown size={12} className="ml-1"/>
                                                    </button>
                                                    {actionsOpen === inst._id && (
                                                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-xl z-50 text-left" style={{ minWidth: '150px' }}>
                                                            {inst.state.status === 'stopped' ? (
                                                                <button onClick={() => confirmAction('start', inst)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex items-center"><Play size={12} className="mr-2"/> Start instance</button>
                                                            ) : (
                                                                <button onClick={() => confirmAction('stop', inst)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex items-center"><Square size={12} className="mr-2"/> Stop instance</button>
                                                            )}
                                                            <button onClick={() => confirmAction('reboot', inst)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex items-center"><RefreshCcw size={12} className="mr-2"/> Reboot instance</button>
                                                            <div className="border-t my-1"></div>
                                                            <button onClick={() => confirmAction('terminate', inst)} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center"><Trash2 size={12} className="mr-2"/> Terminate instance</button>
                                                        </div>
                                                    )}
                                                </div>
                                             </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                  ) : (
                      <div className="p-8 text-center text-gray-500">No instances found. Launch one to get started.</div>
                  )}
              </div>
              
              {/* Connect Modal */}
              {showConnectModal && connectingInstance && (
                  <SmartTerminal instance={connectingInstance} onClose={() => setShowConnectModal(false)} />
              )}
              
              {/* Key Pair Creation Modal */}
              {showKeyPairModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded p-6 w-[400px] shadow-xl">
                          <h2 className="text-xl font-bold mb-4">Create key pair</h2>
                          <div className="mb-4">
                              <label className="block text-sm font-bold mb-1">Key pair name</label>
                              <input 
                                type="text" 
                                className="aws-input" 
                                placeholder="my-key-pair" 
                                value={newKeyPairName} 
                                onChange={e => setNewKeyPairName(e.target.value)} 
                              />
                          </div>
                          <div className="mb-4">
                              <label className="block text-sm font-bold mb-1">Key pair type</label>
                              <div className="flex gap-4">
                                  <label className="flex items-center"><input type="radio" checked name="ktype" className="mr-2"/> RSA</label>
                                  <label className="flex items-center"><input type="radio" name="ktype" className="mr-2"/> ED25519</label>
                              </div>
                          </div>
                          <div className="mb-4">
                               <label className="block text-sm font-bold mb-1">Private key file format</label>
                               <div className="flex gap-4">
                                  <label className="flex items-center"><input type="radio" checked name="kformat" className="mr-2"/> .pem</label>
                                  <label className="flex items-center"><input type="radio" name="kformat" className="mr-2"/> .ppk</label>
                              </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                              <button className="aws-btn-secondary" onClick={() => setShowKeyPairModal(false)}>Cancel</button>
                              <button 
                                className="aws-btn-primary" 
                                onClick={() => {
                                    if(!newKeyPairName) return toast.error('Name is required');
                                    setKeyPairs([...keyPairs, newKeyPairName]);
                                    setWizardState(prev => ({ ...prev, keyPair: newKeyPairName }));
                                    setShowKeyPairModal(false);
                                    setNewKeyPairName('');
                                    toast.success('Key pair created and downloaded');
                                }}
                              >
                                  Create key pair
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Summary Panel */}
              {selectedIds.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40 transition-transform duration-300 transform translate-y-0" style={{ height: '30vh' }}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold text-lg">
                            {selectedIds.size === 1 ? instances.find(i => i._id === Array.from(selectedIds)[0])?.state.name : `${selectedIds.size} instances selected`}
                        </h3>
                        <button onClick={() => setSelectedIds(new Set())}><X size={20} className="text-gray-500 hover:text-black"/></button>
                    </div>
                    {selectedIds.size === 1 ? (
                        (() => {
                            const selectedInst = instances.find(i => i._id === Array.from(selectedIds)[0]);
                            if (!selectedInst) return null;
                            return (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><span className="text-gray-500 block">Instance ID</span>{selectedInst.state.instanceId}</div>
                                    <div><span className="text-gray-500 block">Public IPv4 DNS</span>{selectedInst.state.status === 'running' ? `ec2-${Math.floor(Math.random()*255)}-...compute-1.amazonaws.com` : '-'}</div>
                                    <div><span className="text-gray-500 block">Instance State</span>{selectedInst.state.status}</div>
                                    <div><span className="text-gray-500 block">Instance Type</span>{selectedInst.state.instanceType}</div>
                                    <div><span className="text-gray-500 block">VPC ID</span>{selectedInst.state.vpcId || '-'}</div>
                                    <div><span className="text-gray-500 block">Subnet ID</span>{selectedInst.state.subnetId || '-'}</div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="text-gray-500">Select a single instance to view details.</div>
                    )}
                </div>
              )}

              <ConfirmationModal 
                 isOpen={confirmModalOpen}
                 title={`${actionInfo.type.charAt(0).toUpperCase() + actionInfo.type.slice(1)} Instance`}
                 message={`Are you sure you want to ${actionInfo.type} ${actionInfo.instance?.state?.name}?`}
                 confirmText={actionInfo.type.charAt(0).toUpperCase() + actionInfo.type.slice(1)}
                 confirmStyle={actionInfo.type === 'terminate' ? 'danger' : 'primary'}
                 onConfirm={handleConfirmAction}
                 onCancel={() => setConfirmModalOpen(false)}
              />
          </div>
      );
  }

  // Launch Wizard View
  return (
      <div className="p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Launch an instance</h1>
              <button 
                  className="text-aws-blue text-sm hover:underline"
                  onClick={() => {
                        const defaultVpc = resources.vpc?.[0]?.state.vpcId || '';
                        const defaultSubnet = resources.subnet?.[0]?.state.subnetId || '';
                        const defaultSg = resources.securityGroup?.[0]?.state.groupId || '';
                        setWizardState(prev => ({
                            ...prev,
                            ami: 'ami-al2023',
                            instanceType: 't2.micro',
                            name: 'Marketing-Server',
                            vpcId: defaultVpc,
                            subnetId: defaultSubnet,
                            securityGroups: defaultSg ? [defaultSg] : [],
                            userData: '#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd'
                        }));

                        // Trigger Validation for Auto-filled steps
                        if (activeLab?.steps) {
                             const nameStep = activeLab.steps.find(s => s.validationLogic?.field === 'name');
                             if (nameStep) handleAction(nameStep.stepId, 'INPUT_VALUE', { field: 'name', value: 'Marketing-Server' });
                             
                             const typeStep = activeLab.steps.find(s => s.validationLogic?.field === 'instanceType');
                             if (typeStep) handleAction(typeStep.stepId, 'SELECT_INSTANCE_TYPE', { field: 'instanceType', value: 't2.micro' });
                             
                             const amiStep = activeLab.steps.find(s => s.validationLogic?.field === 'ami');
                             if (amiStep) handleAction(amiStep.stepId, 'SELECT_AMI', { field: 'ami', value: 'ami-al2023' });
                        }

                        toast.success('Lab defaults filled successfully');
                  }}
              >
                  Auto-fill Lab Defaults
              </button>
          </div>
          
          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Name and tags</h2>
                  <div className="group relative">
                      <Info size={16} className="text-aws-blue hover:text-aws-orange cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-white text-xs rounded p-2 z-50">
                          <strong>Why is this important?</strong>
                          <div className="mt-1">Tagging resources helps you organize and identify them for cost allocation and automation.</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             <div className="mb-4">
                 <label className="block text-sm font-bold mb-1">Name</label>
                 <input 
                    type="text" 
                    className="aws-input" 
                    placeholder="MyWebServer"
                    value={wizardState.name}
                    onChange={(e) => {
                        const val = e.target.value;
                        setWizardState({...wizardState, name: val});
                        const step = activeLab?.steps?.find(s => s.validationLogic?.field === 'name');
                        if (step) handleAction(step.stepId, 'INPUT_VALUE', { field: 'name', value: val });
                    }} 
                 />
             </div>
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Application and OS Images (Amazon Machine Image)</h2>
                  <div className="group relative">
                      <Info size={16} className="text-aws-blue hover:text-aws-orange cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-white text-xs rounded p-2 z-50">
                          <strong>Why select an AMI?</strong>
                          <div className="mt-1">An AMI is a template that contains the software configuration (OS, App Server) required to launch your instance.</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             <div className="space-y-4">
             <div className="space-y-2">
                 {/* Radio Card List for AMI */}
                 {[
                    { name: 'Amazon Linux', id: 'ami-al2023', desc: 'Amazon Linux 2023 AMI', free: true },
                    { name: 'Ubuntu', id: 'ami-ubuntu', desc: 'Ubuntu Server 22.04 LTS', free: true },
                    { name: 'Windows', id: 'ami-win', desc: 'Microsoft Windows Server 2022 Base', free: true },
                    { name: 'Red Hat', id: 'ami-rhel', desc: 'Red Hat Enterprise Linux 9', free: true },
                    { name: 'macOS', id: 'ami-mac', desc: 'macOS Monterey', free: false }
                 ].map(ami => (
                     <div 
                        key={ami.name}
                        onClick={() => {
                          setWizardState({...wizardState, ami: ami.id});
                          // Validate AMI selection step
                          const step = activeLab?.steps?.find(s => s.validationLogic?.field === 'ami');
                          if (step) handleAction(step.stepId, 'SELECT_AMI', { field: 'ami', value: ami.id });
                        }}
                        className={`border rounded p-4 cursor-pointer flex items-start justify-between ${wizardState.ami === ami.id ? 'border-aws-blue bg-blue-50 ring-1 ring-aws-blue' : 'border-gray-200 hover:border-gray-300'}`}
                     >
                        <div className="flex items-start">
                            <input type="radio" checked={wizardState.ami === ami.id} readOnly className="mt-1 mr-3 text-aws-blue focus:ring-aws-orange" />
                            <div>
                                <div className="font-bold text-sm">{ami.desc}</div>
                                <div className="text-xs text-gray-500 mt-1">{ami.name === 'macOS' ? 'Mac users' : 'Free tier eligible'}</div>
                            </div>
                        </div>
                        {ami.free && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200 mt-1">Free tier eligible</span>}
                     </div>
                 ))}
             </div>
             </div>
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Instance Type</h2>
                  <div className="group relative">
                      <Info size={16} className="text-aws-blue hover:text-aws-orange cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-white text-xs rounded p-2 z-50">
                          <strong>Why t2.micro?</strong>
                          <div className="mt-1">Instance types determine the CPU, Memory, and Network capacity. t2.micro is eligible for the Free Tier.</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             
             <div className="space-y-4">
                 <label className="block text-sm font-bold mb-1">Instance type</label>
                 <select 
                     className="aws-input"
                     value={wizardState.instanceType || ''}
                     onChange={(e) => {
                         setWizardState({...wizardState, instanceType: e.target.value});
                         const step = activeLab?.steps?.find(s => s.validationLogic?.field === 'instanceType');
                         if (step) {
                           // Send SELECT_INSTANCE_TYPE action to match expected action
                           handleAction(step.stepId, 'SELECT_INSTANCE_TYPE', { field: 'instanceType', value: e.target.value });
                         }
                     }}
                 >
                     <option value="">Select instance type</option>
                     <option value="t2.micro">t2.micro (1 vCPU, 1 GiB Memory) - Free tier eligible</option>
                     <option value="t3.micro">t3.micro (2 vCPU, 1 GiB Memory) - Free tier eligible</option>
                     <option value="t3.small">t3.small (2 vCPU, 2 GiB Memory)</option>
                     <option value="m5.large">m5.large (2 vCPU, 8 GiB Memory)</option>
                 </select>
            </div>
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Key pair (login)</h2>
                  <div className="group relative">
                      <Info size={16} className="text-aws-blue hover:text-aws-orange cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-white text-xs rounded p-2 z-50">
                          <strong>Why Key Pairs?</strong>
                          <div className="mt-1">A key pair, consisting of a private key and a public key, is a set of security credentials that you use to prove your identity when connecting to an instance.</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-bold mb-1">Key pair name</label>
                    <div className="flex space-x-2">
                        <select 
                            className="aws-input flex-grow"
                            value={wizardState.keyPair || ''}
                            onChange={(e) => setWizardState({...wizardState, keyPair: e.target.value})}
                        >
                            <option value="">Proceed without a key pair (Not recommended)</option>
                            {keyPairs.map(k => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>
                        <button 
                            className="text-aws-blue text-sm hover:underline whitespace-nowrap"
                            onClick={() => setShowKeyPairModal(true)}
                        >
                            Create new key pair
                        </button>
                    </div>
                 </div>
             </div>
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Network settings</h2>
                  <div className="flex space-x-2">
                       <button className="text-aws-blue text-sm font-bold border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">Edit</button>
                  </div>
              </div>
             <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">VPC</div>
                        <select 
                            className="aws-input"
                            value={wizardState.vpcId || ''}
                            onChange={(e) => setWizardState({...wizardState, vpcId: e.target.value})}
                        >
                            <option value="">Select a VPC</option>
                            {(resources.vpc || []).map(v => (
                                <option key={v._id} value={v.state.vpcId}>{v.state.name} ({v.state.vpcId})</option>
                            ))}
                        </select>
                     </div>
                     <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subnet</div>
                        <select 
                            className="aws-input"
                            value={wizardState.subnetId || ''}
                            onChange={(e) => setWizardState({...wizardState, subnetId: e.target.value})}
                        >
                            <option value="">No preference (Default subnet in any availability zone)</option>
                            {(resources.subnet || [])
                                .filter(s => !wizardState.vpcId || s.state.vpcId === wizardState.vpcId)
                                .map(s => (
                                <option key={s._id} value={s.state.subnetId}>{s.state.name} ({s.state.subnetId})</option>
                            ))}
                        </select>
                     </div>
                     </div>
                     <div className="col-span-1 md:col-span-2">
                        <div className="flex justify-between items-center bg-gray-50 border p-3 rounded">
                            <div className="text-sm font-bold text-gray-700">Auto-assign public IP</div>
                            <div className="flex items-center">
                                <span className={`mr-3 text-sm font-bold ${wizardState.publicIp ? 'text-gray-900' : 'text-gray-400'}`}>{wizardState.publicIp ? 'Enable' : 'Disable'}</span>
                                <button 
                                    onClick={() => setWizardState({ ...wizardState, publicIp: !wizardState.publicIp })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${wizardState.publicIp ? 'bg-aws-orange' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${wizardState.publicIp ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                     </div>


                 <div className="space-y-2">
                    <div className="text-sm font-bold">Firewall (security groups)</div>
                    <div className="text-xs text-gray-600 mb-2">A security group is a set of firewall rules that control the traffic for your instance.</div>
                    
                    <div className="flex space-x-6 mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="sgMode" 
                                checked={wizardState.sgMode !== 'select'}
                                onChange={() => setWizardState({...wizardState, sgMode: 'create'})}
                                className="text-aws-blue focus:ring-aws-orange"
                            />
                            <span className="text-sm font-medium">Create security group</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="sgMode" 
                                checked={wizardState.sgMode === 'select'}
                                onChange={() => setWizardState({...wizardState, sgMode: 'select'})}
                                className="text-aws-blue focus:ring-aws-orange"
                            />
                            <span className="text-sm font-medium">Select existing security group</span>
                        </label>
                    </div>

                     {wizardState.sgMode === 'select' ? (
                        <div className="border rounded p-2 max-h-32 overflow-y-auto bg-gray-50">
                             {(resources.securityGroup || []).map(sg => (
                                 <div key={sg._id} className="flex items-center mb-1">
                                     <input 
                                         type="checkbox" 
                                         className="mr-2"
                                         checked={(wizardState.securityGroups || []).includes(sg.state.groupId)}
                                         onChange={(e) => {
                                             const current = wizardState.securityGroups || [];
                                             const newSgs = e.target.checked ? [...current, sg.state.groupId] : current.filter(id => id !== sg.state.groupId);
                                             setWizardState({...wizardState, securityGroups: newSgs});
                                         }}
                                     />
                                     <span className="text-sm font-mono">{sg.state.groupName} ({sg.state.groupId})</span>
                                 </div>
                             ))}
                             {(resources.securityGroup || []).length === 0 && <div className="text-xs text-gray-500 italic p-2">No existing security groups found in this VPC.</div>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex space-x-6 mb-2">
                                <label className="flex items-center text-sm font-bold"><input type="checkbox" className="mr-2" checked={wizardState.sgRules?.ssh || false} onChange={e => setWizardState({...wizardState, sgRules: {...wizardState.sgRules, ssh: e.target.checked}})} /> Allow SSH traffic</label>
                                <label className="flex items-center text-sm font-bold"><input type="checkbox" className="mr-2" checked={wizardState.sgRules?.http || false} onChange={e => setWizardState({...wizardState, sgRules: {...wizardState.sgRules, http: e.target.checked}})} /> Allow HTTP traffic</label>
                                <label className="flex items-center text-sm font-bold"><input type="checkbox" className="mr-2" checked={wizardState.sgRules?.https || false} onChange={e => setWizardState({...wizardState, sgRules: {...wizardState.sgRules, https: e.target.checked}})} /> Allow HTTPS traffic</label>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
                                {wizardState.sgRules?.ssh && <div className="grid grid-cols-3 text-xs gap-2 items-center"><span className="font-mono">SSH</span><span>TCP 22</span><span>0.0.0.0/0</span></div>}
                                {wizardState.sgRules?.http && <div className="grid grid-cols-3 text-xs gap-2 items-center"><span className="font-mono">HTTP</span><span>TCP 80</span><span>0.0.0.0/0</span></div>}
                                {wizardState.sgRules?.https && <div className="grid grid-cols-3 text-xs gap-2 items-center"><span className="font-mono">HTTPS</span><span>TCP 443</span><span>0.0.0.0/0</span></div>}
                                {!wizardState.sgRules?.ssh && !wizardState.sgRules?.http && !wizardState.sgRules?.https && <div className="text-xs text-gray-400 italic">No rules selected.</div>}
                            </div>
                        </div>
                    )}
                 </div>
             </div>
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
               <div className="flex justify-between items-center mb-4">
                   <h2 className="font-bold text-lg flex items-center">
                       Configure storage
                       <span className="text-aws-blue text-xs font-normal ml-2 cursor-pointer hover:underline">Info</span>
                   </h2>
                   <span className="text-aws-blue text-sm font-bold cursor-pointer hover:underline">Advanced</span>
               </div>

              <div className="border border-gray-300 rounded p-4">
                 <div className="flex items-start space-x-3 mb-4">
                     <span className="pt-2 text-sm">1x</span>
                     
                     <div className="w-24">
                        <input 
                            type="number" 
                            className="aws-input h-9"
                            value={wizardState.storage?.size || 8}
                            onChange={(e) => setWizardState({...wizardState, storage: { ...wizardState.storage, size: parseInt(e.target.value) || 8 }})}
                        />
                     </div>
                     <span className="pt-2 text-sm">GiB</span>

                     {/* Custom Volume Type Selector */}
                     <div className="relative w-64 group z-20">
                        <div className="aws-input h-9 flex items-center justify-between cursor-pointer bg-white" tabIndex={0}>
                            <span className="truncate text-sm">{
                                {
                                    'gp3': 'General Purpose SSD (gp3)',
                                    'gp2': 'General Purpose SSD (gp2)',
                                    'io1': 'Provisioned IOPS SSD (io1)', 
                                    'io2': 'Provisioned IOPS SSD (io2)',
                                    'standard': 'Magnetic (standard)'
                                }[wizardState.storage?.type || 'gp3']
                            }</span>
                            <ChevronDown size={14} className="text-gray-500" />
                        </div>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-0 w-[400px] bg-white border border-gray-300 shadow-lg rounded-b mt-1 hidden group-focus-within:block z-50">
                            <div className="p-2 border-b border-gray-100">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2 top-2 text-gray-400"/>
                                    <input className="w-full border border-gray-300 rounded pl-8 py-1 text-xs focus:outline-none focus:border-aws-blue" placeholder="Filter volume types"/>
                                </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto py-1">
                                {[
                                    { id: 'gp3', label: 'General purpose SSD (gp3)', free: true },
                                    { id: 'gp2', label: 'General purpose SSD (gp2)', free: true },
                                    { id: 'io1', label: 'Provisioned IOPS SSD (io1)', free: false },
                                    { id: 'io2', label: 'Provisioned IOPS SSD (io2)', free: false },
                                    { id: 'sc1', label: 'Cold HDD (sc1)', free: true, disabled: true, note: 'This volume type is not compatible with root volumes.' },
                                    { id: 'st1', label: 'Throughput Optimized HDD (st1)', free: true, disabled: true, note: 'This volume type is not compatible with root volumes.' },
                                    { id: 'standard', label: 'Magnetic (standard)', free: true }
                                ].map(opt => (
                                    <div 
                                        key={opt.id}
                                        className={`px-4 py-2 text-sm flex flex-col hover:bg-aws-blue hover:text-white cursor-pointer ${opt.disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:text-gray-500' : ''}`}
                                        onClick={() => !opt.disabled && setWizardState({...wizardState, storage: { ...wizardState.storage, type: opt.id, size: (opt.id === 'io1' || opt.id === 'io2') ? 100 : 8 }})}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span>{opt.label}</span>
                                            {opt.free && <span className="text-gray-500 text-xs italic group-hover:text-blue-100">Free tier eligible</span>}
                                        </div>
                                        {opt.note && <span className="text-xs text-red-500 mt-1">{opt.note}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>

                     <span className="pt-2 text-sm text-gray-500">Root volume, Not encrypted</span>
                 </div>

                 <button className="text-aws-blue font-bold text-sm border border-aws-blue rounded px-4 py-1 hover:bg-blue-50 mb-4">Add new volume</button>

                 <div className="text-xs text-gray-600 mb-4 border-t pt-4">
                    The selected AMI contains instance store volumes, however the instance does not allow any instance store volumes. None of the instance store volumes from the AMI will be accessible from the instance
                 </div>
                 
                 <div className="text-xs text-gray-600 border-t pt-4 flex justify-between items-center">
                     <span className="flex items-center"><RefreshCw size={12} className="mr-1"/> Click refresh to view backup information</span>
                     <span className="text-aws-blue cursor-pointer hover:underline">Edit</span>
                 </div>
              </div>
           </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4 cursor-pointer" onClick={() => setAdvancedDetailsOpen(!advancedDetailsOpen)}>
                  <h2 className="font-bold flex items-center">
                      <ChevronRight size={20} className={`mr-2 transform transition-transform ${advancedDetailsOpen ? 'rotate-90' : ''}`} /> 
                      Advanced details
                  </h2>
              </div>
              
              {advancedDetailsOpen && (
                 <div className="mb-4">
                     <label className="block text-sm font-bold mb-1">User data <span className="text-gray-500 font-normal">(Optional)</span></label>
                     <textarea 
                        className="aws-input h-32 font-mono text-xs" 
                        placeholder="#!/bin/bash&#10;yum update -y&#10;yum install -y httpd&#10;systemctl start httpd"
                        value={wizardState.userData}
                        onChange={(e) => setWizardState({...wizardState, userData: e.target.value})}
                     />
                 </div>
              )}
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Summary</h2>
                  <div className="group relative">
                      <Info size={16} className="text-aws-blue hover:text-aws-orange cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-white text-xs rounded p-2 z-50">
                          <strong>Why Review?</strong>
                          <div className="mt-1">Review your configuration to ensure cost, security, and performance meet your requirements before launching resources that you pay for.</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4 text-sm space-y-2">
                 <div className="flex justify-between"><span>Name:</span> <span className="font-bold">{wizardState.name || '-'}</span></div>
                 <div className="flex justify-between"><span>AMI:</span> <span className="font-bold">{wizardState.ami || '-'}</span></div>
                 <div className="flex justify-between"><span>Type:</span> <span className="font-bold">{wizardState.instanceType || '-'}</span></div>
                 <div className="flex justify-between"><span>VPC:</span> <span className="font-bold font-mono">{wizardState.vpcId || '-'}</span></div>
                 <div className="flex justify-between"><span>Subnet:</span> <span className="font-bold font-mono">{wizardState.subnetId || '-'}</span></div>
                 <div className="flex justify-between"><span>Security Groups:</span> <span className="font-bold">{(wizardState.securityGroups || []).length} selected</span></div>
                 <div className="flex justify-between"><span>Key Pair:</span> <span className="font-bold">{wizardState.keyPair || 'None'}</span></div>
                 <div className="flex justify-between"><span>Storage:</span> <span className="font-bold">{wizardState.storage?.size || '-'} GiB ({wizardState.storage?.type || '-'})</span></div>
                 <div className="flex justify-between"><span>User Data:</span> <span className="font-bold">{wizardState.userData ? 'Included' : 'None'}</span></div>
             </div>
             <button 
                className="w-full bg-aws-orange hover:bg-[#ec8900] text-white font-bold py-2 px-4 rounded shadow"
                onClick={async () => {
                    // Validation checks
                    if (!wizardState.name) {
                      console.warn('⚠️ [EC2 Console] Validation failed: Instance Name is required');
                      return toast.error('Instance Name is required.');
                    }
                    if (!wizardState.ami) {
                      console.warn('⚠️ [EC2 Console] Validation failed: AMI is required');
                      return toast.error('Please select an AMI.');
                    }
                    if (!wizardState.instanceType) {
                      console.warn('⚠️ [EC2 Console] Validation failed: Instance Type is required');
                      return toast.error('Please select an Instance Type.');
                    }
                    if (!wizardState.vpcId) {
                      console.warn('⚠️ [EC2 Console] Validation failed: VPC is required');
                      return toast.error('VPC selection is required.');
                    }
                    if (!wizardState.subnetId) {
                      console.warn('⚠️ [EC2 Console] Validation failed: Subnet is required');
                      return toast.error('Subnet selection is required.');
                    }
                    
                    // Before launching, ensure all prerequisite steps are validated
                    console.log('🔍 [EC2 Console] Ensuring prerequisite steps are validated...');
                    
                    // Validate missing steps if they have data - wait for each to complete
                    if (activeLab?.steps) {
                      const validationPromises = [];
                      
                      // Validate instance type step if not completed
                      const instanceTypeStep = activeLab.steps.find(s => s.validationLogic?.field === 'instanceType');
                      if (instanceTypeStep && wizardState.instanceType) {
                        const currentState = store.getState();
                        const currentCompletedSteps = currentState.simulation.completedSteps;
                        if (!currentCompletedSteps.includes(instanceTypeStep.stepId)) {
                          console.log('✅ [EC2 Console] Auto-validating instance type step before launch');
                          validationPromises.push(
                            dispatch(validateStep({
                              userId,
                              labId: activeLab.labId,
                              stepId: instanceTypeStep.stepId,
                              action: 'SELECT_INSTANCE_TYPE',
                              payload: { field: 'instanceType', value: wizardState.instanceType }
                            }))
                          );
                        }
                      }
                      
                      // Validate AMI step if not completed
                      const amiStep = activeLab.steps.find(s => s.validationLogic?.field === 'ami');
                      if (amiStep && wizardState.ami) {
                        const currentState = store.getState();
                        const currentCompletedSteps = currentState.simulation.completedSteps;
                        if (!currentCompletedSteps.includes(amiStep.stepId)) {
                          console.log('✅ [EC2 Console] Auto-validating AMI step before launch');
                          validationPromises.push(
                            dispatch(validateStep({
                              userId,
                              labId: activeLab.labId,
                              stepId: amiStep.stepId,
                              action: 'SELECT_AMI',
                              payload: { field: 'ami', value: wizardState.ami }
                            }))
                          );
                        }
                      }
                      
                      // Validate name step if not completed
                      const nameStep = activeLab.steps.find(s => s.validationLogic?.field === 'name');
                      if (nameStep && wizardState.name) {
                        const currentState = store.getState();
                        const currentCompletedSteps = currentState.simulation.completedSteps;
                        if (!currentCompletedSteps.includes(nameStep.stepId)) {
                          console.log('✅ [EC2 Console] Auto-validating name step before launch');
                          validationPromises.push(
                            dispatch(validateStep({
                              userId,
                              labId: activeLab.labId,
                              stepId: nameStep.stepId,
                              action: 'INPUT_VALUE',
                              payload: { field: 'name', value: wizardState.name }
                            }))
                          );
                        }
                      }
                      
                      // Wait for all validations to complete
                      if (validationPromises.length > 0) {
                        console.log(`⏳ [EC2 Console] Waiting for ${validationPromises.length} step validations to complete...`);
                        await Promise.all(validationPromises);
                        console.log('✅ [EC2 Console] All step validations completed');
                        // Small delay to ensure state is updated
                        await new Promise(resolve => setTimeout(resolve, 100));
                      }
                    }
                    
                    const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'EC2_INSTANCE');
                    console.log('🔍 [EC2 Console] Found launch step:', step);
                    
                    const launchPayload = { 
                        name: wizardState.name,
                        ami: wizardState.ami,
                        instanceType: wizardState.instanceType,
                        vpcId: wizardState.vpcId,
                        subnetId: wizardState.subnetId,
                        securityGroups: wizardState.securityGroups,
                        userData: wizardState.userData,
                        keyPair: wizardState.keyPair,
                        storage: wizardState.storage
                    };
                    
                    console.log('📤 [EC2 Console] Launching instance with payload:', launchPayload);
                    handleAction(step?.stepId || null, 'CLICK_FINAL_LAUNCH', launchPayload);

                }}
             >
                 Launch Instance
             </button>
             <button className="w-full mt-2 text-sm text-gray-600 hover:text-gray-900" onClick={() => setOnLaunchPage(false)}>Cancel</button>
          </div>
      </div>
  );
};

export default Ec2Dashboard;
