import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Trash2, Plus, Key } from 'lucide-react';

const FakeSecretsManagerConsole = () => {
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { userId } = useAuth();
    const secrets = resources.secrets || [];
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSecretName, setNewSecretName] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [secretValue, setSecretValue] = useState('');
    
    const [revealedSecret, setRevealedSecret] = useState(null); // ID of secret to show value

    useEffect(() => {
        dispatch(fetchResources({ userId, type: 'SECRETS_MANAGER_SECRET' }));
    }, [dispatch]);

    const handleCreateSecret = async () => {
        if(newSecretName && secretKey && secretValue) {
            const secretObj = {};
            secretObj[secretKey] = secretValue;

            await dispatch(validateStep({
                 userId, labId: 'adhoc', stepId: null, 
                 action: 'CREATE_SECRET', 
                 payload: { 
                     name: newSecretName, 
                     secretValue: JSON.stringify(secretObj) 
                 }
            }));
            
            setNewSecretName('');
            setSecretKey('');
            setSecretValue('');
            setShowCreateModal(false);
            toast.success('Secret stored successfully');
            dispatch(fetchResources({ userId, type: 'SECRETS_MANAGER_SECRET' }));
        }
    };

    const handleDeleteSecret = async (name) => {
        if(confirm(`Are you sure you want to delete secret ${name}?`)) {
            await dispatch(validateStep({
                 userId, labId: 'adhoc', stepId: null, 
                 action: 'DELETE_SECRET', 
                 payload: { name }
            }));
            toast.success('Secret deleted');
            dispatch(fetchResources({ userId, type: 'SECRETS_MANAGER_SECRET' }));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center text-aws-blue">
                 <Lock className="mr-3" /> Secrets Manager
            </h1>
            
            <div className="bg-white shadow rounded p-6 mb-6 border border-gray-200">
                 <div className="flex justify-between items-center mb-4">
                     <div>
                         <h2 className="font-bold text-lg">Secrets</h2>
                         <p className="text-sm text-gray-500">Store and retrieve database credentials, API keys, and other secrets.</p>
                     </div>
                     <button className="aws-btn-primary" onClick={() => setShowCreateModal(true)}>Store a new secret</button>
                 </div>
                 
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3">Secret name</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Created</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {secrets.map((s, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-aws-blue font-bold flex items-center"><Key size={14} className="mr-2 text-aws-orange"/> {s.state.name}</td>
                                <td className="p-3 text-gray-500">{s.state.description || '-'}</td>
                                <td className="p-3">{new Date(s.state.createdDate).toLocaleDateString()}</td>
                                <td className="p-3 text-right flex justify-end gap-3">
                                    <button 
                                        className="text-aws-blue flex items-center hover:underline"
                                        onClick={() => setRevealedSecret(revealedSecret === s._id ? null : s._id)}
                                    >
                                        {revealedSecret === s._id ? <EyeOff size={16} className="mr-1"/> : <Eye size={16} className="mr-1"/>}
                                        {revealedSecret === s._id ? 'Hide Value' : 'Retrieve Value'}
                                    </button>
                                    <button 
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => handleDeleteSecret(s.state.name)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {secrets.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No secrets stored.</td></tr>}
                    </tbody>
                 </table>
                 
                 {/* Secret Value Display */}
                 {revealedSecret && (
                     <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded font-mono text-sm text-gray-800">
                         <strong>Secret Value:</strong><br/>
                         {secrets.find(s => s._id === revealedSecret)?.state.secretValue}
                     </div>
                 )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]">
                         <h2 className="text-xl font-bold mb-4">Store a new secret</h2>
                         
                         <div className="mb-4">
                             <label className="block text-sm font-bold mb-1">Secret Type</label>
                             <div className="p-3 border rounded bg-blue-50 border-blue-200 text-sm font-bold text-aws-blue mb-4">Other type of secret (API key, OAuth token, etc.)</div>
                             
                             <label className="block text-sm font-bold mb-1">Key/value pairs</label>
                             <div className="flex gap-2 mb-2">
                                 <input 
                                    className="aws-input flex-1" 
                                    placeholder="Key (e.g. api_key)" 
                                    value={secretKey}
                                    onChange={e => setSecretKey(e.target.value)}
                                 />
                                 <input 
                                    className="aws-input flex-1" 
                                    placeholder="Value" 
                                    value={secretValue}
                                    onChange={e => setSecretValue(e.target.value)}
                                 />
                             </div>
                             
                             <label className="block text-sm font-bold mb-1 mt-4">Secret name</label>
                             <input 
                                className="aws-input" 
                                placeholder="prod/myapp/api-key" 
                                value={newSecretName}
                                onChange={e => setNewSecretName(e.target.value)}
                             />
                         </div>

                         <div className="flex justify-end space-x-2">
                             <button className="aws-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                             <button className="aws-btn-primary" onClick={handleCreateSecret}>Store</button>
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default FakeSecretsManagerConsole;
