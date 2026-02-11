import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Activity, Clock, FileText, ChevronRight } from 'lucide-react';

const FakeCloudWatchConsole = () => {
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { userId } = useAuth();
    const logGroups = resources.logGroups || [];
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    
    const [activeGroup, setActiveGroup] = useState(null); // When drilling down into a group
    const [simulatedStreams, setSimulatedStreams] = useState([]);
    const [activeStream, setActiveStream] = useState(null);

    useEffect(() => {
        dispatch(fetchResources({ userId, type: 'CLOUDWATCH_LOG_GROUP' }));
    }, [dispatch]);

    const handleCreateLogGroup = async () => {
        if(newGroupName) {
            await dispatch(validateStep({
                 userId, labId: 'adhoc', stepId: null, 
                 action: 'CREATE_LOG_GROUP', 
                 payload: { logGroupName: newGroupName }
            }));
            
            setNewGroupName('');
            setShowCreateModal(false);
            toast.success('Log Group created');
            dispatch(fetchResources({ userId, type: 'CLOUDWATCH_LOG_GROUP' }));
        }
    };

    const openGroup = (group) => {
        setActiveGroup(group);
        // Simulate streams for this group
        setSimulatedStreams([
            { name: `i-${Math.random().toString(36).substr(2, 9)}`, lastEvent: '1 minute ago' },
            { name: `i-${Math.random().toString(36).substr(2, 9)}`, lastEvent: '5 minutes ago' }
        ]);
        setActiveStream(null);
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4 flex items-center text-aws-blue">
                 <Activity className="mr-3 text-pink-600" /> CloudWatch
            </h1>

            {!activeGroup ? (
                // Log Groups List
                <div className="bg-white shadow rounded p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg">Log groups</h2>
                        <button className="aws-btn-primary" onClick={() => setShowCreateModal(true)}>Create log group</button>
                    </div>
                    
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="p-3">Log group name</th>
                                <th className="p-3">Retention</th>
                                <th className="p-3">Creation Date</th>
                            </tr>
                        </thead>
                         <tbody>
                            {logGroups.map((g, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => openGroup(g)}>
                                    <td className="p-3 text-aws-blue font-bold hover:underline flex items-center"><FileText size={14} className="mr-2"/> {g.state.logGroupName}</td>
                                    <td className="p-3">{g.state.retention}</td>
                                    <td className="p-3">{new Date(g.state.createdDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {logGroups.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-gray-500">No log groups found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : !activeStream ? (
                // Streams List
                <div className="bg-white shadow rounded p-4 border border-gray-200">
                    <div className="flex items-center text-sm text-gray-500 mb-4 cursor-pointer hover:underline" onClick={() => setActiveGroup(null)}>
                        Log groups <ChevronRight size={14}/> {activeGroup.state.logGroupName}
                    </div>
                    <h2 className="font-bold text-lg mb-4">Log streams</h2>
                    
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="p-3">Log stream name</th>
                                <th className="p-3">Last event time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {simulatedStreams.map((s, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setActiveStream(s)}>
                                    <td className="p-3 text-aws-blue font-bold hover:underline">{s.name}</td>
                                    <td className="p-3">{s.lastEvent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // Log Events View
                <div className="bg-white shadow rounded p-4 border border-gray-200 flex-1 flex flex-col">
                     <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="cursor-pointer hover:underline" onClick={() => setActiveGroup(null)}>Log groups</span> 
                        <ChevronRight size={14}/> 
                        <span className="cursor-pointer hover:underline" onClick={() => setActiveStream(null)}>{activeGroup.state.logGroupName}</span>
                        <ChevronRight size={14}/>
                        <span className="font-bold text-black">{activeStream.name}</span>
                    </div>
                    
                    <div className="bg-gray-900 text-gray-300 font-mono text-xs p-4 rounded h-[400px] overflow-y-auto">
                        <div className="mb-1"><span className="text-gray-500">{new Date().toISOString()}</span> [INFO] Starting application...</div>
                        <div className="mb-1"><span className="text-gray-500">{new Date().toISOString()}</span> [INFO] Loaded configuration from /etc/config</div>
                        <div className="mb-1"><span className="text-gray-500">{new Date().toISOString()}</span> [INFO] Connected to DB at {activeGroup.state.logGroupName === '/aws/lambda/my-func' ? 'db-cluster-1' : 'localhost'}</div>
                        <div className="mb-1"><span className="text-gray-500">{new Date().toISOString()}</span> [WARN] High memory usage detected (85%)</div>
                        <div className="mb-1 text-green-400"><span className="text-gray-500">{new Date().toISOString()}</span> [INFO] Request processed successfully (200 OK)</div>
                    </div>
                </div>
            )}

            {/* Create Log Group Modal */}
            {showCreateModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]">
                         <h2 className="text-xl font-bold mb-4">Create log group</h2>
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Log group name</label>
                             <input 
                                className="aws-input" 
                                placeholder="/aws/ec2/my-app" 
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                             />
                         </div>
                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleCreateLogGroup}>Create</button>
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default FakeCloudWatchConsole;
