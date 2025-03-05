class NetsuiteAPI {
    constructor(baseUrl, accountId) {
        this.baseUrl = baseUrl;
        this.accountId = accountId;
        this.token = null;
    }

    async authenticate(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/services/oauth2/v1/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'password',
                    client_id: this.accountId,
                    username: username,
                    password: password,
                    scope: 'rest_webservices'
                })
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            this.token = data.access_token;
            return data;
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    async getProjects() {
        try {
            const response = await fetch(`${this.baseUrl}/services/rest/record/v1/project`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            return data.items.map(project => ({
                id: project.id,
                name: project.name,
                customer: project.customer?.name
            }));
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    async submitTimeEntry(timeEntry) {
        try {
            const response = await fetch(`${this.baseUrl}/services/rest/record/v1/timeentry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    project: {
                        id: timeEntry.project
                    },
                    date: timeEntry.date,
                    hours: timeEntry.hours,
                    description: timeEntry.description,
                    employee: {
                        id: this.accountId
                    }
                })
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