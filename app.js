const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

const {
    MESSENGER_URL,
    SRV_CODE,
    RECIPIENT,
    MESSAGE_TITLE,
    SENDER_ALIAS,
    SAVEOPTION
} = process.env;

if (!MESSENGER_URL) {
    console.error("❌ Messenger URL is not set! Please check environment variables.");
    process.exit(1);
}

app.use(bodyParser.json());

// 웹훅 엔드포인트 설정
app.post('/iq-webhook', (req, res) => {
    webhook_id = req.headers['x-nexus-webhook-id'];
    const data = req.body;
    console.log("data == ",data)
    webhook_id = webhook_id.substring(3);
    blocks = initBlocks(webhook_id);

    // 웹훅의 종류별로 처리
    if(data.action){
        handleAction(data);

    }
    if (data.applicationEvaluation) {
        handleApplicationEvaluation(data.applicationEvaluation);
        sendToMessenger(blocks);
    }
    if (data.licenseOverride) {
        handleLicenseOverrideManagement(data.licenseOverride);
        sendToMessenger(blocks);
    }
    if (data.organizations) {
        handleOrganizationAndApplicationManagement(data);
        sendToMessenger(blocks);
    }
    if (data.owner) {
        handlePolicyManagement(data.owner);
        sendToMessenger(blocks);
    }
    if (data.securityVulnerabilityOverride) {
        handleSecurityVulnerabilityOverrideManagement(data.securityVulnerabilityOverride);
        sendToMessenger(blocks);
    }
    if (data.policyAlerts) {
        handleViolationAlert(data);
        sendToMessenger(blocks);
    } 
    if (data.addWaiverLink) {
        handleWaiverRequest(data);
        sendToMessenger(blocks);
    } 


    res.status(200).json({ status: 'webhook handled successfully' });
});

function initBlocks(){
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    blocks = [
        {
            "type": "header",
            "text": {
                    "type": "plain_text",
                    "text": "Nexus IQ Server Message"
            }
        },
        {
            "type": "context",
            "elements": [
                    {
                            "text": `${webhook_id} ${year}-${month}-${day} ${hours}:${minutes}`,
                            "type": "mrkdwn"
                    }
            ]
        },
        {
            "type": "divider"
        }
    ];
    return blocks
}

function addSelection(text){
    if(text != ''){
        const selection ={
            "type": "section",
            "text": {
                    "type": "mrkdwn",
                    "text": `${text}`
            }
        };
        blocks.push(selection);
    } 
}
    
function addDivider(){
    const divider = {
        "type": "divider"
    };
    blocks.push(divider)
}

function handleAction(data){
    let text = `*Initiator*: ${data.initiator}\n*Action*: ${data.action}\n*Type*: ${data.type}`;    
    addSelection(text);
    addDivider();
}

// Application Evaluation 웹훅 처리 함수
function handleApplicationEvaluation(applicationData) {
    let text = '';
    if(applicationData.application.name){
        text += `*Application*: ${applicationData.application.name}\n`;
    }
    text += `*Stage*: ${applicationData.stage}\n*Affected Component*: ${applicationData.affectedComponentCount}개\n*Critical Component*: ${applicationData.criticalComponentCount}개\n*Severe Component*: ${applicationData.severeComponentCount}개\n*Moderate Component*: ${applicationData.moderateComponentCount}개\n`;
    addSelection(text);
    addDivider();
}

// License Override Management 웹훅 처리 함수
function handleLicenseOverrideManagement(licenseData) {
    let text = `Status*: ${licenseData.status}\n*Comment*: ${licenseData.overrideReason}`;   
    Object.keys(licenseData.licenseIds).forEach(function(k) {
        const value = licenseData.licenseIds[k];
        text += `*LicenseId*: ${value}\n`
    });
    addSelection(text);
    addDivider();
}

// Organization and Application Management 웹훅 처리 함수
function handleOrganizationAndApplicationManagement(orgAppData) {
    if(orgAppData.organizations){
        let text = `*• Organizations*: \n`;
        Object.keys(orgAppData.organizations).forEach(function(k) {
            const organizations_data = orgAppData.organizations[k];
            Object.keys(organizations_data).forEach(function(k) {
                const value = organizations_data[k];
                if(k == 'id' || k =='organizationId'){
                    return;
                }
                text += `*${k}*: ${value}\n`;
            });
        });
        addSelection(text);
    }
    
    if(orgAppData.applications){
        let text = `*• Applications*: \n`;
        Object.keys(orgAppData.applications).forEach(function(k) {
            const applications_data = orgAppData.applications[k];
            Object.keys(applications_data).forEach(function(k) {
                const value = applications_data[k];
                if(k == 'id' || k == 'organizationId'){
                    return;
                }
                text += `*${k}*: ${value}\n`;
            });
        });
        addSelection(text);
    }
    addDivider();
}

// Policy Management 웹훅 처리 함수
function handlePolicyManagement(policyData) {
    let owner_data = `*• Owner*\n*Name*: ${policyData.name} \n *Type*: ${policyData.type} \n `;
    addSelection(owner_data);
    let policies_text = `*• Polices*: \n`
    if(policyData.policies && policyData.policies.length != 0){
        Object.keys(policyData.policies).forEach(function(k) {
            const policies_data = policyData.policies[k];
            Object.keys(policies_data).forEach(function(k) {
                if(k == 'id'){
                    return;
                }
                const value = policies_data[k];
                policies_text += `*${k}*: ${value}\n`
            });
        });
        addSelection(policies_text);
    }
    addDivider();
}

// Security Vulnerability Override Management 웹훅 처리 함수
function handleSecurityVulnerabilityOverrideManagement(securityData) {
    let text = `*Source*: ${securityData.source}\n*ReferenceId*: ${securityData.referenceId}\n*Status*: ${securityData.status}\n*Comment*: ${securityData.comment}`;
    addSelection(text);
    addDivider();
}

// Violation Alert 웹훅 처리 함수
function handleViolationAlert(violationData) {
    let text = `*initiator*: ${violationData.initiator}\n*Application*: ${violationData.application.name}\n*Outcome* :${violationData.applicationEvaluation.outcome}`;
    addSelection(text);
    addDivider();
}

// Waiver Request 웹훅 처리 함수
function handleWaiverRequest(waiverData) {
    let text = `*Initiator*: ${waiverData.initiator}\n*Comment*: ${waiverData.comment}`;
    addSelection(text);
    const element = {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Waiver추가"
        },
        "accessory": {                
            "type": "button",
            "text": {
                    "type": "plain_text",
                    "text": "Add Waiver",
                    "emoji": true,
            },
            "url": waiverData.addWaiverLink
        }
    };
    blocks.push(element);
    addDivider();
}

// Messenger로 메시지를 전송하는 함수
const qs = require('qs');
function sendToMessenger(blocks) {
    const titleText = blocks.find(b => b.type === 'context')?.elements?.[0]?.text;
    const bodyText = blocks.map(block => {
        switch (block.type) {
            case 'header':
                return block.text?.text || '';
            case 'context':
                return block.elements?.map(el => el.text || '').join(' ') || '';
            case 'section':
                return block.text?.text || '';
            case 'divider':
                return '--------------------------------';
            default:
                return '';
        }
    }).filter(Boolean).join('\n');
    const data = {
        SRV_CODE: SRV_CODE,
        RECIPIENT: RECIPIENT,
        SEND: "Y",
        TITLE: titleText,
        BODY: bodyText,
        SAVEOPTION: SAVEOPTION,
        SENDER_ALIAS: SENDER_ALIAS
    };
    console.log("blocks:",blocks);
    console.log("Messenger Request Data:", data);
    console.log("Form-urlencoded data:", qs.stringify(data));

    axios.post(
        MESSENGER_URL,
        qs.stringify(data),  // form-urlencoded 변환
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }
    )
        .then(() => console.log("Message sent to internal messenger"))
        .catch(err => console.error("Error:", err));
}


// 서버 실행
app.listen(port, () => {
    console.log(`IQ Server Webhook listener is running on port ${port}`);
});