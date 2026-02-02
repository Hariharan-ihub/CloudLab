import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, MoreHorizontal } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { validateStep, fetchResources } from '../../store/simulationSlice';

const CloudShellPanel = ({ onClose }) => {
    const dispatch = useDispatch();
    const { activeLab } = useSelector(state => state.lab);
    const { resources } = useSelector(state => state.simulation);
    const userId = 'user-123';

    const [history, setHistory] = useState([
        { text: 'AWS CloudShell [CloudShell-User]', type: 'system' },
        { text: 'Type "help" for a list of commands.', type: 'system' },
        { text: '', type: 'newline' }
    ]);
    const [input, setInput] = useState('');
    const [isMaximized, setIsMaximized] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);


    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Keep focus on input
    const focusInput = () => {
        if (inputRef.current) inputRef.current.focus();
    };

    const handleCommand = async (e) => {
        if (e.key === 'Enter') {
            const cmd = input.trim();
            const newHistory = [...history, { text: `[cloudshell-user@ip-10-0-1-5 ~]$ ${cmd}`, type: 'input' }];
            setInput(''); // Clear earlier to prevent double send

            if (cmd) {
                const parts = cmd.split(' ');
                const base = parts[0];
                
                let output = [];
                // Mock Commands
                if (base === 'clear') { setHistory([]); return; }
                else if (base === 'help') { 
                    output.push({ text: 'Available commands:', type: 'system' }); 
                    output.push({ text: '  aws ec2 describe-instances', type: 'output' });
                    output.push({ text: '  aws ec2 run-instances --image-id <ami> --instance-type <type>', type: 'output' });
                    output.push({ text: '  aws ec2 create-vpc --cidr-block <cidr>', type: 'output' });
                    output.push({ text: '  aws ec2 create-subnet --vpc-id <vpc> --cidr-block <cidr>', type: 'output' });
                    output.push({ text: '  aws ec2 create-security-group --group-name <name>', type: 'output' });
                    output.push({ text: '  aws ec2 create-volume --size <size> --availability-zone <az>', type: 'output' });
                    output.push({ text: '  aws s3 ls', type: 'output' });
                    output.push({ text: '  aws s3 mb s3://<bucket-name>', type: 'output' });
                    output.push({ text: '  aws iam list-users', type: 'output' });
                    output.push({ text: '  aws iam create-user --user-name <name>', type: 'output' });
                    output.push({ text: '  clear', type: 'output' });
                }
                else if (base === 'aws') {
                   // --- S3 COMMANDS ---
                   if (parts[1] === 's3') {
                        if (parts[2] === 'ls') {
                            // Dynamic Listing from Redux
                            const buckets = resources.s3 || [];
                            if (buckets.length === 0) {
                                output.push({ text: '(no buckets)', type: 'output' });
                            } else {
                                buckets.forEach(b => {
                                    let dateStr = "Unknown Date";
                                    try {
                                        const d = b.state.createdDate ? new Date(b.state.createdDate) : new Date();
                                        dateStr = d.toISOString().slice(0, 19).replace('T', ' ');
                                    } catch (e) { dateStr = new Date().toISOString().slice(0, 19).replace('T', ' '); }
                                    
                                    output.push({ 
                                        text: `${dateStr} ${b.state.bucketName}`, 
                                        type: 'output' 
                                    });
                                });
                            }
                        } else if (parts[2] === 'mb' && parts[3]) {
                             const bucketName = parts[3].replace('s3://', '');
                             output.push({ text: `make_bucket: ${bucketName}`, type: 'system' });
                             
                             try {
                                const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'S3_BUCKET');
                                
                                const result = await dispatch(validateStep({
                                    userId,
                                    labId: activeLab?.labId || 'adhoc',
                                    stepId: step?.stepId || null,
                                    action: 'CREATE_BUCKET',
                                    payload: { bucketName, region: 'us-east-1' }
                                })).unwrap();

                                if (result.success) {
                                    // S3 Auto-complete Logic
                                    const intermediateSteps = activeLab?.steps?.filter(s => 
                                        (
                                            s.title?.includes("Bucket Name") || 
                                            s.title?.includes("Region") || 
                                            s.title?.includes("Create Bucket") ||
                                            s.title?.includes("Open S3") ||
                                            s.title?.includes("Dashboard") ||
                                            s.validationLogic?.type === 'URL_CONTAINS'
                                        ) 
                                        && !s.isCompleted
                                    );
                                    if (intermediateSteps) {
                                        intermediateSteps.forEach(s => {
                                            dispatch(validateStep({
                                                userId, labId: activeLab?.labId, stepId: s.stepId, action: 'CLI_AUTO_COMPLETE', payload: { stepTitle: s.title }
                                            }));
                                        });
                                    }

                                    dispatch(fetchResources({ userId, type: 'S3_BUCKET' }));
                                } else {
                                    output.push({ text: `Error: ${result.message}`, type: 'error' });
                                }
                             } catch (err) {
                                 output.push({ text: `Error: ${err.message}`, type: 'error' });
                             }
                        } else {
                             output.push({ text: `usage: aws s3 <command> <options>`, type: 'error' });
                        }
                   // --- IAM COMMANDS ---
                   } else if (parts[1] === 'iam') {
                        if (parts[2] === 'list-users') {
                             // Dynamic Listing from Redux
                             const users = resources.iam || [];
                             output.push({ text: JSON.stringify({
                                 Users: users.map(u => ({
                                     UserName: u.state.userName,
                                     UserId: "AIDA" + Math.random().toString(36).substr(2, 9).toUpperCase(),
                                     CreateDate: u.state.created || new Date().toISOString()
                                 }))
                             }, null, 2), type: 'json' });
                        } else if (parts[2] === 'create-user') {
                            const nameIdx = parts.indexOf('--user-name');
                            if (nameIdx !== -1 && parts[nameIdx+1]) {
                                const userName = parts[nameIdx+1];
                                output.push({ text: `Creating user: ${userName}...`, type: 'system' });

                                try {
                                    const step = activeLab?.steps?.find(s => s.validationLogic?.type === 'RESOURCE_CREATED' && s.validationLogic.resourceType === 'IAM_USER');
                                    
                                    const result = await dispatch(validateStep({
                                        userId,
                                        labId: activeLab?.labId || 'adhoc',
                                        stepId: step?.stepId || null,
                                        action: 'CREATE_IAM_USER',
                                        payload: { userName, group: 'Developers' } // Default group for CLI
                                    })).unwrap();

                                    if (result.success) {
                                        // IAM Auto-complete Logic
                                        const intermediateSteps = activeLab?.steps?.filter(s => 
                                            (
                                                s.title?.includes("User name") || 
                                                s.title?.includes("Access type") || 
                                                s.title?.includes("Permissions") ||
                                                s.title?.includes("Open IAM") ||
                                                s.title?.includes("Dashboard") ||
                                                s.validationLogic?.type === 'URL_CONTAINS'
                                            ) 
                                            && !s.isCompleted
                                        );
                                        if (intermediateSteps) {
                                            intermediateSteps.forEach(s => {
                                                dispatch(validateStep({
                                                    userId, labId: activeLab?.labId, stepId: s.stepId, action: 'CLI_AUTO_COMPLETE', payload: { stepTitle: s.title }
                                                }));
                                            });
                                        }

                                        output.push({ text: JSON.stringify({
                                            User: {
                                                UserName: userName,
                                                UserId: "AIDA" + Math.random().toString(36).substr(2, 9).toUpperCase(),
                                                Arn: `arn:aws:iam::123456789012:user/${userName}`,
                                                CreateDate: new Date().toISOString()
                                            }
                                        }, null, 2), type: 'json' });
                                        
                                        dispatch(fetchResources({ userId, type: 'IAM_USER' }));
                                    } else {
                                        output.push({ text: `Error: ${result.message}`, type: 'error' });
                                    }
                                } catch (err) {
                                    output.push({ text: `Error: ${err.message}`, type: 'error' });
                                }
                            } else {
                                output.push({ text: 'usage: aws iam create-user --user-name <name>', type: 'error' });
                            }
                        } else {
                             output.push({ text: `usage: aws iam <command> <options>`, type: 'error' });
                        }
                   // --- EC2 & VPC COMMANDS ---
                   }
                   else if (parts[1] === 'ec2') {
                       if (parts[2] === 'describe-instances') {
                           // ... (Keep existing describe logic or improve) ...
                           output.push({ text: 'Wait... fetching instances...', type: 'json' });
                           setTimeout(() => {
                               setHistory(prev => [...prev, { 
                                   text: JSON.stringify({
                                       Reservations: [{
                                           Instances: [{ InstanceId: "i-0abc12345def", State: { Name: "running" }, InstanceType: "t2.micro" }]
                                       }]
                                   }, null, 2), 
                                   type: 'json' 
                               }]);
                           }, 500);
                       }
                       else if (parts[2] === 'create-vpc') {
                           const cidrIdx = parts.indexOf('--cidr-block');
                           const cidr = cidrIdx !== -1 ? parts[cidrIdx+1] : '10.0.0.0/16';
                           
                           try {
                               const result = await dispatch(validateStep({
                                   userId, labId: activeLab?.labId || 'adhoc',
                                   action: 'CREATE_VPC',
                                   payload: { name: 'cli-vpc', cidrBlock: cidr }
                               })).unwrap();
                               if(result.success) dispatch(fetchResources({ userId, type: 'VPC' }));
                               output.push({ text: JSON.stringify({ Vpc: { VpcId: 'vpc-'+Math.random().toString().substr(2,8), CidrBlock: cidr } }, null, 2), type: 'json' });
                           } catch(e) { output.push({ text: 'Error creating VPC', type: 'error' }); }
                       }
                       else if (parts[2] === 'create-subnet') {
                           const vpcIdx = parts.indexOf('--vpc-id');
                           const cidrIdx = parts.indexOf('--cidr-block');
                           try {
                               const result = await dispatch(validateStep({
                                   userId, labId: activeLab?.labId || 'adhoc',
                                   action: 'CREATE_SUBNET',
                                   payload: { name: 'cli-subnet', vpcId: parts[vpcIdx+1], cidrBlock: parts[cidrIdx+1], az: 'us-east-1a' }
                               })).unwrap();
                               if(result.success) dispatch(fetchResources({ userId, type: 'SUBNET' }));
                               output.push({ text: JSON.stringify({ Subnet: { SubnetId: 'subnet-'+Math.random().toString().substr(2,8) } }, null, 2), type: 'json' });
                           } catch(e) { output.push({ text: 'Error creating Subnet', type: 'error' }); }
                       }
                       else if (parts[2] === 'create-security-group') {
                           const nameIdx = parts.indexOf('--group-name');
                           try {
                               const result = await dispatch(validateStep({
                                   userId, labId: activeLab?.labId || 'adhoc',
                                   action: 'CREATE_SECURITY_GROUP',
                                   payload: { groupName: parts[nameIdx+1], description: 'CLI Created', vpcId: 'vpc-default' }
                               })).unwrap();
                               if(result.success) dispatch(fetchResources({ userId, type: 'SECURITY_GROUP' }));
                               output.push({ text: JSON.stringify({ GroupId: 'sg-'+Math.random().toString().substr(2,8) }, null, 2), type: 'json' });
                           } catch(e) { output.push({ text: 'Error creating SG', type: 'error' }); }
                       }
                       else if (parts[2] === 'create-volume') {
                           const sizeIdx = parts.indexOf('--size');
                           const azIdx = parts.indexOf('--availability-zone');
                           try {
                               const result = await dispatch(validateStep({
                                   userId, labId: activeLab?.labId || 'adhoc',
                                   action: 'CREATE_VOLUME',
                                   payload: { size: parts[sizeIdx+1] || 8, az: parts[azIdx+1] || 'us-east-1a' }
                               })).unwrap();
                               if(result.success) dispatch(fetchResources({ userId, type: 'EBS_VOLUME' }));
                               output.push({ text: JSON.stringify({ VolumeId: 'vol-'+Math.random().toString().substr(2,8), State: 'creating' }, null, 2), type: 'json' });
                           } catch(e) { output.push({ text: 'Error creating Volume', type: 'error' }); }
                       }
                       else if (parts[2] === 'run-instances') {
                        output.push({ text: 'Launching instance...', type: 'system' });
                        
                        // Parse simple args or use defaults
                        const imageIdIdx = parts.indexOf('--image-id');
                        const typeIdx = parts.indexOf('--instance-type');
                        
                        const payload = {
                            name: 'CLI-Created-Instance',
                            ami: imageIdIdx !== -1 ? parts[imageIdIdx + 1] : 'ami-al2023',
                            instanceType: typeIdx !== -1 ? parts[typeIdx + 1] : 't2.micro',
                            vpcId: 'vpc-main', // Default
                            subnetId: 'subnet-1', // Default
                            securityGroups: ['sg-web'],
                            userData: '',
                            keyPair: 'cli-key',
                            storage: { size: 8, type: 'gp3' }
                        };

                        try {
                            // Find the lab step that requires creating an EC2 instance
                            const successStep = activeLab?.steps?.find(s => 
                                s.validationLogic?.type === 'RESOURCE_CREATED' && 
                                s.validationLogic.resourceType === 'EC2_INSTANCE'
                            );

                            // Dispatch real backend action
                            // We use CLICK_FINAL_LAUNCH logic which creates the instance
                            // We pass the stepId so the system knows which step to mark as complete
                            const result = await dispatch(validateStep({
                                userId,
                                labId: activeLab?.labId || 'adhoc',
                                stepId: successStep?.stepId || null, 
                                action: 'CLICK_FINAL_LAUNCH',
                                payload
                            })).unwrap();

                            if (result.success) {
                                // AUTO-COMPLETE intermediate steps for CLI users
                                // Since CLI does everything at once, we should mark "Configure Name" and "Instance Type" as done if they exist
                                // ALSO mark "Open EC2 Dashboard" type steps as done since CLI implies access.
                                const intermediateSteps = activeLab?.steps?.filter(s => 
                                    (
                                        s.title?.includes("Name") || 
                                        s.title?.includes("OS") || 
                                        s.title?.includes("Instance Type") ||
                                        s.title?.includes("Open EC2") ||
                                        s.title?.includes("Dashboard") ||
                                        s.validationLogic?.type === 'URL_CONTAINS'
                                    ) 
                                    && !s.isCompleted 
                                );

                                if (intermediateSteps) {
                                    intermediateSteps.forEach(step => {
                                        dispatch(validateStep({
                                            userId,
                                            labId: activeLab?.labId || 'adhoc',
                                            stepId: step.stepId,
                                            action: 'CLI_AUTO_COMPLETE', 
                                            payload: { ...payload, stepTitle: step.title }
                                        }));
                                    });
                                }

                                output.push({ 
                                    text: JSON.stringify({
                                        Instances: [{
                                            InstanceId: "i-" + Math.floor(Math.random()*100000000), // In a real app we'd get this from backend result
                                            ImageId: payload.ami,
                                            InstanceType: payload.instanceType,
                                            State: { Code: 16, Name: "running" }
                                        }]
                                    }, null, 2), 
                                    type: 'json' 
                                });
                                // Refresh EC2 Dashboard
                                dispatch(fetchResources({ userId, type: 'EC2_INSTANCE' }));
                            } else {
                                output.push({ text: `Error: ${result.message || 'Failed to launch'}`, type: 'error' });
                            }
                        } catch (err) {
                             output.push({ text: `Execution Error: ${err.message}`, type: 'error' });
                        }
                   } else {
                       output.push({ text: 'usage: aws [options] <command> <subcommand> [parameters]', type: 'error' });
                   }
                } else {
                    output.push({ text: `usage: aws <service> <command>`, type: 'error' });
                }
            }
            else if (base === 'ls') { output.push({ text: 'README.md  setup.sh', type: 'output' }); }
                else if (base === 'pwd') { output.push({ text: '/home/cloudshell-user', type: 'output' }); }
                else if (base === 'whoami') { output.push({ text: 'cloudshell-user', type: 'output' }); }
                else if (base === 'mkdir') { 
                     if (parts[1]) output.push({ text: '', type: 'output' }); // Silent success
                     else output.push({ text: 'mkdir: missing operand', type: 'error' });
                }
                else if (base === 'touch') {
                      if (parts[1]) output.push({ text: '', type: 'output' }); // Silent success
                      else output.push({ text: 'touch: missing operand', type: 'error' });
                }
                else { output.push({ text: `bash: ${base}: command not found`, type: 'error' }); }
                
                // For async operations (like run-instances), we appended history inside callback/await
                // For sync operations, append here
                if (output.length > 0) newHistory.push(...output);
            }

            setHistory(newHistory);
        }
    };

    // Resizable Logic
    const [height, setHeight] = useState(350);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = (e) => {
        setIsResizing(true);
        e.preventDefault(); // Prevent text selection
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e) => {
        if (isResizing) {
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 100 && newHeight < window.innerHeight - 50) {
                setHeight(newHeight);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 bg-[#161e2d] text-gray-200 border-t border-gray-700 flex flex-col z-50 shadow-2xl font-mono text-sm leading-relaxed transition-all duration-75 ease-out ${isMaximized ? 'top-0 h-full' : ''}`}
            style={!isMaximized ? { height: `${height}px` } : {}}
            onClick={focusInput}
        >
            {/* Resizer Handle */}
            {!isMaximized && (
                <div 
                    className="w-full h-1 bg-gray-600 hover:bg-aws-orange cursor-ns-resize absolute top-0 left-0 z-50"
                    onMouseDown={startResizing}
                ></div>
            )}

            {/* Toolbar */}
            <div className="flex justify-between items-center bg-[#232f3e] px-4 py-1.5 select-none border-b border-gray-700">
                 <div className="flex space-x-4">
                     <span className="font-bold text-white border-b-2 border-aws-orange pb-0.5 cursor-pointer">Bash</span>
                     <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">PowerShell</span>
                     <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">Zsh</span>
                 </div>
                 <div className="flex items-center space-x-3 text-gray-400 relative">
                     <button className="hover:text-white p-1" onClick={() => setIsMaximized(!isMaximized)}>
                         {isMaximized ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                     </button>
                     
                     <div className="relative">
                        <button 
                            className={`p-1 hover:text-white ${showMenu ? 'text-white' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        >
                            <MoreHorizontal size={14}/>
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white text-gray-800 rounded shadow-xl border border-gray-200 z-50 text-xs py-1">
                                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setHistory([]); setShowMenu(false); }}>Clear Terminal</div>
                                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { window.location.reload(); }}>Restart Shell</div>
                            </div>
                        )}
                     </div>

                     <button onClick={onClose} className="hover:text-white hover:bg-red-600 p-1 rounded transition-colors"><X size={16} /></button>
                 </div>
            </div>

            {/* Terminal Area */}
            <div className="flex-1 overflow-y-auto p-4 cursor-text">
                {history.map((line, i) => (
                    <div key={i} className={`mb-0.5 break-all whitespace-pre-wrap ${
                        line.type === 'error' ? 'text-red-400' : 
                        line.type === 'system' ? 'text-green-400' : 
                        line.type === 'json' ? 'text-yellow-300' : 'text-gray-300'
                    }`}>
                        {line.text}
                    </div>
                ))}
                
                {/* Input Line */}
                <div className="flex mt-1">
                    <span className="mr-2 text-blue-400 whitespace-nowrap select-none">[cloudshell-user@ip-10-0-1-5 ~]$</span>
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="bg-transparent border-none outline-none flex-1 text-gray-100 p-0 focus:ring-0"
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleCommand}
                        autoComplete="off"
                        spellCheck="false"
                    />
                </div>
                <div ref={bottomRef}></div>
            </div>
        </div>
    );
};

export default CloudShellPanel;

