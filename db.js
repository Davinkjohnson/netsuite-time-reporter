const DB_NAME = 'timeReporterDB';
const DB_VERSION = 2;
const TIME_ENTRIES_STORE = 'timeEntries';
const SETTINGS_STORE = 'settings';

class Database {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create time entries store if it doesn't exist
                if (!db.objectStoreNames.contains(TIME_ENTRIES_STORE)) {
                    const store = db.createObjectStore(TIME_ENTRIES_STORE, { keyPath: 'id' });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                }
                
                // Create settings store if it doesn't exist
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
                }
            };
        });
    }

    async saveTimeEntry(timeEntry) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([TIME_ENTRIES_STORE], 'readwrite');
            const store = transaction.objectStore(TIME_ENTRIES_STORE);
            const request = store.put(timeEntry);

            request.onsuccess = () => resolve(timeEntry);
            request.onerror = () => reject(request.error);
        });
    }

    async loadTimeEntries() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([TIME_ENTRIES_STORE], 'readonly');
            const store = transaction.objectStore(TIME_ENTRIES_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateTimeEntry(timeEntry) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([TIME_ENTRIES_STORE], 'readwrite');
            const store = transaction.objectStore(TIME_ENTRIES_STORE);
            const request = store.put(timeEntry);

            request.onsuccess = () => resolve(timeEntry);
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingEntries() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([TIME_ENTRIES_STORE], 'readonly');
            const store = transaction.objectStore(TIME_ENTRIES_STORE);
            const statusIndex = store.index('status');
            const request = statusIndex.getAll('pending');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // New methods for settings storage
    async saveSettings(settings) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE);
            const request = store.put({ id: 'user-settings', ...settings });

            request.onsuccess = () => resolve(settings);
            request.onerror = () => reject(request.error);
        });
    }

    async loadSettings() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
            const store = transaction.objectStore(SETTINGS_STORE);
            const request = store.get('user-settings');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new Database(); 