import { db } from './db.js';
import { createNetsuiteAPI } from './netsuite-api.js';

// Application state
let state = {
    isOnline: navigator.onLine,
    projects: [],
    timeEntries: [],
    settings: {
        netsuiteUrl: 'https://5507085.app.netsuite.com',
        accountId: '5507085',
        username: '',
        password: ''
    },
    netsuiteAPI: null
};

// DOM Elements
const timeEntryForm = document.getElementById('timeEntryForm');
const projectSelect = document.getElementById('project');
const historyTableBody = document.getElementById('historyTableBody');
const settingsForm = document.getElementById('settingsForm');
const timeEntryTab = document.getElementById('timeEntryTab');
const historyTab = document.getElementById('historyTab');
const settingsTab = document.getElementById('settingsTab');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupOfflineDetection();
});

// Initialize application
async function initializeApp() {
    try {
        // Check for IndexedDB support
        if (!window.indexedDB) {
            throw new Error('Your browser doesn\'t support IndexedDB. Please use a modern browser.');
        }

        // Load settings from IndexedDB
        const savedSettings = await db.loadSettings();
        if (savedSettings) {
            state.settings = savedSettings;
            populateSettingsForm();
            
            // Initialize Netsuite API
            if (state.settings.netsuiteUrl && state.settings.accountId) {
                state.netsuiteAPI = createNetsuiteAPI(
                    state.settings.netsuiteUrl,
                    state.settings.accountId
                );
                await authenticateNetsuite();
            }
        }

        // Load time entries from IndexedDB
        state.timeEntries = await db.loadTimeEntries();

        // Update UI
        updateUI();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application. Please make sure you\'re using a supported browser and have enabled cookies.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    timeEntryForm.addEventListener('submit', handleTimeEntrySubmit);
    settingsForm.addEventListener('submit', handleSettingsSubmit);

    // Tab navigation
    timeEntryTab.addEventListener('click', () => switchTab('timeEntry'));
    historyTab.addEventListener('click', () => switchTab('history'));
    settingsTab.addEventListener('click', () => switchTab('settings'));
}

// Setup offline detection
function setupOfflineDetection() {
    window.addEventListener('online', () => {
        state.isOnline = true;
        updateUI();
        syncPendingEntries();
    });

    window.addEventListener('offline', () => {
        state.isOnline = false;
        updateUI();
        showOfflineIndicator();
    });
}

// Handle time entry submission
async function handleTimeEntrySubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(timeEntryForm);
    const timeEntry = {
        id: Date.now(),
        date: formData.get('date'),
        project: formData.get('project'),
        hours: parseFloat(formData.get('hours')),
        description: formData.get('description'),
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    try {
        // Save to IndexedDB
        await db.saveTimeEntry(timeEntry);
        
        // Update UI
        state.timeEntries.unshift(timeEntry);
        updateUI();
        
        // Clear form
        timeEntryForm.reset();
        
        // Sync if online
        if (state.isOnline) {
            await syncTimeEntry(timeEntry);
        }

        showSuccess('Time entry saved successfully');
    } catch (error) {
        console.error('Error saving time entry:', error);
        showError('Failed to save time entry');
    }
}

// Handle settings submission
async function handleSettingsSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(settingsForm);
    const newSettings = {
        netsuiteUrl: 'https://5507085.app.netsuite.com',
        accountId: '5507085',
        username: formData.get('username'),
        password: formData.get('password'),
        tba: {
            consumerKey: formData.get('consumerKey'),
            consumerSecret: formData.get('consumerSecret'),
            tokenId: formData.get('tokenId'),
            tokenSecret: formData.get('tokenSecret')
        }
    };

    try {
        // Initialize Netsuite API
        state.netsuiteAPI = createNetsuiteAPI(
            newSettings.netsuiteUrl,
            newSettings.accountId
        );

        // Set TBA credentials
        await state.netsuiteAPI.setTBACredentials(newSettings.tba);

        // Test authentication
        await state.netsuiteAPI.authenticate(
            newSettings.username,
            newSettings.password
        );

        // Save settings only after successful authentication
        await db.saveSettings(newSettings);
        state.settings = newSettings;

        // Load projects
        await loadProjects();
        
        showSuccess('Settings saved successfully');
        switchTab('timeEntry'); // Switch back to time entry tab after successful save
    } catch (error) {
        console.error('Error saving settings:', error);
        showError('Failed to save settings. Please make sure your Netsuite credentials are correct.');
    }
}

// Authenticate with Netsuite
async function authenticateNetsuite() {
    if (!state.netsuiteAPI || !state.settings.username || !state.settings.password) {
        return;
    }

    try {
        await state.netsuiteAPI.authenticate(
            state.settings.username,
            state.settings.password
        );
        await loadProjects();
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

// Load projects from Netsuite
async function loadProjects() {
    if (!state.netsuiteAPI) {
        return;
    }

    try {
        state.projects = await state.netsuiteAPI.getProjects();
        populateProjectSelect();
    } catch (error) {
        console.error('Error loading projects:', error);
        showError('Failed to load projects');
    }
}

// Sync time entry with Netsuite
async function syncTimeEntry(timeEntry) {
    if (!state.isOnline || !state.netsuiteAPI) {
        return;
    }

    try {
        await state.netsuiteAPI.submitTimeEntry(timeEntry);
        
        // Update status in IndexedDB
        timeEntry.status = 'submitted';
        await db.updateTimeEntry(timeEntry);
        
        // Update UI
        updateUI();
    } catch (error) {
        console.error('Error syncing time entry:', error);
        timeEntry.status = 'error';
        await db.updateTimeEntry(timeEntry);
        showError('Failed to sync time entry');
    }
}

// Sync all pending entries
async function syncPendingEntries() {
    const pendingEntries = await db.getPendingEntries();
    
    for (const entry of pendingEntries) {
        await syncTimeEntry(entry);
    }
}

// UI Updates
function updateUI() {
    updateHistoryTable();
    updateOfflineIndicator();
}

function updateHistoryTable() {
    historyTableBody.innerHTML = state.timeEntries
        .map(entry => `
            <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${getProjectName(entry.project)}</td>
                <td>${entry.hours}</td>
                <td>
                    <span class="status-badge status-${entry.status}">
                        ${entry.status}
                    </span>
                </td>
            </tr>
        `)
        .join('');
}

function updateOfflineIndicator() {
    const indicator = document.querySelector('.offline-indicator');
    if (indicator) {
        indicator.style.display = state.isOnline ? 'none' : 'block';
    }
}

// Helper functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function getProjectName(projectId) {
    const project = state.projects.find(p => p.id === parseInt(projectId));
    return project ? project.name : 'Unknown Project';
}

function populateProjectSelect() {
    projectSelect.innerHTML = `
        <option value="">Select Project</option>
        ${state.projects.map(project => `
            <option value="${project.id}">${project.name}</option>
        `).join('')}
    `;
}

function populateSettingsForm() {
    document.getElementById('username').value = state.settings.username;
    document.getElementById('password').value = state.settings.password;
    if (state.settings.tba) {
        document.getElementById('consumerKey').value = state.settings.tba.consumerKey;
        document.getElementById('consumerSecret').value = state.settings.tba.consumerSecret;
        document.getElementById('tokenId').value = state.settings.tba.tokenId;
        document.getElementById('tokenSecret').value = state.settings.tba.tokenSecret;
    }
}

function switchTab(tabName) {
    // Update active tab
    [timeEntryTab, historyTab, settingsTab].forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Show corresponding section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    document.getElementById(`${tabName}Section`).classList.remove('d-none');
}

// Notifications
function showSuccess(message) {
    // TODO: Implement toast notification
    alert(message);
}

function showError(message) {
    // TODO: Implement toast notification
    alert(message);
}

function showOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.textContent = 'You are offline. Changes will sync when you reconnect.';
    document.body.appendChild(indicator);
    indicator.style.display = 'block';
} 