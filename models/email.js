const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let email = new Schema(
    {
        messageId: {
            type: String,
        },
        from: {
            type: String,
        },
        to: {
            type: String,
        },
        subject: {
            type: String,
        },
        body: {
            type: String,
        },
        attachments: [
            {
                type: String,
            },
        ],
    },
    { collection: 'emails' }
);

module.exports = mongoose.model('emails', email);
