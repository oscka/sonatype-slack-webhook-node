const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

// Slack Webhook URL (Slack에서 발급받은 Webhook URL을 여기에 입력하세요)
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
app.use(bodyParser.json());

// 웹훅 엔드포인트 설정
app.post('/iq-webhook', (req, res) => {
    const data = req.body;
    console.log(JSON.stringify(data));

    // 웹훅의 종류별로 처리
    if (data.applicationEvaluation) {
        handleApplicationEvaluation(data.applicationEvaluation);
    } else if (data.licenseOverride) {
        handleLicenseOverrideManagement(data.licenseOverride);
    } else if (data.organizations) {
        handleOrganizationAndApplicationManagement(data.organizations);
    } else if (data.owner) {
        handlePolicyManagement(data.owner);
    } else if (data.securityVulnerabilityOverride) {
        handleSecurityVulnerabilityOverrideManagement(data.securityVulnerabilityOverride);
    } else if (data.policyAlerts) {
        handleViolationAlert(data.policyAlerts);
    } else if (data.addWaiverLink) {
        handleWaiverRequest(data.addWaiverLink);
    } else {
        return res.status(400).json({ status: 'unknown webhook type' });
    }

    res.status(200).json({ status: 'webhook handled successfully' });
});

// Application Evaluation 웹훅 처리 함수
function handleApplicationEvaluation(applicationData) {
    const appName = applicationData.application.name;
    const evaluationStatus = applicationData.stage;

    const message = `*Application Evaluation Completed*:\n*Application*: ${appName}\n*Status*: ${evaluationStatus}`;
    sendToSlack(message);
}

// License Override Management 웹훅 처리 함수
function handleLicenseOverrideManagement(licenseData) {
    const licenseId = licenseData.id;
    const overrideReason = licenseData.comment;

    const message = `*License Override Managed*:\n*License ID*: ${licenseId}\n*comment*: ${overrideReason}`;
    sendToSlack(message);
}

// Organization and Application Management 웹훅 처리 함수
function handleOrganizationAndApplicationManagement(orgAppData) {

    const message = `*조직 변경*`;
    sendToSlack(message);
}

// Policy Management 웹훅 처리 함수
function handlePolicyManagement(policyData) {
    // const policyName = policyData.policyName;
    // const policyAction = policyData.policyAction;

    const message = `*정책 변경*`;
    sendToSlack(message);
}

// Security Vulnerability Override Management 웹훅 처리 함수
function handleSecurityVulnerabilityOverrideManagement(securityData) {
    const vulnerabilityId = securityData.id;
    const overrideReason = securityData.comment;

    const message = `*Security Vulnerability Override Managed*:\n*Vulnerability ID*: ${vulnerabilityId}\n*Reason*: ${overrideReason}`;
    sendToSlack(message);
}

// Violation Alert 웹훅 처리 함수
function handleViolationAlert(violationData) {

    const message = `*Violation Alert*`;

    sendToSlack(message);
}

// Waiver Request 웹훅 처리 함수
function handleWaiverRequest(waiverData) {
    // const waiverComment = waiverData.comment;

    const message = `*Waiver 요청*:`;
    sendToSlack(message);
}

// Slack으로 메시지를 전송하는 함수
function sendToSlack(message) {
    axios.post(SLACK_WEBHOOK_URL, {
        text: message,
    }).then(response => {
        console.log('Message sent to Slack');
    }).catch(error => {
        console.error('Error sending message to Slack:', error);
    });
}

// 서버 실행
app.listen(port, () => {
    console.log(`IQ Server Webhook listener is running on port ${port}`);
});