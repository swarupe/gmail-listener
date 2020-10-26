const { PubSub } = require('@google-cloud/pubsub');
const readMessages = require('./read-messages');
const fileOperation = require('./attachments');
const emailSchema = require('./models/email');

const subscriptionName = 'projects/gmail-bot-1603524755042/subscriptions/node-subscriber';

const pubSubClient = new PubSub();

const handlePubSubMessage = async (historyId) => {
    const messageIds = await readMessages.listMessageId(historyId);
    for (let id of messageIds) {
        const data = await readMessages.readMessage(id);
        if (data && data.body && /meeting/gim.test(data.body)) {
            const insertData = {
                messageId: data.messageId,
                from: data.from,
                to: data.to,
                subject: data.subject,
                body: data.body,
            };

            if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
                insertData['attachments'] = [];
                for (let attachment of data.attachments) {
                    const attachmentStream = await fileOperation.getAttachment(data.messageId, attachment.attachmentId);
                    attachment['stream'] = attachmentStream;
                    const fileId = await fileOperation.uploadAttachmentToDrive(attachment);
                    insertData['attachments'].push(fileId);
                }
            }
            // console.log(insertData);
            await emailSchema.insertMany(insertData);
            console.log('Saved email successfully...!!!');
        }
    }
};

const listenMailBox = (startHistoryId) => {
    const subscription = pubSubClient.subscription(subscriptionName);
    subscription.on('message', async (message) => {
        message.ack();
        const messageData = JSON.parse(message.data);
        if (messageData.historyId !== startHistoryId) {
            await handlePubSubMessage(startHistoryId);
            startHistoryId = messageData.historyId;
        }
    });
};

module.exports = {
    listenMailBox: listenMailBox,
};
