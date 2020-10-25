require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { PubSub } = require('@google-cloud/pubsub');

const subscriptionName = 'projects/gmail-bot-1603524755042/subscriptions/node-subscriber';
const timeout = 60;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const TOKEN_PATH = 'token.json';

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), getHistoryId);
});

const pubSubClient = new PubSub();

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function getHistoryId(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.watch(
        {
            userId: 'me',
            requestBody: {
                topicName: 'projects/gmail-bot-1603524755042/topics/gmail-bot',
            },
        },
        (err, res) => {
            if (err) return console.log('Error listening', err);
            let historyId = res.data.historyId;
        }
    );
}

function listenForMessages() {
    // References an existing subscription
    const subscription = pubSubClient.subscription(subscriptionName);

    // Create an event handler to handle messages
    let messageCount = 0;
    const messageHandler = (message) => {
        console.log(`Received message ${message.id}:`);
        console.log(`\tData: ${message.data}`);
        console.log(`\tAttributes: ${message.attributes}`);
        messageCount += 1;

        // "Ack" (acknowledge receipt of) the message
        message.ack();
    };

    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);

    setTimeout(() => {
        subscription.removeListener('message', messageHandler);
        console.log(`${messageCount} message(s) received.`);
    }, timeout * 1000);
}

listenForMessages();
