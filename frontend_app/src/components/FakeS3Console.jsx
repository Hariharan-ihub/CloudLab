import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import toast from 'react-hot-toast';
import { Search, Database, ArrowLeft, Upload, Trash2, File, ToggleLeft, ToggleRight, MoreVertical, RefreshCw, Eye } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const FakeS3Console = () => {
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { activeLab } = useSelector(state => state.lab);
    const buckets = resources.s3 || [];
    
    // ... State ...
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBucketName, setNewBucketName] = useState('');
    const [viewBucket, setViewBucket] = useState(null); 
    const [fileToUpload, setFileToUpload] = useState(null);
    const [viewObject, setViewObject] = useState(null); // State for viewing object content
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, name: null });

    const userId = 'user-123';

    // Fetch Resources
    useEffect(() => {
        dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
    }, [dispatch]);

    // Validate Navigation (Step 1)
    useEffect(() => {
         if (activeLab?.steps) {
             const navStep = activeLab.steps.find(s => s.validationLogic?.type === 'URL_CONTAINS' && s.validationLogic.value === '/service/s3');
             if (navStep) {
                 dispatch(validateStep({
                    userId,
                    labId: activeLab.labId,
                    stepId: navStep.stepId,
                    action: 'NAVIGATE',
                    payload: { url: '/service/s3' }
                 }));
             }
         }
    }, [activeLab, dispatch]);

    // Handle Bucket Creation
    const handleCreateBucket = async () => {
        if (!newBucketName) return;
        
        const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'S3_BUCKET');
        
        await dispatch(validateStep({
            userId,
            labId: activeLab?.labId || 'adhoc',
            stepId: step?.stepId || null,
            action: 'CREATE_BUCKET',
            payload: { bucketName: newBucketName, region: 'us-east-1' }
        }));
        
        setNewBucketName('');
        setShowCreateModal(false);
        toast.success(`Bucket ${newBucketName} created.`);
        dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
    };

    // Handle Bucket Deletion
    const handleDeleteBucket = (bucketName) => {
        setDeleteConfirm({ show: true, type: 'BUCKET', name: bucketName });
    };

    // Handle Object Upload
    const handleUpload = async () => {
         if (!fileToUpload || !viewBucket) return;
         
         const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'FILE_UPLOAD');

         await dispatch(validateStep({
             userId, 
             labId: activeLab?.labId || 'adhoc', 
             stepId: step?.stepId || null,
             action: 'UPLOAD_OBJECT',
             payload: { 
                 bucketName: viewBucket.state.bucketName,
                 fileName: fileToUpload.name,
                 fileSize: '15KB' 
             }
         }));
         
         setFileToUpload(null);
         toast.success('Object uploaded');
         // Refresh resources to see new object
         dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
         
         // Update local viewBucket state with fresh data
         // We need to wait a sec for the fetch to update the store, then update viewBucket
         // For simplicity, we'll rely on the resource list update
    };
    
    // Update viewBucket when resources change
    useEffect(() => {
        if (viewBucket) {
            const updatedBucket = buckets.find(b => b.state.bucketName === viewBucket.state.bucketName);
            // Deep comparison or simple toggle check. 
            // If updatedBucket exists, we should update viewBucket to reflect new objects list.
            if (updatedBucket) {
                // Only update if content actually changed to avoid render loops, or just update since object refs change in Redux
                if (JSON.stringify(updatedBucket.state.objects) !== JSON.stringify(viewBucket.state.objects) || 
                    updatedBucket.state.versioning !== viewBucket.state.versioning) {
                    setViewBucket(updatedBucket);
                }
            } else {
                // Bucket was deleted
                setViewBucket(null);
            }
        }
    }, [buckets, viewBucket]);

    // Handle Toggle Versioning
    const toggleVersioning = async () => {
         if (!viewBucket) return;
         const currentStatus = viewBucket.state.versioning === 'Enabled';
         
         const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'CONFIG_CHANGE' && s.validationLogic.setting === 'static_website_hosting');

         await dispatch(validateStep({
             userId, 
             labId: activeLab?.labId || 'adhoc', 
             stepId: step?.stepId || null,
             action: 'TOGGLE_VERSIONING',
             payload: { 
                 bucketName: viewBucket.state.bucketName,
                 enabled: !currentStatus
             }
         }));
         toast.success(`Versioning ${!currentStatus ? 'enabled' : 'suspended'}`);
         dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
    };

    // Handle Object Deletion (Trigger Modal)
    const handleDeleteObject = (fileName) => {
        setDeleteConfirm({ show: true, type: 'OBJECT', name: fileName });
    };

    // Execute Deletion
    const executeDelete = async () => {
        const { type, name } = deleteConfirm;
        if (!name) return;

        if (type === 'BUCKET') {
            await dispatch(validateStep({
                 userId, labId: 'adhoc', stepId: null,
                 action: 'DELETE_BUCKET',
                 payload: { bucketName: name }
            }));
            toast.success('Bucket deleted');
            if (viewBucket?.state?.bucketName === name) setViewBucket(null);
        } else if (type === 'OBJECT') {
            await dispatch(validateStep({
                 userId, labId: 'adhoc', stepId: null,
                 action: 'DELETE_OBJECT',
                 payload: { bucketName: viewBucket.state.bucketName, fileName: name }
            }));
            toast.success(`Object ${name} deleted`);
        }
        
        dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
        setDeleteConfirm({ show: false, type: null, name: null });
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4 flex items-center text-aws-blue">
                 <Database className="mr-3" /> Amazon S3
            </h1>

            {!viewBucket ? (
                // --- BUCKET LIST VIEW ---
                <div className="bg-white shadow rounded p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative w-64">
                            <input className="aws-input pl-8" placeholder="Find buckets by name" />
                            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                        </div>
                        <button className="aws-btn-primary" onClick={() => setShowCreateModal(true)}>Create bucket</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">AWS Region</th>
                                    <th className="p-3">Creation Date</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {buckets.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            No buckets found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    buckets.map((b, i) => (
                                        <tr key={i} className="border-b hover:bg-gray-50">
                                            <td 
                                                className="p-3 text-aws-blue font-bold cursor-pointer hover:underline flex items-center"
                                                onClick={() => setViewBucket(b)}
                                            >
                                                <Database size={14} className="mr-2 text-aws-orange"/> 
                                                {b.state.bucketName}
                                            </td>
                                            <td className="p-3">{b.state.region}</td>
                                            <td className="p-3">{new Date(b.state.createdDate).toLocaleDateString()}</td> 
                                            <td className="p-3 text-right">
                                                <button 
                                                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteBucket(b.state.bucketName); }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // --- BUCKET DETAILS VIEW ---
                <div className="bg-white shadow rounded h-full flex flex-col border border-gray-200">
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t">
                        <div className="flex items-center">
                            <button className="mr-4 text-aws-blue hover:underline flex items-center" onClick={() => setViewBucket(null)}>
                                <ArrowLeft size={16} className="mr-1" /> Buckets
                            </button>
                            <span className="text-gray-400 mx-2">/</span>
                            <span className="font-bold text-lg">{viewBucket.state.bucketName}</span>
                            <span className={`ml-4 text-xs px-2 py-0.5 rounded border ${viewBucket.state.versioning === 'Enabled' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                                Versioning: {viewBucket.state.versioning || 'Suspended'}
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <button className="aws-btn-secondary flex items-center" onClick={toggleVersioning}>
                                <RefreshCw size={14} className="mr-1"/> Toggle Versioning
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-lg">Objects</h3>
                             
                             <div className="flex items-center space-x-2">
                                 <input 
                                    type="file" 
                                    id="file-upload" 
                                    className="hidden" 
                                    onChange={(e) => setFileToUpload(e.target.files[0])}
                                 />
                                 {fileToUpload ? (
                                     <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                                         <span className="text-sm font-bold text-aws-blue">{fileToUpload.name}</span>
                                         <button className="aws-btn-primary py-1" onClick={handleUpload}>Upload</button>
                                         <button className="text-gray-500 hover:text-black" onClick={() => setFileToUpload(null)}>Cancel</button>
                                     </div>
                                 ) : (
                                     <label htmlFor="file-upload" className="aws-btn-primary cursor-pointer flex items-center">
                                         <Upload size={14} className="mr-1" /> Upload
                                     </label>
                                 )}
                             </div>
                         </div>
                         
                         <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Last Modified</th>
                                    <th className="p-3">Size</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(viewBucket.state.objects || []).map((obj, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-aws-blue font-bold flex items-center">
                                            <File size={14} className="mr-2 text-gray-400"/> {obj.key}
                                        </td>
                                        <td className="p-3">Standard</td>
                                        <td className="p-3">{new Date(obj.lastModified).toLocaleDateString()}</td>
                                        <td className="p-3">{obj.size}</td>
                                        <td className="p-3 text-right flex justify-end space-x-2">
                                            <button 
                                                className="text-gray-600 hover:bg-gray-100 p-1 rounded"
                                                onClick={() => setViewObject(obj)}
                                                title="View content"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                onClick={() => handleDeleteObject(obj.key)}
                                                title="Delete object"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!viewBucket.state.objects || viewBucket.state.objects.length === 0) && (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No objects in this bucket.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Bucket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]">
                        <h2 className="text-xl font-bold mb-4">Create bucket</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1">Bucket name</label>
                            <input 
                                className="aws-input" 
                                placeholder="my-awesome-bucket" 
                                value={newBucketName}
                                onChange={e => setNewBucketName(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Bucket name must be unique.</p>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button className="aws-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="aws-btn-primary" onClick={handleCreateBucket}>Create bucket</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Object View Modal */}
            {viewObject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-[600px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center">
                                <File className="mr-2" size={20}/> {viewObject.key}
                            </h2>
                            <button onClick={() => setViewObject(null)} className="text-gray-500 hover:text-black">✕</button>
                        </div>
                        
                        <div className="mb-6">
                            <div className="bg-gray-100 p-4 rounded border border-gray-300 font-mono text-sm h-64 overflow-auto">
                                <p className="text-gray-500 italic mb-2">// File Content Preview</p>
                                <p>This is a simulated preview of the file content.</p>
                                <p>File Name: {viewObject.key}</p>
                                <p>Size: {viewObject.size}</p>
                                <p>Last Modified: {new Date(viewObject.lastModified).toLocaleString()}</p>
                                <br/>
                                <p className="text-gray-800">Everything looks good! This object is securely stored in your S3 bucket.</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button className="aws-btn-primary" onClick={() => setViewObject(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Confirmation Modal */}
            <ConfirmationModal 
                isOpen={deleteConfirm.show}
                title={`Delete ${deleteConfirm.type === 'BUCKET' ? 'Bucket' : 'Object'}`}
                message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
                confirmText="Delete"
                confirmStyle="danger"
                onConfirm={executeDelete}
                onCancel={() => setDeleteConfirm({ show: false, type: null, name: null })}
            />
        </div>
    );
};

export default FakeS3Console;
