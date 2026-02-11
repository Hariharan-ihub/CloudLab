import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle, XCircle, Play, X, Star, RefreshCw, ArrowLeft } from 'lucide-react';
import { resetSimulation } from '../store/simulationSlice';

const LabSubmissionResult = ({ result, onRetry }) => {
  const dispatch = useDispatch();
  const [activeVideo, setActiveVideo] = useState(null);

  // Helper to determine status based on score
  const getStatus = (score) => {
      if (score === 100) return { label: 'Excellent', color: 'text-green-600', iconColor: 'text-green-500' };
      if (score >= 70) return { label: 'Good', color: 'text-blue-600', iconColor: 'text-blue-500' };
      return { label: 'Needs Practice', color: 'text-orange-600', iconColor: 'text-orange-500' };
  };

  const status = getStatus(result.score);

  return (
    <div className="max-w-5xl mx-auto p-4 animate-fade-in-up">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Practice Feedback & Learning Guidance</h1>
                <p className="text-sm text-gray-500 mt-1">This feedback helps personalize your learning path. You're not being graded.</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
                <X size={20} />
            </button>
        </div>

        <div className="p-8">
            
            {/* Status Section */}
            <div className="flex flex-col items-center justify-center mb-10">
                <div className={`w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-3 ${status.iconColor}`}>
                    <Star size={40} fill="currentColor" className="opacity-20" />
                    <Star size={40} className="absolute" />
                </div>
                <h2 className={`text-2xl font-bold ${status.color} mb-1`}>{status.label}</h2>
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">PRACTICE STATUS</span>
            </div>

            {/* Feedback Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
                {/* What's Working Well */}
                <div className="bg-green-50/50 rounded-lg p-6 border border-green-100">
                    <h3 className="flex items-center text-green-700 font-bold mb-4">
                        <CheckCircle className="mr-2" size={18} /> What's working well
                    </h3>
                    <ul className="space-y-3">
                        {result.feedback?.strengths?.map((str, i) => (
                            <li key={i} className="flex items-start text-sm text-gray-700">
                                <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{str}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-xs font-bold text-green-700 italic">Keep going — you're on the right track.</p>
                </div>

                {/* Suggested Improvements */}
                <div className="bg-orange-50/50 rounded-lg p-6 border border-orange-100">
                    <h3 className="flex items-center text-orange-700 font-bold mb-4">
                        <XCircle className="mr-2" size={18} /> Suggested Improvements
                    </h3>
                    <ul className="space-y-3">
                        {result.feedback?.improvements?.map((imp, i) => (
                            <li key={i} className="flex items-start text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                                <span>{imp}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Video Recommendations */}
            {result.youtubeResults?.length > 0 && (
                <div className="mb-8">
                     <h3 className="font-bold text-purple-700 mb-6 flex items-center text-lg">
                        <Play size={18} className="mr-2" /> Concepts to Strengthen
                    </h3>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        {result.youtubeResults.map((video, idx) => {
                            const themes = [
                                { bg: 'bg-blue-100', text: 'text-purple-600', badge: '10:24' },
                                { bg: 'bg-purple-100', text: 'text-purple-600', badge: '08:15' },
                                { bg: 'bg-green-100', text: 'text-purple-600', badge: '12:00' }
                            ];
                            const theme = themes[idx % themes.length];
                            
                            // Robust thumbnail generation
                            const thumbnailUrl = video.thumbnail || (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg` : null);

                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => {
                                        console.log('Clicked video:', video);
                                        if (video && video.videoId) {
                                            setActiveVideo(video);
                                        } else {
                                            console.error('Invalid video object:', video);
                                        }
                                    }}
                                    className="block bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group w-full"
                                >
                                    {/* Thumbnail Area - Pastel Fallback or Real Image */}
                                    <div className={`relative aspect-video ${theme.bg} group flex items-center justify-center`}>
                                        {thumbnailUrl ? (
                                            <>
                                                <img 
                                                    src={thumbnailUrl} 
                                                    alt={video.title} 
                                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                    onError={(e) => {
                                                        e.target.onerror = null; 
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                            </>
                                        ) : (
                                            // Fallback if absolutely no thumbnail possible
                                            <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center opacity-50">
                                                <Play className="text-white fill-white ml-1" />
                                            </div>
                                        )}
                                        
                                        {/* Center Play Button Overlay (always visible to match style) */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                             <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                                                <Play className="text-white fill-white ml-1" size={20} />
                                             </div>
                                        </div>

                                        {/* Duration Badge */}
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            {theme.badge}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className={`text-[10px] font-bold uppercase ${theme.text} mb-1`}>VIDEO LESSON</div>
                                        <h4 className="font-bold text-sm text-gray-800 leading-snug line-clamp-2 min-h-[40px]">
                                            {video.title}
                                        </h4>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-100 pt-6 flex justify-end space-x-4">
                <button 
                    onClick={() => {
                       dispatch(resetSimulation());
                        if(onRetry) onRetry();
                    }}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 transition-colors text-sm"
                >
                    <RefreshCw size={16} className="mr-2" />
                    Retry Lab
                </button>
                <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center px-6 py-2 bg-aws-orange text-white font-bold rounded hover:bg-orange-600 transition-colors text-sm"
                >
                    Return to Services
                    <ArrowLeft size={16} className="ml-2 rotate-180" />
                </button>
            </div>
        </div>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-80 animate-fade-in" onClick={() => setActiveVideo(null)}>
             <div className="relative bg-black w-full max-w-4xl aspect-video rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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

export default LabSubmissionResult;
