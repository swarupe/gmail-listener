const { google } = require('googleapis');
const stream = require('stream');
const authorize = require('./authorize');

const getAttachment = async (messageId, attachmentId) => {
    const auth = await authorize.getOAuthClient();
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.messages.attachments.get(
            {
                userId: 'me',
                messageId: messageId,
                id: attachmentId,
            },
            (err, res) => {
                if (err) reject(err);
                else if (res && res.data) {
                    const buffer = Buffer.from(res.data.data, 'base64');
                    const streamData = new stream.PassThrough();
                    streamData.end(buffer);
                    resolve(streamData);
                }
            }
        );
    });
};

const uploadAttachmentToDrive = async (attachmentData) => {
    const auth = await authorize.getOAuthClient();
    return new Promise((resolve, reject) => {
        const drive = google.drive({ version: 'v3', auth });
        drive.files.create(
            {
                media: {
                    mimeType: attachmentData.mimeType,
                    body: attachmentData.stream,
                },
                auth,
                fields: 'id',
                requestBody: {
                    name: attachmentData.fileName,
                    mimeType: attachmentData.mimeType,
                },
            },
            (err, file) => {
                if (err) reject(err);
                else {
                    resolve(file.data.id);
                }
            }
        );
    });
};

module.exports = {
    getAttachment: getAttachment,
    uploadAttachmentToDrive: uploadAttachmentToDrive,
};
