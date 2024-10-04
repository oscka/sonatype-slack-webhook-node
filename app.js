// app.js
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const slackWebhookUrl = 'https://hooks.slack.com/services/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';

app.use(express.json());

// IQ Server에서 Webhook을 통해 데이터를 받을 엔드포인트
app.post('/iq-webhook', async (req, res) => {
    const iqData = req.body;
    console.log(JSON.stringify(iqData))
    console.log(JSON.stringify(iqData.applicationEvaluation))
    // IQ Server에서 받은 데이터를 Slack 메시지 포맷으로 변환
    const slackMessage = {
        text: `IQ Server 알림`,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Application*: ${iqData.applicationEvaluation.application.name}\n*Stage*: ${iqData.applicationEvaluation.stage}\n*영향받는 Component*: ${iqData.applicationEvaluation.affectedComponentCount}개\n*치명적인 Component*: ${iqData.applicationEvaluation.criticalComponentCount}개\n*심각한 Component*: ${iqData.applicationEvaluation.severeComponentCount}개\n*보통 Component*: ${iqData.applicationEvaluation.moderateComponentCount}개\n`
                }
            }
        ]
    };

    try {
        // Slack Webhook에 메시지 전송
        await axios.post(slackWebhookUrl, slackMessage, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Slack으로 메시지를 성공적으로 전송했습니다.');
        res.status(200).send('Webhook processed.');
    } catch (error) {
        console.error('Slack으로 메시지 전송 실패:', error);
        res.status(500).send('Failed to process webhook.');
    }
});

// 서버 시작
app.listen(port, () => {
    console.log(`IQ Server Webhook listener is running on port ${port}`);
});
