import CryptoJS from 'crypto-js';

class NetsuiteAPI {
    constructor(baseUrl, accountId) {
        this.baseUrl = baseUrl;
        this.accountId = accountId;
        this.scriptId = 'customscript_time_entry_restlet'; // Update with your script ID
        this.deploymentId = 'customdeploy_time_entry_restlet'; // Update with your deployment ID
        
        // TBA credentials - these should be stored securely
        this.consumerKey = ''; // Will be provided by user
        this.consumerSecret = ''; // Will be provided by user
        this.tokenId = ''; // Will be provided by user
        this.tokenSecret = ''; // Will be provided by user
    }

    generateNonce() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    generateTimestamp() {
        return Math.floor(Date.now() / 1000).toString();
    }

    generateSignature(method, url, timestamp, nonce) {
        const baseString = [
            method.toUpperCase(),
            encodeURIComponent(url),
            encodeURIComponent(
                'oauth_consumer_key=' + this.consumerKey +
                '&oauth_nonce=' + nonce +
                '&oauth_signature_method=HMAC-SHA256' +
                '&oauth_timestamp=' + timestamp +
                '&oauth_token=' + this.tokenId +
                '&oauth_version=1.0'
            )
        ].join('&');

        const signingKey = encodeURIComponent(this.consumerSecret) + '&' + encodeURIComponent(this.tokenSecret);
        return CryptoJS.HmacSHA256(baseString, signingKey).toString(CryptoJS.enc.Base64);
    }

    generateAuthHeader(method, url) {
        const timestamp = this.generateTimestamp();
        const nonce = this.generateNonce();
        const signature = this.generateSignature(method, url, timestamp, nonce);

        return 'OAuth ' +
            'oauth_signature="' + encodeURIComponent(signature) + '",' +
            'oauth_version="1.0",' +
            'oauth_nonce="' + nonce + '",' +
            'oauth_signature_method="HMAC-SHA256",' +
            'oauth_consumer_key="' + this.consumerKey + '",' +
            'oauth_token="' + this.tokenId + '",' +
            'oauth_timestamp="' + timestamp + '"';
    }

    async setTBACredentials(credentials) {
        this.consumerKey = credentials.consumerKey;
        this.consumerSecret = credentials.consumerSecret;
        this.tokenId = credentials.tokenId;
        this.tokenSecret = credentials.tokenSecret;
    }

    async authenticate(username, password) {
        // In production, you might want to validate the credentials here
        // For now, we'll just check if TBA credentials are set
        if (!this.consumerKey || !this.consumerSecret || !this.tokenId || !this.tokenSecret) {
            throw new Error('TBA credentials not set');
        }
        return { success: true };
    }

    async getProjects() {
        try {
            const url = `${this.baseUrl}/app/site/hosting/restlet.nl?script=${this.scriptId}&deploy=${this.deploymentId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': this.generateAuthHeader('GET', url),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            return data.projects;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    async submitTimeEntry(timeEntry) {
        try {
            const url = `${this.baseUrl}/app/site/hosting/restlet.nl?script=${this.scriptId}&deploy=${this.deploymentId}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': this.generateAuthHeader('POST', url),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(timeEntry)
            });

            if (!response.ok) {
                throw new Error('Failed to submit time entry');
            }

            return await response.json();
        } catch (error) {
            console.error('Error submitting time entry:', error);
            throw error;
        }
    }
}

export const createNetsuiteAPI = (baseUrl, accountId) => {
    return new NetsuiteAPI(baseUrl, accountId);
}; 