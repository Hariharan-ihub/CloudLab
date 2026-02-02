import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, Copy, AlertCircle, Check } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const SmartTerminal = ({ instance, onClose }) => {
    const [activeTab, setActiveTab] = useState('connect'); // 'connect' | 'ssh'
    const [isConnected, setIsConnected] = useState(false);

    // --- TERMINAL LOGIC (Existing) ---
    const { resources } = useSelector(state => state.simulation);
    const ebsVolumes = resources.ebs || [];
    const [history, setHistory] = useState([
        { text: 'Amazon Linux 2023 [Running]', type: 'system' },
        { text: 'Run "sudo yum update" to apply security updates.', type: 'system' },
        { text: '', type: 'newline' }
    ]);
    const [input, setInput] = useState('');
    const [cwd, setCwd] = useState('~');
    const bottomRef = useRef(null);
    const [state, setState] = useState({
        packages: { httpd: false, python3: true, nodejs: false },
        env: { PATH: '/usr/bin:/bin', USER: 'ec2-user' },
        rootVolume: { name: 'xvda1', size: '8GB', mount: '/', type: 'root' },
        mounts: {},
        services: { httpd: 'inactive (dead)', sshd: 'active (running)', cron: 'active (running)' }
    });
    const attachedVolumes = ebsVolumes.filter(v => 
        v.state.attachment && v.state.attachment.instanceId === instance.state.instanceId
    ).map(v => ({ name: v.state.attachment.device.replace('/dev/', ''), device: v.state.attachment.device, size: v.state.size + 'GB', id: v.state.volumeId }));

    useEffect(() => {
        if (isConnected && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [history, isConnected]);

    const handleCommand = (e) => {
        if (e.key === 'Enter') {
            const cmd = input.trim();
            const newHistory = [...history, { text: `[ec2-user@${instance.state.dns?.split('.')[0] || 'ip-10-0-0-1'} ${cwd}]$ ${cmd}`, type: 'input' }];
            if (cmd) {
                const parts = cmd.split(' ');
                const base = parts[0];
                const args = parts.slice(1);
                let output = [];
                // --- Simple Mock Implementation ---
                if (base === 'clear') { setHistory([]); setInput(''); return; }
                else if (base === 'ls') { output.push({ text: '-rw-r--r-- README.txt', type: 'output' }); }
                else if (base === 'pwd') { output.push({ text: cwd === '~' ? '/home/ec2-user' : cwd, type: 'output' }); }
                else if (base === 'whoami') { output.push({ text: 'ec2-user', type: 'output' }); }
                else if (base === 'sudo' && args[0] === 'yum') { output.push({ text: 'Loaded plugins: extras_suggestions', type: 'output' }); output.push({ text: 'Package installed.', type: 'success' }); }
                else if (base === 'ping') { output.push({ text: `PING ${args[0] || 'google.com'} (172.217.1.1) 56(84) bytes of data.`, type: 'output' }); }
                else { output.push({ text: `bash: ${base}: command not found`, type: 'error' }); }
                newHistory.push(...output);
            }
            setHistory(newHistory);
            setInput('');
        }
    };

    // --- RENDER ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 rounded-lg w-[700px] h-[550px] shadow-2xl flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4 bg-gray-50">
                    <h2 className="font-bold text-lg">Connect to instance</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black"><X size={20}/></button>
                </div>

                {/* Instance Info Header */}
                <div className="px-6 py-4 border-b bg-white">
                    <div className="text-sm font-bold text-gray-700 mb-1">Instance ID</div>
                    <div className="text-aws-blue hover:underline cursor-pointer flex items-center">
                        {instance.state.instanceId} <Copy size={12} className="ml-2 text-gray-400"/>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b px-6">
                    <button 
                        className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'connect' ? 'border-aws-orange text-aws-blue' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        onClick={() => { setActiveTab('connect'); setIsConnected(false); }}
                    >
                        EC2 Instance Connect
                    </button>
                    <button 
                        className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ssh' ? 'border-aws-orange text-aws-blue' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        onClick={() => { setActiveTab('ssh'); setIsConnected(false); }}
                    >
                        SSH Client
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-white">
                    
                    {/* ADDED: TAB 1 - EC2 INSTANCE CONNECT */}
                    {activeTab === 'connect' && (
                        isConnected ? (
                            <div className="h-full bg-gray-900 text-green-400 font-mono p-2 overflow-hidden flex flex-col" onClick={() => document.getElementById('term-input')?.focus()}>
                                <div className="flex-1 overflow-y-auto">
                                    {history.map((line, i) => (
                                        <div key={i} className={`mb-1 break-all ${line.type === 'error' ? 'text-red-400' : line.type === 'system' ? 'text-gray-500' : ''}`}>
                                            {line.text}
                                        </div>
                                    ))}
                                    <div ref={bottomRef}></div>
                                </div>
                                <div className="flex mt-2">
                                    <span className="mr-2 whitespace-nowrap select-none">[ec2-user@{instance.state.dns?.split('.')[0] || 'ip-10-0-0-1'} ~]$</span>
                                    <input 
                                        id="term-input"
                                        type="text" 
                                        className="bg-transparent border-none outline-none flex-1 text-green-400 focus:ring-0 p-0"
                                        autoFocus
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleCommand}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-8">
                                <div className="mb-6">
                                    <h3 className="font-bold text-gray-800 mb-2">Connect to your instance</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        You can connect to your instance using EC2 Instance Connect. This provides a browser-based SSH connection.
                                    </p>
                                    
                                    <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6 flex items-start">
                                        <AlertCircle size={20} className="text-aws-blue mr-3 shrink-0 mt-0.5" />
                                        <div className="text-sm text-gray-700">
                                            <span className="font-bold">Username</span>
                                            <div className="mt-1 font-mono bg-white border border-blue-200 px-2 py-1 inline-block rounded">ec2-user</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button 
                                        className="aws-btn-primary px-6 float-right"
                                        onClick={() => setIsConnected(true)}
                                    >
                                        Connect
                                    </button>
                                </div>
                            </div>
                        )
                    )}

                    {/* ADDED: TAB 2 - SSH CLIENT */}
                    {activeTab === 'ssh' && (
                        <div className="p-8">
                             <h3 className="font-bold text-gray-800 mb-4">Connect using SSH Client</h3>
                             <div className="space-y-6">
                                <div>
                                    <div className="font-bold text-sm mb-1">1. Open an SSH client.</div>
                                    <p className="text-sm text-gray-600">Locate your private key file. The key used to launch this instance is <span className="font-bold text-gray-800">marketing-key.pem</span></p>
                                </div>
                                
                                <div>
                                    <div className="font-bold text-sm mb-1">2. Ensure your key is not publicly viewable.</div>
                                    <div className="bg-gray-100 p-3 rounded border border-gray-300 font-mono text-sm text-gray-800 relative group">
                                         chmod 400 marketing-key.pem
                                         <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-800" onClick={() => toast.success('Copied')}><Copy size={16}/></button>
                                    </div>
                                </div>

                                <div>
                                    <div className="font-bold text-sm mb-1">3. Connect to your instance using its Public DNS:</div>
                                    <div className="text-aws-blue text-sm mb-2">{instance.state.dns || 'ec2-54-123-45-67.compute-1.amazonaws.com'}</div>
                                    
                                    <div className="bg-gray-100 p-3 rounded border border-gray-300 font-mono text-sm text-gray-800 relative group break-all">
                                         ssh -i "marketing-key.pem" ec2-user@{instance.state.dns || 'ec2-54-123-45-67.compute-1.amazonaws.com'}
                                         <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-800" onClick={() => toast.success('Copied')}><Copy size={16}/></button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartTerminal;
