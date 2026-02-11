import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Trophy, ArrowLeft, RotateCcw, CheckCircle, AlertCircle, PlayCircle, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearActiveLab } from '../store/labSlice';
import { resetSimulation } from '../store/simulationSlice';

const LabResultPanel = () => {
  const { submissionResult, isSubmitted } = useSelector((state) => state.simulation);
  const { activeLab } = useSelector((state) => state.lab);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeVideo, setActiveVideo] = useState(null);

  // Get data from submission result (from database)
  // submissionResult is the submission object directly from Redux
  const score = submissionResult?.score || 0;
  const feedback = submissionResult?.feedback || { strengths: [], improvements: [] };
  const youtubeResults = submissionResult?.youtubeResults || [];

  // Helper to determine status
  const getStatus = (score) => {
      if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: Trophy };
      if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: Star };
      return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
  };

  const status = getStatus(score);
  const StatusIcon = status.icon;

  const handleClose = () => {
      dispatch(clearActiveLab());
      dispatch(resetSimulation());
      const params = new URLSearchParams(window.location.search);
      params.delete('labId');
      navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Practice Feedback & Learning Guidance</h1>
                    <p className="text-sm text-gray-500">This feedback helps personalize your learning path. You're not being graded.</p>
                </div>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-8 bg-gray-50">
                
                {/* Status Badge */}
                <div className="flex flex-col items-center mb-12">
                    <div className={`p-8 rounded-full mb-4 shadow-sm border-4 border-white ${status.bg}`}>
                        <StatusIcon size={48} className={status.color} />
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 ${status.color}`}>{status.label}</h2>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Practice Status</div>
                </div>

                {/* Feedback Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* What's Working Well */}
                    <div className="bg-green-50/50 border border-green-100 rounded-lg p-6">
                        <div className="flex items-center mb-4 text-green-700 font-bold text-lg">
                            <CheckCircle size={20} className="mr-2" /> What's working well
                        </div>
                        <ul className="space-y-3">
                            {feedback.strengths && feedback.strengths.length > 0 ? (
                                feedback.strengths.map((item, i) => (
                                    <li key={i} className="flex items-start text-gray-700 text-sm">
                                        <CheckCircle size={14} className="mr-2 mt-1 text-green-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500 text-sm italic">No specific strengths identified yet.</li>
                            )}
                        </ul>
                        <div className="mt-6 text-sm italic text-green-700 font-medium">Keep going — you're on the right track.</div>
                    </div>

                    {/* Suggested Improvements */}
                    <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-6">
                        <div className="flex items-center mb-4 text-aws-blue font-bold text-lg">
                            <AlertCircle size={20} className="mr-2 text-orange-500" /> <span className="text-red-500   px-1 rounded mx-1">Suggested Improvements</span>
                        </div>
                        <ul className="space-y-3">
                            {feedback.improvements && feedback.improvements.length > 0 ? (
                                feedback.improvements.map((item, i) => (
                                    <li key={i} className="flex items-start text-gray-700 text-sm">
                                        <div className="w-1.5 h-1.5 bg-aws-blue rounded-full mr-2.5 mt-2 flex-shrink-0"></div>
                                        <span>{item}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500 text-sm italic">Great job! No specific improvements needed.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Video Recommendations - Below Feedback Sections */}
                {youtubeResults && youtubeResults.length > 0 && (
                    <div className="mb-6 mt-8">
                        <div className="flex items-center mb-6 text-purple-700 font-bold text-lg border-b border-purple-100 pb-2">
                             <PlayCircle size={20} className="mr-2" /> Suggested Learning Videos
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {youtubeResults.map((video, i) => {
                                const thumbnailUrl = video.thumbnail || (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg` : null);
                                const themes = [
                                    { bg: 'bg-blue-100', text: 'text-purple-600' },
                                    { bg: 'bg-purple-100', text: 'text-purple-600' },
                                    { bg: 'bg-green-100', text: 'text-purple-600' },
                                    { bg: 'bg-orange-100', text: 'text-purple-600' }
                                ];
                                const theme = themes[i % themes.length];
                                
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (video.videoId) {
                                                setActiveVideo(video);
                                            }
                                        }}
                                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group text-left w-full"
                                    >
                                        <div className={`aspect-video relative ${!thumbnailUrl ? theme.bg : ''} flex items-center justify-center`}>
                                            {thumbnailUrl ? (
                                                <>
                                                    <img 
                                                        src={thumbnailUrl} 
                                                        alt={video.title} 
                                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                                </>
                                            ) : (
                                                <PlayCircle size={48} className="text-white opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                                                    <PlayCircle className="text-white fill-white" size={20} />
                                                </div>
                                            </div>
                                            {video.duration && (
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                    {video.duration}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="text-xs font-bold text-purple-600 mb-1 uppercase">Video Lesson</div>
                                            <h3 className="font-bold text-gray-800 text-sm group-hover:text-purple-700 transition-colors line-clamp-2">{video.title}</h3>
                                            {video.channelTitle && (
                                                <p className="text-xs text-gray-500 mt-1">{video.channelTitle}</p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t flex justify-end space-x-3">
                 <button 
                    onClick={() => {
                        dispatch(resetSimulation());
                        
                        // Map service to its home path to ensure we reset to the start
                        const serviceMap = {
                            'EC2': '/service/ec2',
                            'S3': '/service/s3',
                            'IAM': '/service/iam',
                            'VPC': '/service/vpc',
                            'EBS': '/service/ebs',
                            'SECURITY_GROUP': '/service/securitygroups',
                            'SECRETS_MANAGER': '/service/secretsmanager',
                            'CLOUDWATCH': '/service/cloudwatch'
                        };
                        const path = serviceMap[activeLab?.service] || '/';
                        navigate(`${path}?labId=${activeLab?.labId}`);
                    }} 
                    className="flex items-center px-6 py-2 bg-white text-gray-700 font-bold rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                 >
                    <RotateCcw size={16} className="mr-2" /> Retry Lab
                 </button>
                 <button 
                    onClick={handleClose}
                    className="flex items-center px-6 py-2 bg-aws-orange text-white font-bold rounded hover:bg-orange-600 transition-colors"
                >
                    Return to Services <ArrowLeft size={16} className="ml-2 rotate-180" /> 
                 </button>
            </div>
        </div>

        {/* Video Modal */}
        {activeVideo && (
            <div 
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-80 animate-fade-in" 
                onClick={() => setActiveVideo(null)}
            >
                <div 
                    className="relative bg-black w-full max-w-4xl aspect-video rounded-lg shadow-2xl overflow-hidden" 
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={() => setActiveVideo(null)}
                        className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-80 transition-colors z-10"
                    >
                        <X size={24} />
                    </button>
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                        title={activeVideo.title}
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        )}
    </div>
  );
};

export default LabResultPanel;
