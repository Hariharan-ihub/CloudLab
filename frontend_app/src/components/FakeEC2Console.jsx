import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import ConfirmationModal from './ConfirmationModal';
import SmartTerminal from './SmartTerminal';
import toast from 'react-hot-toast';
import { Terminal, Play, Square, RefreshCcw, Power, ChevronDown, CheckCircle, X, Trash2, Info } from 'lucide-react';

const Ec2Dashboard = ({ activeLab }) => {
  const dispatch = useDispatch();
  const { currentStepId, resources, completedSteps } = useSelector(state => state.simulation);
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
    sgMode: 'create'
  });
  
  const [keyPairs, setKeyPairs] = useState(['my-key-pair', 'dev-key']);


  const [onLaunchPage, setOnLaunchPage] = useState(false);
  const [showLaunchSuccess, setShowLaunchSuccess] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingInstance, setConnectingInstance] = useState(null);
  const [actionsOpen, setActionsOpen] = useState(null); // ID of instance with open actions menu
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewInstance, setViewInstance] = useState(null);


  
  // Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionInfo, setActionInfo] = useState({ type: '', instance: null }); // { type: 'terminate'|'stop'|'reboot', instance: ... }

  const userId = 'user-123'; 

  // Load instances and networking on mount
  useEffect(() => {
     dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
     dispatch(fetchResources({ userId, type: 'VPC' }));
     dispatch(fetchResources({ userId, type: 'SUBNET' }));
     dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
      const interval = setInterval(() => {
         dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
      }, 5000);
      return () => clearInterval(interval);
  }, [dispatch]);

  // Validate navigation on mount (Step 1)
  useEffect(() => {
     if (activeLab?.steps) {
         const navStep = activeLab.steps.find(s => s.validationLogic?.type === 'URL_CONTAINS' && s.validationLogic.value === '/service/ec2');
         if (navStep) {
             handleAction(navStep.stepId, 'NAVIGATE', { url: '/service/ec2' });
         }
     }
  }, [activeLab, dispatch]);

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
    const result = await dispatch(validateStep({
      userId,
      labId: activeLab?.labId || 'adhoc',
      stepId,
      action,
      payload
    }));
    
    if (action === 'CLICK_FINAL_LAUNCH') {
        if(result.payload?.success) {
             setShowLaunchSuccess(true);
             toast.success('Instance launched successfully!');
             dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
        } else {
             toast.error('Failed to launch instance.');
        }
    } else {
        // Generic refresh for other actions
        setTimeout(() => dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' })), 500); 
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
      setWizardState({ ami: null, instanceType: null, name: '', vpcId: '', subnetId: '', securityGroups: [], userData: '', sgMode: 'create' });
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
                          {['Details', 'Security', 'Networking', 'Storage', 'Status checks', 'Tags'].map((tab, i) => (
                              <button key={tab} className={`py-4 px-1 border-b-2 font-medium text-sm ${i===0 ? 'border-aws-orange text-aws-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                {tab}
                              </button>
                          ))}
                      </nav>
                  </div>
                  <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 text-sm">
                          <div><div className="text-gray-500 mb-1">Instance ID</div><div className="font-mono">{viewInstance.state.instanceId}</div></div>
                          <div><div className="text-gray-500 mb-1">Public IPv4 address</div><div>{viewInstance.state.status === 'running' ? `3.85.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` : '-'}</div></div>
                          <div><div className="text-gray-500 mb-1">Instance state</div><div className="capitalize">{viewInstance.state.status}</div></div>
                          <div><div className="text-gray-500 mb-1">Instance type</div><div>{viewInstance.state.instanceType}</div></div>
                          <div><div className="text-gray-500 mb-1">Private IPv4 DNS</div><div>ip-172-31-{Math.floor(Math.random()*255)}-{Math.floor(Math.random()*255)}.ec2.internal</div></div>
                          <div><div className="text-gray-500 mb-1">VPC ID</div><div className="text-aws-blue cursor-pointer hover:underline">{viewInstance.state.vpcId || '-'}</div></div>
                          <div><div className="text-gray-500 mb-1">Subnet ID</div><div className="text-aws-blue cursor-pointer hover:underline">{viewInstance.state.subnetId || '-'}</div></div>
                          <div><div className="text-gray-500 mb-1">Key pair name</div><div>-</div></div>
                      </div>
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
                        setWizardState({
                            ami: 'ami-al2023',
                            instanceType: 't2.micro',
                            name: 'Marketing-Server',
                            vpcId: defaultVpc,
                            subnetId: defaultSubnet,
                            securityGroups: defaultSg ? [defaultSg] : [],
                            userData: '#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd'
                        });

                        // Trigger Validation for Auto-filled steps
                        if (activeLab?.steps) {
                             const nameStep = activeLab.steps.find(s => s.validationLogic?.field === 'name');
                             if (nameStep) handleAction(nameStep.stepId, 'INPUT_VALUE', { field: 'name', value: 'Marketing-Server' });
                             
                             const typeStep = activeLab.steps.find(s => s.validationLogic?.field === 'instanceType');
                             if (typeStep) handleAction(typeStep.stepId, 'SELECT_OPTION', { field: 'instanceType', value: 't2.micro' });
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
                 {/* Quick Start Tabs */}
                 <div className="border-b border-gray-200">
                     <div className="flex space-x-6 overflow-x-auto pb-2">
                         {['Amazon Linux', 'macOS', 'Ubuntu', 'Windows', 'Red Hat', 'Debian'].map(os => {
                             const active = (wizardState.ami && wizardState.ami.includes(os.toLowerCase().replace(' ', '-'))) || (os === 'Amazon Linux' && wizardState.ami === 'ami-al2023');
                             return (
                                 <button 
                                     key={os}
                                     className={`flex flex-col items-center space-y-2 min-w-[80px] px-2 py-2 rounded hover:bg-gray-50 transition-colors ${active ? 'border-b-2 border-aws-blue bg-blue-50' : 'border-b-2 border-transparent'}`}
                                     onClick={() => {
                                         // Mock map
                                         const map = { 'Amazon Linux': 'ami-al2023', 'macOS': 'ami-mac', 'Ubuntu': 'ami-ubuntu', 'Windows': 'ami-win', 'Red Hat': 'ami-rhel', 'Debian': 'ami-deb' };
                                         setWizardState({...wizardState, ami: map[os]});
                                     }}
                                 >
                                     <div className={`w-10 h-10 rounded border flex items-center justify-center bg-white ${active ? 'border-aws-blue' : 'border-gray-300'}`}>
                                         {/* Simple Icon Placeholders */}
                                         <span className="text-xs font-bold text-gray-600">{os.substr(0,2).toUpperCase()}</span>
                                     </div>
                                     <span className={`text-xs font-medium ${active ? 'text-aws-blue' : 'text-gray-600'}`}>{os}</span>
                                 </button>
                             );
                         })}
                     </div>
                 </div>

                 {/* AMI Detail Box */}
                 <div className="border border-gray-300 rounded p-4 bg-white">
                     <div className="flex justify-between items-start mb-2">
                         <div className="text-sm font-bold text-gray-800">
                             {wizardState.ami === 'ami-al2023' ? 'Amazon Linux 2023 AMI' : 
                              wizardState.ami === 'ami-ubuntu' ? 'Ubuntu Server 22.04 LTS' : 
                              wizardState.ami === 'ami-mac' ? 'macOS Monterey' : 'Selected Machine Image'}
                         </div>
                         <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200 font-medium">Free tier eligible</span>
                     </div>
                     <div className="text-xs text-gray-600 mb-4">
                         {wizardState.ami === 'ami-al2023' ? 'Amazon Linux 2023 (AL2023) is a modern, general-purpose Linux-based OS that provides a secure, stable, and high-performance execution environment.' : 'A stable, supported, and secure execution environment for your applications.'}
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                         <div>
                             <div className="text-gray-500 mb-1">Architecture</div>
                             <select className="aws-input py-1"><option>64-bit (x86)</option><option>64-bit (Arm)</option></select>
                         </div>
                         <div>
                             <div className="text-gray-500 mb-1">AMI ID</div>
                             <div className="font-mono text-gray-800 pt-1">{wizardState.ami}</div>
                         </div>
                         <div>
                             <div className="text-gray-500 mb-1">Virtualization</div>
                             <div className="text-gray-800 pt-1">hvm</div>
                         </div>
                         <div>
                             <div className="text-gray-500 mb-1">ENA enabled</div>
                             <div className="text-gray-800 pt-1">Yes</div>
                         </div>
                     </div>
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
                          <div className="mt-1">Instance types determine the CPU, Memory, and Network capacity. t2.micro is eligible for the Free Tier, making it great for learning.</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             <div className="space-y-4">
                 {/* Search Bar */}
                 <div className="relative">
                     <input type="text" placeholder="Search instance types (e.g. t2.micro)" className="aws-input pl-8" />
                     <div className="absolute left-2.5 top-2 text-gray-400">
                         <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                     </div>
                 </div>
                 
                 {/* Detailed Card */}
                 <div className={`border rounded bg-white overflow-hidden ${wizardState.instanceType === 't2.micro' ? 'ring-2 ring-aws-blue border-aws-blue' : 'border-gray-300'}`}>
                     {/* Header/Selection Row */}
                     <div 
                         className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-start"
                         onClick={() => {
                             setWizardState({...wizardState, instanceType: 't2.micro'});
                             const step = activeLab?.steps?.find(s => s.validationLogic?.field === 'instanceType');
                             if (step) handleAction(step.stepId, 'SELECT_OPTION', { field: 'instanceType', value: 't2.micro' });
                         }}
                     >
                         <div>
                             <div className="font-bold text-sm flex items-center">
                                 t2.micro 
                                 <span className="ml-3 font-normal bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200">Free tier eligible</span>
                             </div>
                             <div className="text-xs text-gray-500 mt-1">Family: t2 | 1 vCPU | 1 GiB Memory | Low to Moderate Network Performance</div>
                             <div className="text-xs text-gray-500 mt-1">On-Demand Linux base pricing: 0.0116 USD per Hour</div>
                         </div>
                         <div className="text-aws-blue">
                             {wizardState.instanceType === 't2.micro' && <CheckCircle size={20} fill="#2563eb" className="text-white"/>}
                         </div>
                     </div>
                 </div>

                 {/* Non-selected Mock Item (t3.micro) to show comparison */}
                 <div className={`border rounded bg-white overflow-hidden border-gray-300 opacity-60 hover:opacity-100`}>
                     <div 
                         className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-start"
                         onClick={() => setWizardState({...wizardState, instanceType: 't3.micro'})}
                     >
                         <div>
                             <div className="font-bold text-sm flex items-center">
                                 t3.micro 
                                 <span className="ml-3 font-normal bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200">Free tier eligible</span>
                             </div>
                             <div className="text-xs text-gray-500 mt-1">Family: t3 | 2 vCPU | 1 GiB Memory | Up to 5 Gigabit</div>
                         </div>
                     </div>
                 </div>
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
                            onClick={() => {
                                const newKey = `key-${Math.floor(Math.random()*1000)}`;
                                setKeyPairs([...keyPairs, newKey]);
                                setWizardState(prev => ({ ...prev, keyPair: newKey }));
                                toast.success(`Created key pair: ${newKey}`);
                            }}
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
                            <div className="bg-gray-50 border border-gray-200 rounded p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <input type="checkbox" checked readOnly className="text-aws-blue rounded" />
                                    <div className="text-sm font-bold">Allow SSH traffic from</div>
                                    <select className="text-xs border-gray-300 rounded"><option>Anywhere (0.0.0.0/0)</option><option>My IP</option></select>
                                </div>
                                <div className="text-xs text-gray-500 pl-6">Helps you connect to your instance</div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs flex items-start text-gray-700">
                                <Info size={14} className="min-w-[14px] mt-0.5 mr-2 text-yellow-600"/>
                                <span>Rules with source of 0.0.0.0/0 allow all IP addresses to access your instance. We recommend setting security group rules to allow access from known IP addresses only.</span>
                            </div>
                        </div>
                    )}
                 </div>
             </div>
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Configure storage</h2>
                  <div className="group relative">
                      <Info size={16} className="text-aws-blue hover:text-aws-orange cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-white text-xs rounded p-2 z-50">
                          <strong>Storage (EBS)</strong>
                          <div className="mt-1">Your instance launches with a Root Volume. You can configure the size and volume type.</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             <div className="flex items-end space-x-4 border rounded p-4 bg-gray-50">
                 <div className="w-24">
                    <label className="block text-xs font-bold mb-1">Size (GiB)</label>
                    <input 
                        type="number" 
                        className="aws-input"
                        value={wizardState.storage?.size || 8}
                        onChange={(e) => setWizardState({...wizardState, storage: { ...wizardState.storage, size: parseInt(e.target.value) || 8 }})}
                    />
                 </div>
                 <div className="w-48">
                    <label className="block text-xs font-bold mb-1">Volume Type</label>
                    <select 
                        className="aws-input"
                        value={wizardState.storage?.type || 'gp3'}
                        onChange={(e) => setWizardState({...wizardState, storage: { ...wizardState.storage, type: e.target.value }})}
                    >
                        <option value="gp2">General Purpose SSD (gp2)</option>
                        <option value="gp3">General Purpose SSD (gp3)</option>
                        <option value="io1">Provisioned IOPS SSD (io1)</option>
                        <option value="standard">Magnetic (standard)</option>
                    </select>
                 </div>
                 <div className="text-xs text-gray-500 pb-2">Root volume</div>
             </div>
          </div>

          <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="font-bold">Advanced details</h2>
                  <div className="group relative">
                      <Info size={16} className="text-aws-blue hover:text-aws-orange cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-white text-xs rounded p-2 z-50">
                          <strong>Why use User Data?</strong>
                          <div className="mt-1">User data scripts run when your instance launches. Use this to install software, apply updates, or configure the instance automatically (bootstrapping).</div>
                          <div className="absolute top-full right-1 w-2 h-2 bg-black transform rotate-45 -mt-1"></div>
                      </div>
                  </div>
              </div>
             <div className="mb-4">
                 <label className="block text-sm font-bold mb-1">User data <span className="text-gray-500 font-normal">(Optional)</span></label>
                 <textarea 
                    className="aws-input h-32 font-mono text-xs" 
                    placeholder="#!/bin/bash&#10;yum update -y&#10;yum install -y httpd&#10;systemctl start httpd"
                    value={wizardState.userData}
                    onChange={(e) => setWizardState({...wizardState, userData: e.target.value})}
                 />
             </div>
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
                onClick={() => {
                    // VALIDATION FAILURE INJECTION
                    if (!wizardState.name) return toast.error('Instance Name is required.');
                    if (!wizardState.ami) return toast.error('Please select an AMI.');
                    if (!wizardState.instanceType) return toast.error('Please select an Instance Type.');
                    if (!wizardState.vpcId) return toast.error('VPC selection is required.');
                    if (!wizardState.subnetId) return toast.error('Subnet selection is required.');
                    
                    const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'EC2_INSTANCE');
                    handleAction(step?.stepId || null, 'CLICK_FINAL_LAUNCH', { 
                        name: wizardState.name,
                        ami: wizardState.ami,
                        instanceType: wizardState.instanceType,
                        vpcId: wizardState.vpcId,
                        subnetId: wizardState.subnetId,
                        securityGroups: wizardState.securityGroups,
                        userData: wizardState.userData,
                        keyPair: wizardState.keyPair,
                        storage: wizardState.storage
                    });

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
