require('dotenv').config();
const mongoose = require('mongoose');

const DB_URL = 'mongodb://localhost:27017/mailmeeting';

const listener = require('./listener');
const readMessage = require('./read-messages');

mongoose.connect(DB_URL, { useUnifiedTopology: true, useNewUrlParser: true });

const connection = mongoose.connection;

connection.once('open', function () {
    console.log('MongoDB database connection established successfully');
    readMessage
        .stopMailWatch()
        .then(() => {
            readMessage
                .getWatchHistoryId()
                .then((historyId) => {
                    console.log('First History Id', historyId);
                    listener.listenMailBox(historyId);
                })
                .catch((err) => {
                    console.log(err);
                });
        })
        .catch((err) => {
            console.log(err);
        });
});
