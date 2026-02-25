import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLabById } from '../store/labSlice';
import { setCurrentStep, startLab, fetchResources, loadUserProgress } from '../store/simulationSlice';
import { USER_ID } from '../constants/user';
import FakeEC2Console from './FakeEC2Console';
import FakeS3Console from './FakeS3Console';
import FakeIAMConsole from './FakeIAMConsole';
import LabSubmissionResult from './LabSubmissionResult';

const LabRunner = () => {
  const { labId } = useParams();
  const dispatch = useDispatch();
  const { activeLab, loading, error } = useSelector((state) => state.lab);
  const { isSubmitted, submissionResult, completedSteps, userProgress } = useSelector(state => state.simulation);
  const { user } = useSelector(state => state.auth);
  const userId = user?.id;
  const [hasCheckedProgress, setHasCheckedProgress] = useState(false);

  useEffect(() => {
    if (labId && userId) {
      if (!userId) {
        console.warn('No user ID available');
        return;
      }

      // First, check if user has existing progress for this lab
      if (!hasCheckedProgress) {
        console.log('Checking for existing progress for lab:', labId);
        dispatch(loadUserProgress({ userId, labId })).then((result) => {
          setHasCheckedProgress(true);
          
          const progress = result.payload?.progress;
          const resourcesCount = result.payload?.resourcesCount || 0;
          
          // Check if there's existing progress (either progress record or resources)
          const hasExistingProgress = progress && (
            (progress.completedSteps && progress.completedSteps.length > 0) ||
            progress.currentStep ||
            resourcesCount > 0
          );
          
          if (hasExistingProgress) {
            console.log('✅ Found existing progress, resuming session');
            console.log('Progress:', progress);
            console.log('Resources count:', resourcesCount);
            // Load the lab data
            dispatch(fetchLabById(labId));
            // Resources are already loaded by loadUserProgress
            // Just fetch any missing resource types to ensure sync
            const resourceTypes = ['VPC', 'SUBNET', 'SECURITY_GROUP', 'EC2_INSTANCE', 'S3_BUCKET', 'IAM_USER', 'IAM_ROLE', 'IAM_POLICY', 'IAM_GROUP', 'EBS_VOLUME', 'SECRETS_MANAGER_SECRET', 'CLOUDWATCH_LOG_GROUP'];
            resourceTypes.forEach(type => {
              dispatch(fetchResources({ userId, type, labId }));
            });
          } else {
            console.log('No existing progress, starting new lab');
            // Start new lab session
            dispatch(fetchLabById(labId));
            dispatch(startLab({ userId, labId })).then(() => {
              const resourceTypes = ['VPC', 'SUBNET', 'SECURITY_GROUP', 'EC2_INSTANCE', 'S3_BUCKET', 'IAM_USER', 'IAM_ROLE', 'IAM_POLICY', 'IAM_GROUP', 'EBS_VOLUME', 'SECRETS_MANAGER_SECRET', 'CLOUDWATCH_LOG_GROUP'];
              resourceTypes.forEach(type => {
                dispatch(fetchResources({ userId, type, labId }));
              });
            });
          }
        }).catch((error) => {
          console.error('Error loading progress:', error);
          setHasCheckedProgress(true);
          // On error, start new lab
          dispatch(fetchLabById(labId));
          dispatch(startLab({ userId, labId })).then(() => {
            const resourceTypes = ['VPC', 'SUBNET', 'SECURITY_GROUP', 'EC2_INSTANCE', 'S3_BUCKET', 'IAM_USER', 'IAM_ROLE', 'IAM_POLICY', 'IAM_GROUP', 'EBS_VOLUME', 'SECRETS_MANAGER_SECRET', 'CLOUDWATCH_LOG_GROUP'];
            resourceTypes.forEach(type => {
              dispatch(fetchResources({ userId, type, labId }));
            });
          });
        });
      } else {
        // Logic: If activeLab matches current URL, assume "Resume Session" and SKIP Reset.
        if (activeLab && activeLab.labId === labId) {
          console.log('Resuming existing session for:', labId);
          // Just refresh resources to sync with Backend
          const resourceTypes = ['VPC', 'SUBNET', 'SECURITY_GROUP', 'EC2_INSTANCE', 'S3_BUCKET', 'IAM_USER', 'IAM_ROLE', 'IAM_POLICY', 'IAM_GROUP', 'EBS_VOLUME', 'SECRETS_MANAGER_SECRET', 'CLOUDWATCH_LOG_GROUP'];
          resourceTypes.forEach(type => {
            dispatch(fetchResources({ userId, type, labId }));
          });
        }
      }
    }
  }, [labId, dispatch, activeLab, userId, hasCheckedProgress]);

  useEffect(() => {
    if (activeLab && activeLab.steps && activeLab.steps.length > 0) {
        // Initialize simulation state - jump to first incomplete step
        const firstIncomplete = activeLab.steps.find(s => !completedSteps.includes(s.stepId));
        if (firstIncomplete) {
            dispatch(setCurrentStep(firstIncomplete.stepId));
        } else if (activeLab.steps.length > 0) {
             dispatch(setCurrentStep(activeLab.steps[0].stepId));
        }
    }
  }, [activeLab, dispatch, completedSteps]);

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
            onRetry={async () => {
                // Reset progress and start lab fresh
                dispatch(resetSimulation());
                setHasCheckedProgress(false); // Allow progress check again
                // Start lab fresh - this will delete resources for this lab and reset progress
                await dispatch(startLab({ userId, labId }));
                // Fetch fresh resources
                const resourceTypes = ['VPC', 'SUBNET', 'SECURITY_GROUP', 'EC2_INSTANCE', 'S3_BUCKET', 'IAM_USER', 'IAM_ROLE', 'IAM_POLICY', 'IAM_GROUP', 'EBS_VOLUME', 'SECRETS_MANAGER_SECRET', 'CLOUDWATCH_LOG_GROUP'];
                resourceTypes.forEach(type => {
                  dispatch(fetchResources({ userId, type, labId }));
                });
                // Reset to first step
                if (activeLab?.steps?.[0]) {
                  dispatch(setCurrentStep(activeLab.steps[0].stepId));
                }
            }}
          />
      ) : (
          renderService()
      )}
    </div>
  );
};

export default LabRunner;
