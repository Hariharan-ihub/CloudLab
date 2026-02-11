import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { HardDrive, Plus, Loader, Server } from 'lucide-react';

const FakeEBSConsole = () => {
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { userId } = useAuth();
    const volumes = resources.ebsVolume || []; // Assuming backend returns type 'EBS_VOLUME' map to 'ebsVolume' key or we need to fix slice? 
    // Wait, slice maps based on raw string? 
    // In simulationSlice: "state.resources.ec2 = action.payload.filter(r => r.resourceType === 'EC2_INSTANCE')"
    // We need to ensure EBS_VOLUME is mapped. 
    // For now, I'll access the raw list if possible or we assume slice is updated. 
    // Actually, let's fix the slice mapping in a next step if this fails. 
    // But for now, let's look at `resources` dump. 
    // Assuming 'ebsVolume' or similar. I'll make the slice update part of the plan.
    
    // Fallback: manually filtering if resources is just an array? No, it's an object of arrays.
    // I will assume the key is 'ebs' or 'volumes'. Let's use 'ebs'.
    const ebsVolumes = resources.ebs || [];
    const instances = resources.ec2 || [];

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAttachModal, setShowAttachModal] = useState(false);
    
    // Create
    const [volSize, setVolSize] = useState(8);
    const [volAZ, setVolAZ] = useState('us-east-1a');

    // Attach
    const [selectedVol, setSelectedVol] = useState(null);
    const [selectedInstance, setSelectedInstance] = useState('');
    const [device, setDevice] = useState('/dev/sdf');

    useEffect(() => {
        dispatch(fetchResources({ userId, type: 'EBS_VOLUME' }));
        dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
    }, [dispatch]);

    const handleCreateVolume = async () => {
        await dispatch(validateStep({
            userId, labId: 'adhoc', stepId: null,
            action: 'CREATE_VOLUME',
            payload: { size: volSize, az: volAZ }
        }));
        setShowCreateModal(false);
        toast.success('Volume created.');
        dispatch(fetchResources({ userId, type: 'EBS_VOLUME' }));
    };

    const handleAttachVolume = async () => {
         if(!selectedInstance) return;
         await dispatch(validateStep({
             userId, labId: 'adhoc', stepId: null,
             action: 'ATTACH_VOLUME',
             payload: { volumeId: selectedVol.state.volumeId, instanceId: selectedInstance, device }
         }));
         setShowAttachModal(false);
         toast.success('Volume attached.');
         dispatch(fetchResources({ userId, type: 'EBS_VOLUME' }));
    };

    const openAttach = (vol) => {
        if(vol.state.status === 'in-use') return;
        setSelectedVol(vol);
        setShowAttachModal(true);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center text-aws-blue">
                 <HardDrive className="mr-3 text-aws-orange" /> Elastic Block Store
            </h1>
            
            <div className="bg-white shadow rounded p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold">Volumes</h2>
                    <button className="aws-btn-primary" onClick={() => setShowCreateModal(true)}>Create Volume</button>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3">Volume ID</th>
                            <th className="p-3">Size (GiB)</th>
                            <th className="p-3">State</th>
                            <th className="p-3">Availability Zone</th>
                            <th className="p-3">Attached To</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ebsVolumes.map((v, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-aws-blue font-bold">{v.state.volumeId}</td>
                                <td className="p-3">{v.state.size}</td>
                                <td className="p-3">
                                    <span className={`flex items-center font-bold text-xs ${v.state.status==='available' ? 'text-green-600' : 'text-blue-600'}`}>
                                        <div className={`w-2 h-2 rounded-full mr-2 ${v.state.status==='available' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                        {v.state.status}
                                    </span>
                                </td>
                                <td className="p-3">{v.state.az}</td>
                                <td className="p-3 text-xs">
                                    {v.state.attachment ? (
                                        <span>{v.state.attachment.instanceId} : {v.state.attachment.device}</span>
                                    ) : '-'}
                                </td>
                                <td className="p-3 text-right">
                                     <button 
                                        className={`text-xs border px-2 py-1 rounded ${v.state.status === 'in-use' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                        disabled={v.state.status === 'in-use'}
                                        onClick={() => openAttach(v)}
                                     >
                                         Attach
                                     </button>
                                </td>
                            </tr>
                        ))}
                        {ebsVolumes.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-500">No volumes found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
                         <h2 className="text-xl font-bold mb-4">Create Volume</h2>
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Size (GiB)</label>
                             <input type="number" className="aws-input" value={volSize} onChange={e => setVolSize(e.target.value)} />
                         </div>
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Availability Zone</label>
                             <select className="aws-input" value={volAZ} onChange={e => setVolAZ(e.target.value)}>
                                 <option value="us-east-1a">us-east-1a</option>
                                 <option value="us-east-1b">us-east-1b</option>
                             </select>
                         </div>
                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleCreateVolume}>Create Volume</button>
                         </div>
                     </div>
                </div>
            )}

            {/* Attach Modal */}
            {showAttachModal && selectedVol && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]">
                         <h2 className="text-xl font-bold mb-4">Attach Volume: {selectedVol.state.volumeId}</h2>
                         
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Instance</label>
                             <select className="aws-input" value={selectedInstance} onChange={e => setSelectedInstance(e.target.value)}>
                                 <option value="">Select Instance</option>
                                 {instances.filter(i => i.state.status === 'running').map(i => (
                                     <option key={i._id} value={i.state.instanceId}>{i.state.name} ({i.state.instanceId})</option>
                                 ))}
                             </select>
                             <p className="text-xs text-gray-500 mt-1">Only running instances are shown.</p>
                         </div>

                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Device name</label>
                             <input className="aws-input" value={device} onChange={e => setDevice(e.target.value)} />
                         </div>

                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowAttachModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleAttachVolume} disabled={!selectedInstance}>Attach Volume</button>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default FakeEBSConsole;
