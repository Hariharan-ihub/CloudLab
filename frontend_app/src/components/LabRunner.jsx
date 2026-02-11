import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLabById } from '../store/labSlice';
import { setCurrentStep, startLab, fetchResources } from '../store/simulationSlice';
import DefaultLabStepPanel from './LabStepPanel';
import FakeEC2Console from './FakeEC2Console';
import FakeS3Console from './FakeS3Console';
import FakeIAMConsole from './FakeIAMConsole';
import LabSubmissionResult from './LabSubmissionResult';

const LabRunner = () => {
  const { labId } = useParams();
  const dispatch = useDispatch();
  const { activeLab, loading, error } = useSelector((state) => state.lab);
  const { currentStepId, isSubmitted, submissionResult } = useSelector(state => state.simulation);
  
  const userId = 'user-123'; // Hardcoded for now

  useEffect(() => {
    if (labId) {
      // Logic: If activeLab matches current URL, assume "Resume Session" and SKIP Reset.
      if (activeLab && activeLab.labId === labId) {
           console.log('Resuming existing session for:', labId);
           // Just refresh resources to sync with Backend
           dispatch(fetchResources({ userId: 'user-123', type: 'VPC' }));
           dispatch(fetchResources({ userId: 'user-123', type: 'SUBNET' }));
           dispatch(fetchResources({ userId: 'user-123', type: 'SECURITY_GROUP' }));
           dispatch(fetchResources({ userId: 'user-123', type: 'EC2_INSTANCE' }));
      } else {
           console.log('Starting new session for:', labId);
           dispatch(fetchLabById(labId));
           // Start Simulation Environment (Reset & Seed)
           dispatch(startLab({ userId: 'user-123', labId })).then(() => {
                // Fetch resources immediately after seeding
                dispatch(fetchResources({ userId: 'user-123', type: 'VPC' }));
                dispatch(fetchResources({ userId: 'user-123', type: 'SUBNET' }));
                dispatch(fetchResources({ userId: 'user-123', type: 'SECURITY_GROUP' }));
                dispatch(fetchResources({ userId: 'user-123', type: 'EC2_INSTANCE' }));
           });
      }
    }
  }, [labId, dispatch]); // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeLab && activeLab.steps && activeLab.steps.length > 0) {
        // Initialize simulation state if not set
        // Logic to jump to first incomplete step
        // Note: completedSteps is not defined in the provided context, assuming it's meant to be part of simulation state
        const completedSteps = []; // Placeholder for now
        const firstIncomplete = activeLab.steps.find(s => !completedSteps.includes(s.stepId));
        if (firstIncomplete) {
            dispatch(setCurrentStep(firstIncomplete.stepId));
        } else if (activeLab.steps.length > 0) {
             dispatch(setCurrentStep(activeLab.steps[0].stepId));
        }
    }
  }, [activeLab, dispatch]); // Removed completedSteps from dependency array as it's a placeholder

  if (loading) return <div>Loading Lab...</div>;
  if (error) return <div>Error loading lab: {error}</div>;
  if (!activeLab) return <div>Lab not found</div>;

  const renderService = () => {
      switch(activeLab.service) {
          case 'EC2':
              return <FakeEC2Console activeLab={activeLab} />;
          case 'S3':
              return <FakeS3Console activeLab={activeLab} />;
          case 'IAM':
              return <FakeIAMConsole activeLab={activeLab} />;
          default:
              return <div>Service Simulation Not Implemented</div>;
      }
  };

  return (
    <div className="h-full">
      {isSubmitted && submissionResult ? (
          <LabSubmissionResult 
            result={submissionResult} 
            onRetry={() => {
                // Determine first step to reset to
                const firstStep = activeLab.steps[0].stepId;
                dispatch(setCurrentStep(firstStep));
            }}
          />
      ) : (
          renderService()
      )}
    </div>
  );
};

export default LabRunner;
