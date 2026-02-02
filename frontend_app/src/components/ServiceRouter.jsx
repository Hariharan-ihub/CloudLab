import React from 'react';
import { useParams } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import FakeS3Console from './FakeS3Console';
import FakeIAMConsole from './FakeIAMConsole';
import FakeEC2Console from './FakeEC2Console';
import FakeVPCConsole from './FakeVPCConsole';
import FakeSecretsManagerConsole from './FakeSecretsManagerConsole';
import FakeCloudWatchConsole from './FakeCloudWatchConsole';
import FakeSecurityGroupConsole from './FakeSecurityGroupConsole';

import FakeEBSConsole from './FakeEBSConsole';

const ServiceRouter = () => {
    return (
        <Routes>
            <Route path="ec2" element={<FakeEC2Console />} />
            <Route path="s3" element={<FakeS3Console />} />
            <Route path="ebs" element={<FakeEBSConsole />} />
            <Route path="vpc" element={<FakeVPCConsole />} />
            <Route path="iam" element={<FakeIAMConsole />} />
            <Route path="secretsmanager" element={<FakeSecretsManagerConsole />} />
            <Route path="cloudwatch" element={<FakeCloudWatchConsole />} />
            <Route path="securitygroups" element={<FakeSecurityGroupConsole />} />
            <Route path="*" element={<div className="p-8">Service not found</div>} />
        </Routes>
    );
};

export default ServiceRouter;
