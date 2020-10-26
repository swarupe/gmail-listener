const fs = require('fs');
const readline = require('readline-sync');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = 'token.json';

function authorize() {
    return new Promise((resolve, reject) => {
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            const credentials = JSON.parse(content);
            const { client_secret, client_id, redirect_uris } = credentials.web;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);
            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) resolve(getNewToken(oAuth2Client));
                else {
                    oAuth2Client.setCredentials(JSON.parse(token));
                    resolve(oAuth2Client);
                }
            });
        });
    });
}

function getNewToken(oAuth2Client) {
    return new Promise((resolve, reject) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        let code = readline.question('Enter the code from that page here: ');
        oAuth2Client.getToken(code, (err, token) => {
            if (err) console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            resolve(oAuth2Client);
        });
    });
}

module.exports = {
    getOAuthClient: authorize,
};
