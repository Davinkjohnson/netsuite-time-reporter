class NetsuiteAPI {
    constructor(baseUrl, accountId) {
        this.baseUrl = baseUrl;
        this.accountId = accountId;
        this.token = null;
    }

    async authenticate(username, password) {
        try {
            // For development/testing, just store the credentials
            // In production, you would implement proper Netsuite TBA here
            this.username = username;
            this.password = password;
            
            // Simulate successful authentication for testing
            return { success: true };
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    async getProjects() {
        try {
            // For development/testing, return mock data
            return [
                { id: 1, name: "Project A", customer: "Customer 1" },
                { id: 2, name: "Project B", customer: "Customer 2" },
                { id: 3, name: "Project C", customer: "Customer 3" }
            ];
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    async submitTimeEntry(timeEntry) {
        try {
            // For development/testing, just log the time entry
            console.log('Time entry submitted:', timeEntry);
            return { success: true };
        } catch (error) {
            console.error('Error submitting time entry:', error);
            throw error;
        }
    }
}

export const createNetsuiteAPI = (baseUrl, accountId) => {
    return new NetsuiteAPI(baseUrl, accountId);
}; 