import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../store/simulationSlice';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Search, Database, ArrowLeft, Upload, Trash2, File, ToggleLeft, ToggleRight, MoreVertical, RefreshCw, Eye } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const FakeS3Console = () => {
    const dispatch = useDispatch();
    const { resources } = useSelector(state => state.simulation);
    const { activeLab } = useSelector(state => state.lab);
    const { userId } = useAuth();
    const buckets = resources.s3 || [];

    // ... State ...
    const [showCreateWizard, setShowCreateWizard] = useState(false); // New full-screen wizard state
    // const [wizardStep, setWizardStep] = useState(1);

    // Create Bucket Wizard State
    const [createState, setCreateState] = useState({
        name: '',
        region: 'us-east-1',
        aclEnabled: false,
        blockPublicAccess: true,
        versioning: false,
        encryption: 'SSE-S3',
        kmsKey: ''
    });

    const [viewBucket, setViewBucket] = useState(null);

    // Upload Wizard State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadStep, setUploadStep] = useState(1); // 1: Files, 2: Permissions, 3: Properties, 4: Review
    const [filesToUpload, setFilesToUpload] = useState([]);

    const [viewObject, setViewObject] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, name: null });
    const [activeTab, setActiveTab] = useState('Objects'); // Bucket Detail Tabs

    // Fetch Resources
    useEffect(() => {
        const labId = activeLab?.labId || null;
        dispatch(fetchResources({ userId, type: 'S3_BUCKET', labId }));
    }, [dispatch, userId, activeLab?.labId]);

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
        if (!createState.name) return toast.error('Bucket name is required');

        const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'S3_BUCKET');

        await dispatch(validateStep({
            userId,
            labId: activeLab?.labId || 'adhoc',
            stepId: step?.stepId || null,
            action: 'CREATE_BUCKET',
            payload: {
                bucketName: createState.name,
                region: createState.region,
                versioning: createState.versioning ? 'Enabled' : 'Suspended'
            }
        }));

        setCreateState({ name: '', region: 'us-east-1', aclEnabled: false, blockPublicAccess: true, versioning: false, encryption: 'SSE-S3', kmsKey: '' });
        setShowCreateWizard(false);
        toast.success(`Bucket ${createState.name} created.`);
        dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
    };

    // Handle Bucket Deletion
    const handleDeleteBucket = (bucketName) => {
        setDeleteConfirm({ show: true, type: 'BUCKET', name: bucketName });
    };

    // Handle Object Upload Final Submit
    const handleUploadSubmit = async () => {
        if (filesToUpload.length === 0 || !viewBucket) return;

        const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'FILE_UPLOAD');

        // Simulate uploading each file
        for (const file of filesToUpload) {
            await dispatch(validateStep({
                userId,
                labId: activeLab?.labId || 'adhoc',
                stepId: step?.stepId || null,
                action: 'UPLOAD_OBJECT',
                payload: {
                    bucketName: viewBucket.state.bucketName,
                    fileName: file.name,
                    fileSize: (file.size / 1024).toFixed(1) + ' KB'
                }
            }));
        }

        setFilesToUpload([]);
        setShowUploadModal(false);
        setUploadStep(1);
        toast.success('Objects uploaded successfully');
        dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
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
        <div className="p-6 h-full flex flex-col bg-gray-50">
            {showCreateWizard ? (
                // --- CREATE BUCKET WIZARD ---
                <div className="max-w-4xl mx-auto w-full pb-20">
                    <h1 className="text-2xl font-bold mb-6">Create bucket</h1>

                    <div className="space-y-6">
                        {/* Name & Region */}
                        <div className="bg-white p-6 shadow rounded border border-gray-200">
                            <h2 className="text-lg font-bold mb-4">General configuration</h2>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-1">Bucket name</label>
                                <input
                                    className={`aws-input ${createState.name.length > 0 && !createState.name.match(/^[a-z0-9.-]+$/) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                                    placeholder="my-aws-bucket"
                                    value={createState.name}
                                    onChange={e => setCreateState({ ...createState, name: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Bucket name must be unique and must not contain spaces or uppercase letters.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">AWS Region</label>
                                <select
                                    className="aws-input bg-gray-100 text-gray-600 cursor-not-allowed"
                                    value={createState.region}
                                    disabled
                                >
                                    <option value="us-east-1">US East (N. Virginia) us-east-1</option>
                                </select>
                            </div>
                        </div>

                        {/* Object Ownership */}
                        <div className="bg-white p-6 shadow rounded border border-gray-200">
                            <h2 className="text-lg font-bold mb-4">Object Ownership</h2>
                            <div className="text-sm text-gray-600 mb-4">Control ownership of objects written to this bucket from other AWS accounts and the use of access control lists (ACLs).</div>

                            <div className="space-y-3">
                                <label className={`flex p-4 border rounded cursor-pointer ${!createState.aclEnabled ? 'border-aws-blue bg-blue-50 ring-1 ring-aws-blue' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name="ownership"
                                        checked={!createState.aclEnabled}
                                        onChange={() => setCreateState({ ...createState, aclEnabled: false })}
                                        className="mt-1 mr-3 text-aws-blue"
                                    />
                                    <div>
                                        <div className="font-bold text-sm">ACLs disabled (recommended)</div>
                                        <div className="text-xs text-gray-500 mt-1">All objects in this bucket are owned by this account. Access to this bucket and its objects is specified using only policies.</div>
                                    </div>
                                </label>

                                <label className={`flex p-4 border rounded cursor-pointer ${createState.aclEnabled ? 'border-aws-blue bg-blue-50 ring-1 ring-aws-blue' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name="ownership"
                                        checked={createState.aclEnabled}
                                        onChange={() => setCreateState({ ...createState, aclEnabled: true })}
                                        className="mt-1 mr-3 text-aws-blue"
                                    />
                                    <div>
                                        <div className="font-bold text-sm">ACLs enabled</div>
                                        <div className="text-xs text-gray-500 mt-1">Objects in this bucket can be owned by other AWS accounts. Access to this bucket and its objects can be specified using ACLs.</div>
                                    </div>
                                </label>
                            </div>

                            {createState.aclEnabled && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-start">
                                    <div className="mr-2 mt-0.5">⚠️</div>
                                    <div>Starting in April 2023, Amazon S3 will change the default settings for S3 Block Public Access and Object Ownership for new buckets. We recommend keeping ACLs disabled.</div>
                                </div>
                            )}
                        </div>

                        {/* Block Public Access */}
                        <div className="bg-white p-6 shadow rounded border border-gray-200">
                            <h2 className="text-lg font-bold mb-4">Block Public Access settings for this bucket</h2>

                            <div className="border p-4 rounded mb-4">
                                <label className="flex items-start">
                                    <input
                                        type="checkbox"
                                        className="mt-1 mr-3 text-aws-blue rounded"
                                        checked={createState.blockPublicAccess}
                                        onChange={e => setCreateState({ ...createState, blockPublicAccess: e.target.checked })}
                                    />
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Block all public access</div>
                                        <div className="text-xs text-gray-500 mt-1">Turning this setting on is the same as turning on all four settings below. Each of the following settings are independent of one another.</div>
                                    </div>
                                </label>
                            </div>

                            {!createState.blockPublicAccess && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800 flex items-start">
                                    <div className="mr-2 mt-0.5">⚠️</div>
                                    <div>
                                        <strong>Turning off block all public access might result in this bucket and the objects within becoming public.</strong>
                                        <br />AWS recommends that you turn on Block all public access, unless you require public access for a specific use case, such as hosting a static website.
                                        <div className="mt-2">
                                            <label className="flex items-center text-xs font-bold text-gray-900">
                                                <input type="checkbox" className="mr-2" />
                                                I acknowledge that the current settings might result in this bucket and the objects within becoming public.
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bucket Versioning */}
                        <div className="bg-white p-6 shadow rounded border border-gray-200">
                            <h2 className="text-lg font-bold mb-4">Bucket Versioning</h2>
                            <div className="text-sm text-gray-600 mb-4">Versioning is a means of keeping multiple variants of an object in the same bucket. You can use versioning to preserve, retrieve, and restore every version of every object stored in your Amazon S3 bucket.</div>

                            <div className="flex space-x-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="versioning"
                                        className="mr-2 text-aws-blue"
                                        checked={!createState.versioning}
                                        onChange={() => setCreateState({ ...createState, versioning: false })}
                                    />
                                    <span className="text-sm">Disable</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="versioning"
                                        className="mr-2 text-aws-blue"
                                        checked={createState.versioning}
                                        onChange={() => setCreateState({ ...createState, versioning: true })}
                                    />
                                    <span className="text-sm">Enable</span>
                                </label>
                            </div>
                        </div>

                        {/* Encryption */}
                        <div className="bg-white p-6 shadow rounded border border-gray-200">
                            <h2 className="text-lg font-bold mb-4">Default encryption</h2>
                            <div className="text-sm text-gray-600 mb-4">Server-side encryption is automatically applied to new objects stored in this bucket.</div>

                            <div className="space-y-4">
                                <div className="text-sm font-bold">Encryption type</div>
                                <div className="flex space-x-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="encryption"
                                            className="mr-2 text-aws-blue"
                                            checked={createState.encryption === 'SSE-S3'}
                                            onChange={() => setCreateState({ ...createState, encryption: 'SSE-S3' })}
                                        />
                                        <span className="text-sm">Amazon S3 managed keys (SSE-S3)</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="encryption"
                                            className="mr-2 text-aws-blue"
                                            checked={createState.encryption === 'SSE-KMS'}
                                            onChange={() => setCreateState({ ...createState, encryption: 'SSE-KMS' })}
                                        />
                                        <span className="text-sm">AWS Key Management Service key (SSE-KMS)</span>
                                    </label>
                                </div>

                                {createState.encryption === 'SSE-KMS' && (
                                    <div className="mt-2">
                                        <label className="block text-sm font-bold mb-1">AWS KMS key</label>
                                        <select className="aws-input" onChange={e => setCreateState({ ...createState, kmsKey: e.target.value })}>
                                            <option value="">Choose from your AWS KMS keys</option>
                                            <option value="arn:aws:kms:us-east-1:123456789012:key/mrk-123">aws/s3 (default)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 right-0 left-0 bg-white p-4 border-t flex justify-end space-x-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <button className="aws-btn-secondary" onClick={() => setShowCreateWizard(false)}>Cancel</button>
                        <button className="aws-btn-primary" onClick={handleCreateBucket}>Create bucket</button>
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="text-2xl font-bold mb-4 flex items-center text-aws-blue">
                        <Database className="mr-3" /> Amazon S3
                    </h1>

                    {!viewBucket ? (
                        // --- BUCKET LIST VIEW ---
                        <div className="bg-white shadow rounded p-6 border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <div className="relative w-64">
                                    
                                    <Search
                                        size={14}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        className="aws-input pl-10"
                                        placeholder=" Find buckets by name"
                                    />
                                </div>F
                                <button className="aws-btn-primary" onClick={() => setShowCreateWizard(true)}>Create bucket</button>
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
                                                        {b.state.bucketName}
                                                    </td>
                                                    <td className="p-3">{b.state.region}</td>
                                                    <td className="p-3">
                                                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded border border-gray-300 font-medium">Bucket and objects not public</span>
                                                    </td>
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
                            <div className="p-6 border-b">
                                <div className="flex items-center text-sm mb-4">
                                    <span className="text-aws-blue hover:underline cursor-pointer" onClick={() => setViewBucket(null)}>Buckets</span>
                                    <span className="mx-2 text-gray-400">/</span>
                                    <span className="font-bold text-gray-900">{viewBucket.state.bucketName}</span>
                                </div>
                                <h1 className="text-2xl font-bold mb-6 flex items-center">
                                    <Database size={24} className="mr-3 text-aws-orange" />
                                    {viewBucket.state.bucketName}
                                </h1>

                                <div className="flex space-x-8 border-b border-gray-200">
                                    {['Objects', 'Properties', 'Permissions', 'Metrics', 'Management'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-aws-orange text-aws-blue' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto">
                                {activeTab === 'Objects' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex space-x-2">
                                                <div className="relative">
                                                    <input className="aws-input w-64 pl-8" placeholder="Find objects by prefix" />
                                                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button className="aws-btn-secondary">Copy S3 URI</button>
                                                <button className="aws-btn-secondary">Download</button>
                                                <button className="aws-btn-orange flex items-center" onClick={() => setShowUploadModal(true)}>
                                                    <Upload size={14} className="mr-1" /> Upload
                                                </button>
                                                <button className="aws-btn-secondary">Create folder</button>
                                            </div>
                                        </div>

                                        <table className="w-full text-left text-sm border border-gray-200">
                                            <thead className="bg-gray-100 border-b">
                                                <tr>
                                                    <th className="p-3 w-4"><input type="checkbox" /></th>
                                                    <th className="p-3">Name</th>
                                                    <th className="p-3">Type</th>
                                                    <th className="p-3">Last modified</th>
                                                    <th className="p-3">Size</th>
                                                    <th className="p-3">Storage class</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(viewBucket.state.objects || []).map((obj, i) => (
                                                    <tr key={i} className="border-b hover:bg-gray-50">
                                                        <td className="p-3"><input type="checkbox" /></td>
                                                        <td className="p-3 text-aws-blue font-bold flex items-center cursor-pointer hover:underline" onClick={() => setViewObject(obj)}>
                                                            <File size={14} className="mr-2 text-gray-400" /> {obj.key}
                                                        </td>
                                                        <td className="p-3">{obj.key.endsWith('/') ? 'Folder' : 'Standard'}</td>
                                                        <td className="p-3">{new Date(obj.lastModified).toLocaleString()}</td>
                                                        <td className="p-3">{obj.size}</td>
                                                        <td className="p-3">Standard</td>
                                                    </tr>
                                                ))}
                                                {(!viewBucket.state.objects || viewBucket.state.objects.length === 0) && (
                                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No objects in this bucket.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'Properties' && (
                                    <div className="space-y-6 max-w-4xl">
                                        <div className="border border-gray-200 rounded p-6">
                                            <h3 className="font-bold text-lg mb-4">Bucket Versioning</h3>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-gray-600 text-sm mb-2">Versioning is a means of keeping multiple variants of an object in the same bucket.</div>
                                                    <div className="font-bold text-sm">Bucket Versioning: <span className={viewBucket.state.versioning === 'Enabled' ? 'text-green-600' : 'text-gray-600'}>{viewBucket.state.versioning || 'Suspended'}</span></div>
                                                </div>
                                                <button className="aws-btn-secondary" onClick={toggleVersioning}>Edit</button>
                                            </div>
                                        </div>
                                        <div className="border border-gray-200 rounded p-6">
                                            <h3 className="font-bold text-lg mb-4">Tags</h3>
                                            <div className="text-sm text-gray-500 italic">No tags associated with this bucket.</div>
                                        </div>
                                        <div className="border border-gray-200 rounded p-6">
                                            <h3 className="font-bold text-lg mb-4">Default encryption</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><div className="text-gray-500">Encryption type</div><div>Server-side encryption with Amazon S3 managed keys (SSE-S3)</div></div>
                                                <div><div className="text-gray-500">Bucket Key</div><div>Enable</div></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Permissions' && (
                                    <div className="space-y-6 max-w-4xl">
                                        <div className="border border-gray-200 rounded p-6">
                                            <h3 className="font-bold text-lg mb-4">Block public access (bucket settings)</h3>
                                            <div className="mb-4">
                                                <div className="text-sm">Block all public access: <span className="font-bold text-green-600">On</span></div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 pl-4 border-l-4 border-green-500 bg-green-50 p-2">
                                                <div>Block public access to buckets and objects granted through new access control lists (ACLs): On</div>
                                                <div>Block public access to buckets and objects granted through any access control lists (ACLs): On</div>
                                                <div>Block public access to buckets and objects granted through new public bucket or access point policies: On</div>
                                                <div>Block public and cross-account access to buckets and objects through any public bucket or access point policies: On</div>
                                            </div>
                                        </div>
                                        <div className="border border-gray-200 rounded p-6">
                                            <h3 className="font-bold text-lg mb-4">Bucket policy</h3>
                                            <div className="bg-gray-50 border p-4 rounded text-xs font-mono text-gray-500 italic">
                                                No bucket policy exists.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Metrics' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="border rounded h-64 flex items-center justify-center bg-gray-50 text-gray-400">Total bucket size (Graph)</div>
                                        <div className="border rounded h-64 flex items-center justify-center bg-gray-50 text-gray-400">Number of objects (Graph)</div>
                                    </div>
                                )}

                                {activeTab === 'Management' && (
                                    <div className="space-y-6">
                                        <div className="border border-gray-200 rounded p-6">
                                            <h3 className="font-bold text-lg mb-2">Lifecycle rules</h3>
                                            <p className="text-sm text-gray-600 mb-4">Create lifecycle rules to manage your objects, including transitioning objects to another storage class, archiving them, or deleting them after a specified period of time.</p>
                                            <button className="aws-btn-secondary">Create lifecycle rule</button>
                                        </div>
                                        <div className="border border-gray-200 rounded p-6">
                                            <h3 className="font-bold text-lg mb-2">Replication rules</h3>
                                            <p className="text-sm text-gray-600 mb-4">Replication enables automatic, asynchronous copying of objects across Amazon S3 buckets.</p>
                                            <button className="aws-btn-secondary">Create replication rule</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Create Wizard is inline now */}

                    {/* Upload Modal Wizard */}
                    {showUploadModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUploadModal(false)}>
                            <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-bold">Upload</h2>
                                    <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-black">✕</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    {/* Steps Indicator */}
                                    <div className="flex mb-8 border-b pb-4">
                                        {['Select files', 'Set permissions', 'Set properties', 'Review'].map((step, i) => (
                                            <div key={i} className={`mr-8 text-sm font-bold pb-2 border-b-2 ${uploadStep === i + 1 ? 'border-aws-blue text-aws-blue' : 'border-transparent text-gray-500'}`}>
                                                {step}
                                            </div>
                                        ))}
                                    </div>

                                    {uploadStep === 1 && (
                                        <div>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
                                                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                                                <h3 className="text-lg font-bold mb-2">Drag and drop files and folders here</h3>
                                                <p className="text-gray-500 text-sm mb-6">Or choose a button below.</p>
                                                <div className="flex justify-center space-x-4">
                                                    <label className="aws-btn-secondary cursor-pointer">
                                                        Add files
                                                        <input type="file" multiple className="hidden" onChange={(e) => setFilesToUpload([...filesToUpload, ...Array.from(e.target.files)])} />
                                                    </label>
                                                    <button className="aws-btn-secondary">Add folder</button>
                                                </div>
                                            </div>

                                            {filesToUpload.length > 0 && (
                                                <div className="mt-6">
                                                    <h4 className="font-bold mb-2">Files to upload ({filesToUpload.length})</h4>
                                                    <ul className="border rounded bg-gray-50 divide-y">
                                                        {filesToUpload.map((f, i) => (
                                                            <li key={i} className="p-3 flex justify-between items-center">
                                                                <span className="text-sm font-mono">{f.name}</span>
                                                                <span className="text-xs text-gray-500">{(f.size / 1024).toFixed(2)} KB</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {uploadStep === 2 && (
                                        <div>
                                            <h3 className="font-bold text-lg mb-4">Permissions</h3>
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-900 mb-4">
                                                Bucket settings for Block Public Access are currently turned on.
                                            </div>
                                            <div className="border p-4 rounded">
                                                <h4 className="font-bold text-sm mb-2">Predefined ACLs</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center">
                                                        <input type="radio" name="acl" defaultChecked className="mr-2 text-aws-blue" /> Private
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input type="radio" name="acl" className="mr-2 text-aws-blue" /> Grant public-read access
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {uploadStep === 3 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="font-bold text-lg mb-4">Storage class</h3>
                                                <div className="border p-4 rounded">
                                                    <label className="flex items-start mb-2">
                                                        <input type="radio" name="storage" defaultChecked className="mt-1 mr-2 text-aws-blue" />
                                                        <div>
                                                            <div className="font-bold text-sm">Standard</div>
                                                            <div className="text-xs text-gray-500">Frequently accessed data (more than once a month) with millisecond access</div>
                                                        </div>
                                                    </label>
                                                    <label className="flex items-start">
                                                        <input type="radio" name="storage" className="mt-1 mr-2 text-aws-blue" />
                                                        <div>
                                                            <div className="font-bold text-sm">Intelligent-Tiering</div>
                                                            <div className="text-xs text-gray-500">Data with changing or unknown access patterns</div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {uploadStep === 4 && (
                                        <div>
                                            <h3 className="font-bold text-lg mb-4">Review</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="font-bold text-gray-600">Total size</div>
                                                <div>{filesToUpload.reduce((acc, f) => acc + f.size, 0) / 1024} KB</div>

                                                <div className="font-bold text-gray-600">Storage class</div>
                                                <div>Standard</div>

                                                <div className="font-bold text-gray-600">Server-side encryption</div>
                                                <div>Enable, with Amazon S3 managed keys</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                                    {uploadStep > 1 && (
                                        <button className="aws-btn-secondary" onClick={() => setUploadStep(uploadStep - 1)}>Previous</button>
                                    )}
                                    {uploadStep < 4 ? (
                                        <button className="aws-btn-primary" onClick={() => setUploadStep(uploadStep + 1)}>Next</button>
                                    ) : (
                                        <button className="aws-btn-orange" onClick={handleUploadSubmit}>Upload</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Object Detail View (Replaces Modal) */}
                    {viewObject && (
                        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto">
                            {/* Header */}
                            <div className="bg-aws-dark-blue text-white p-3 flex items-center shadow-md">
                                <ArrowLeft className="mr-3 cursor-pointer" onClick={() => setViewObject(null)} />
                                <span className="font-bold text-lg">{viewObject.key}</span>
                            </div>

                            <div className="p-6 bg-gray-50 flex-1">
                                <div className="bg-white shadow rounded h-full flex flex-col border border-gray-200">
                                    <div className="p-6 border-b">
                                        <div className="flex items-center text-sm mb-4">
                                            <span className="text-aws-blue hover:underline cursor-pointer" onClick={() => setViewBucket(null)}>Buckets</span>
                                            <span className="mx-2 text-gray-400">/</span>
                                            <span className="text-aws-blue hover:underline cursor-pointer" onClick={() => setViewObject(null)}>{viewBucket.state.bucketName}</span>
                                            <span className="mx-2 text-gray-400">/</span>
                                            <span className="font-bold text-gray-900">{viewObject.key}</span>
                                        </div>
                                        <h1 className="text-2xl font-bold mb-6 flex items-center">
                                            <File size={24} className="mr-3 text-gray-500" />
                                            {viewObject.key}
                                        </h1>

                                        <div className="flex space-x-4 mb-4">
                                            <button className="aws-btn-secondary">Open</button>
                                            <button className="aws-btn-secondary">Download</button>
                                            <button className="aws-btn-secondary">Copy S3 URI</button>
                                            <button className="aws-btn-secondary">Copy URL</button>
                                        </div>

                                        <div className="flex space-x-8 border-b border-gray-200">
                                            {['Overview', 'Properties', 'Permissions', 'Versions'].map(tab => (
                                                <button
                                                    key={tab}
                                                    // For this mock, we aren't implementing tab switching logic for object view, just showing the layout
                                                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === 'Overview' ? 'border-aws-orange text-aws-blue' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="font-bold text-lg mb-4">Overview</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                                            <div className="border p-4 rounded bg-gray-50">
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-2">Owner</div>
                                                <div>{userId}</div>
                                            </div>
                                            <div className="border p-4 rounded bg-gray-50">
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-2">Last modified</div>
                                                <div>{new Date(viewObject.lastModified).toString()}</div>
                                            </div>
                                            <div className="border p-4 rounded bg-gray-50">
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-2">Size</div>
                                                <div>{viewObject.size}</div>
                                            </div>
                                            <div className="border p-4 rounded bg-gray-50">
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-2">Key</div>
                                                <div>{viewObject.key}</div>
                                            </div>
                                        </div>
                                    </div>
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
                </>
            )}
        </div>
    );
};

export default FakeS3Console;
