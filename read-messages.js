const { google } = require('googleapis');
const authorize = require('./authorize');

const getWatchHistoryId = async () => {
    const auth = await authorize.getOAuthClient();
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.watch(
            {
                userId: 'me',
                requestBody: {
                    topicName: 'projects/gmail-bot-1603524755042/topics/gmail-bot',
                },
            },
            (err, res) => {
                if (err) reject(err);
                else {
                    resolve(res.data.historyId);
                }
            }
        );
    });
};

const stopMailWatch = async () => {
    const auth = await authorize.getOAuthClient();
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.stop(
            {
                userId: 'me',
            },
            (err, res) => {
                if (err) reject(err);
                else {
                    resolve(res);
                }
            }
        );
    });
};

const listMessageId = async (historyId) => {
    const auth = await authorize.getOAuthClient();
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.history.list(
            {
                userId: 'me',
                startHistoryId: historyId,
            },
            (err, res) => {
                if (err) {
                    reject(err);
                }
                const messageIds = [];
                if (res && res.data && Array.isArray(res.data.history) && res.data.history.length > 0) {
                    for (let history of res.data.history) {
                        if (history && history.messagesAdded && Array.isArray(history.messagesAdded) && history.messagesAdded.length > 0) {
                            for (let message of history.messagesAdded) {
                                if (message && message.message) {
                                    messageIds.push(message.message.id);
                                }
                            }
                        }
                    }
                }
                resolve(messageIds);
            }
        );
    });
};

const readMessage = async (messageId) => {
    const auth = await authorize.getOAuthClient();
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.messages.get(
            {
                userId: 'me',
                id: messageId,
            },
            (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                let emailObject = {
                    messageId: messageId,
                    attachments: [],
                };
                if (res && res.data && res.data.payload) {
                    const payload = res.data.payload;
                    if (payload && payload.headers && Array.isArray(payload.headers) && payload.headers.length > 0) {
                        for (let header of payload.headers) {
                            if (header) {
                                if (header['name'] === 'From') {
                                    emailObject['from'] = header['value'];
                                }
                                if (header['name'] === 'To') {
                                    emailObject['to'] = header['value'];
                                }
                                if (header['name'] === 'Subject') {
                                    emailObject['subject'] = header['value'];
                                }
                            }
                        }
                    }
                    if (payload && payload.parts && Array.isArray(payload.parts) && payload.parts.length > 0) {
                        let body = [];
                        let attachments = [];
                        parseMessageAndAttachment(payload.parts, body, attachments);
                        emailObject['body'] = body.join('\n');
                        emailObject['attachments'] = attachments;
                    }
                }
                resolve(emailObject);
            }
        );
    });
};

const parseMessageAndAttachment = (payloadParts, body, attachments) => {
    for (let data of payloadParts) {
        if (data.filename) {
            let fileName = data.filename;
            let mimeType = data.mimeType;
            let attachmentId = data.body.attachmentId;
            let fileSize = data.body.size;
            attachments.push({
                fileName,
                mimeType,
                attachmentId,
                fileSize,
            });
        } else if (data.parts) {
            parseMessageAndAttachment(data.parts, body, attachments);
        } else {
            let textBody = data.body.data;
            if (textBody) {
                let buff = Buffer.from(textBody, 'base64');
                let text = buff.toString('ascii');
                body.push(text);
            }
        }
    }
};

module.exports = {
    getWatchHistoryId: getWatchHistoryId,
    listMessageId: listMessageId,
    readMessage: readMessage,
    stopMailWatch: stopMailWatch,
};
