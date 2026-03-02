import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProjectLink, setRepoInfo, setPreLabPhase } from '../../store/simulationSlice';
import axios from 'axios';
import { Github, Link, AlertCircle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ProjectIngestion = () => {
    const dispatch = useDispatch();
    const { projectLink, repoInfo } = useSelector(state => state.simulation);
    const [url, setUrl] = useState(projectLink || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateRepo = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/github/validate', 
                { repoUrl: url },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                dispatch(setProjectLink(url));
                dispatch(setRepoInfo(response.data.repoInfo));
                toast.success('Repository validated successfully!');
            } else {
                setError(response.data.message);
                toast.error(response.data.message);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to validate repository. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (repoInfo) {
            dispatch(setPreLabPhase('jenkins'));
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-aws-blue p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Github size={120} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center">
                        <Link className="mr-3" /> Link Project Source
                    </h2>
                    <p className="text-blue-100 italic">"First, let's connect the application you want to deploy."</p>
                </div>

                <div className="p-10">
                    <form onSubmit={validateRepo} className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">GitHub Repository URL</label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                                    <Github size={18} />
                                </span>
                                <input 
                                    type="text" 
                                    className={`w-full pl-11 pr-4 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none transition-all ${error ? 'border-red-200' : 'border-gray-100 focus:border-aws-blue'}`}
                                    placeholder="https://github.com/username/project"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loading || !url}
                                className="bg-aws-blue hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Validate'}
                            </button>
                        </div>
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}
                    </form>

                    {repoInfo && (
                        <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-8 animate-in zoom-in-95 duration-300">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-green-200">
                                    <CheckCircle className="text-green-500" size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{repoInfo.fullName}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{repoInfo.description || 'No description provided'}</p>
                                    <div className="flex gap-4">
                                        <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-700 border border-gray-200">
                                            {repoInfo.language || 'Unknown'}
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-700 border border-gray-200">
                                            ★ {repoInfo.stars} Stars
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-green-100 flex justify-end">
                                <button 
                                    onClick={handleContinue}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2 group shadow-lg shadow-green-200"
                                >
                                    Proceed to Jenkins Pipeline <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {!repoInfo && !loading && (
                        <div className="text-center p-12 border-2 border-dashed border-gray-100 rounded-2xl">
                            <div className="text-gray-400 mb-2 font-medium">No repository linked yet</div>
                            <p className="text-gray-400 text-xs">Enter a valid public GitHub URL to continue</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={() => dispatch(setPreLabPhase('role'))}
                    className="text-gray-500 hover:text-aws-blue font-bold text-sm transition-colors"
                >
                    ← Change Role
                </button>
            </div>
        </div>
    );
};

export default ProjectIngestion;
