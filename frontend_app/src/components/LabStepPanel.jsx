import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle, AlertCircle, PlayCircle, Info } from 'lucide-react';
import { submitLab, setCurrentStep } from '../store/simulationSlice';
import ConfirmationModal from './ConfirmationModal';

const LabStepPanel = ({ lab, currentStepId }) => {
  const { completedSteps, validationStatus, lastMessage, isSubmitted, lastValidatedStepId, submissionStatus } = useSelector((state) => state.simulation);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const userId = user?.id;
  
  // Find current step index
  const currentStepIndex = lab.steps.findIndex(s => s.stepId === currentStepId);
  const currentStep = lab.steps[currentStepIndex];

  // Auto-advance logic
  useEffect(() => {
    // If no current step, or current step is completed, advance to next incomplete
    if (!currentStepId || completedSteps.includes(currentStepId)) {
        const nextStep = lab.steps.find(s => !completedSteps.includes(s.stepId));
        if (nextStep && nextStep.stepId !== currentStepId) {
            dispatch(setCurrentStep(nextStep.stepId));
        }
    }
  }, [completedSteps, currentStepId, lab.steps, dispatch]);

  const handleSubmitClick = () => {
      setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
      if (!userId) {
        console.error('User not authenticated');
        return;
      }
      setShowSubmitConfirm(false);
      dispatch(submitLab({ userId, labId: lab.labId })); 
  };

  return (
    <div className="w-[300px] bg-white border-r border-gray-300 shadow-lg flex flex-col h-full z-10 transition-all duration-300">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Lab Questions</h2>
            <div className="mt-1 text-xs text-gray-500">{lab.title}</div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                    className="bg-aws-orange h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${((completedSteps.length) / lab.steps.length) * 100}%` }}
                ></div>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">{completedSteps.length} / {lab.steps.length} completed</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Scenario Context */}
            <div className="bg-blue-50 border border-blue-100 rounded p-4 shadow-sm">
                <h3 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center">
                    <span className="mr-2">📋</span> Scenario
                </h3>
                <p className="text-sm text-blue-900 leading-relaxed italic">
                    {lab.description}
                </p>
            </div>

            {lab.steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.stepId);
                const isCurrent = step.stepId === currentStepId;
                const isLocked = !isCompleted && !isCurrent;

                return (
                    <div key={step.stepId} className={`relative pl-4 border-l-2 transition-colors ${isCurrent ? 'border-aws-orange' : isCompleted ? 'border-green-500' : 'border-gray-200'}`}>
                        <div className="absolute -left-[9px] top-0 bg-white">
                             {isCompleted ? (
                                 <CheckCircle size={16} className="text-green-500 fill-green-50" />
                             ) : isCurrent ? (
                                 <PlayCircle size={16} className="text-aws-orange fill-orange-50 animate-pulse" />
                             ) : (
                                 <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />
                             )}
                        </div>
                        
                        <div className="flex justify-between items-start">
                             <h3 className={`text-sm font-bold ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                                 {index + 1}. {step.title}
                             </h3>
                             
                             {/* Info Tooltip */}
                             <div className="group relative ml-2">
                                 <Info size={14} className="text-gray-400 hover:text-aws-blue cursor-help" />
                                 <div className="absolute right-full top-0 mr-2 w-56 p-3 bg-black text-white text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                                     <div className="font-bold mb-1 border-b border-gray-600 pb-1">Configuration Info</div>
                                     {step.description || step.instruction || "Follow the instructions to complete this step."}
                                     <div className="absolute right-[-4px] top-3 w-2 h-2 bg-black transform rotate-45"></div>
                                 </div>
                             </div>
                        </div>
                        
                        <div className={`mt-2 text-sm leading-relaxed ${isLocked ? 'text-gray-300' : 'text-gray-600'}`}>
                            {step.instruction}
                        </div>

                        {isCurrent && validationStatus === 'error' && (lastValidatedStepId === step.stepId || !lastValidatedStepId) && (
                            <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200 flex items-start">
                                <AlertCircle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                                <span>{lastMessage}</span>
                            </div>
                        )}
                         {isCurrent && validationStatus === 'success' && (lastValidatedStepId === step.stepId) && (
                            <div className="mt-2 text-xs bg-green-50 text-green-700 p-2 rounded border border-green-200 flex items-start animate-fade-in-up">
                                <CheckCircle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                                <span>{lastMessage}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Submit Area */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button 
                onClick={handleSubmitClick}
                disabled={isSubmitted || submissionStatus === 'submitting'}
                className={`w-full py-2 font-bold rounded shadow transition-colors ${
                  isSubmitted || submissionStatus === 'submitting'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-aws-orange text-white hover:bg-orange-600'
                }`}
            >
                {submissionStatus === 'submitting' ? 'Submitting...' : isSubmitted ? 'Submitted' : 'Submit Lab'}
            </button>
        </div>

        <ConfirmationModal
            isOpen={showSubmitConfirm}
            title="Submit Lab?"
            message="Are you sure you want to submit? This will end your session and generate your learning feedback."
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowSubmitConfirm(false)}
            confirmText="Submit & Finish"
        />
    </div>
  );
};

export default LabStepPanel;
