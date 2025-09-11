//
// ⚠️ PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ⚠️
//
const firebaseConfig = {
  apiKey: "AIzaSyC26cS8NQ8wNIcaeyXpwYxoOfA5swqaWCg",
    authDomain: "listing-1fd01.firebaseapp.com",
    projectId: "listing-1fd01",
    storageBucket: "listing-1fd01.firebasestorage.app",
    messagingSenderId: "726586928413",
    appId: "1:726586928413:web:2bd29814aa1eb4454b85f4",
    measurementId: "G-K09B5RZ620"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const pages = document.querySelectorAll('.page');
const projectsPage = document.getElementById('projects-page');
const listingsPage = document.getElementById('listings-page');
const projectListContainer = document.getElementById('project-list-container');
const addProjectBtn = document.getElementById('add-project-btn');
const projectModal = document.getElementById('project-modal');
const createProjectForm = document.getElementById('create-project-form');
const newProjectNameInput = document.getElementById('new-project-name');

const backToProjectsBtn = document.getElementById('back-to-projects-btn');
const projectTitleHeader = document.getElementById('project-title-header');
const addListingBtn = document.getElementById('add-listing-btn');
const listingModal = document.getElementById('listing-modal');
const addListingForm = document.getElementById('add-listing-form');
const listingsTbody = document.getElementById('listings-tbody');

const closeButtons = document.querySelectorAll('.close-btn');

// State
let currentProjectId = null;

// --- Page Navigation ---
function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// --- Modals ---
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.classList.add('show');
    } else {
        modal.classList.remove('show');
    }
}

// --- Data Fetching and Rendering ---

async function fetchAndRenderProjects() {
    projectListContainer.innerHTML = ''; // Clear existing projects
    const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
        projectListContainer.innerHTML = '<p>No projects yet. Create one!</p>';
        return;
    }
    snapshot.forEach(doc => {
        const project = doc.data();
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.textContent = project.name;
        projectCard.dataset.id = doc.id;
        projectCard.addEventListener('click', () => {
            currentProjectId = doc.id;
            fetchAndRenderListings(doc.id, project.name);
        });
        projectListContainer.appendChild(projectCard);
    });
}

async function fetchAndRenderListings(projectId, projectName) {
    projectTitleHeader.textContent = projectName;
    showPage('listings-page');
    listingsTbody.innerHTML = ''; // Clear existing listings

    const snapshot = await db.collection('projects').doc(projectId).collection('listings').orderBy('createdAt', 'desc').get();

    let counter = snapshot.docs.length;
    snapshot.forEach(doc => {
        const listing = doc.data();
        const tr = document.createElement('tr');
        tr.dataset.id = doc.id;

        // MODIFIED: Render template updated to make fields editable and remove URL column
        tr.innerHTML = `
            <td data-label="No.">${counter}</td>
            <td data-label="Title"><a href="${listing.url}" target="_blank" rel="noopener noreferrer">${listing.title}</a></td>
            <td data-label="Owner No." contenteditable="true">${listing.ownerNo || ''}</td>
            <td data-label="Broker No." contenteditable="true">${listing.brokerNo || ''}</td>
            <td data-label="Price">${listing.price || '-'}</td>
            <td data-label="Selected">
                <input type="checkbox" ${listing.selected ? 'checked' : ''}>
            </td>
            <td data-label="Status">
                <select>
                    <option value="pending" ${listing.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="Reject" ${listing.status === 'Reject' ? 'selected' : ''}>Reject</option>
                    <option value="Discuss" ${listing.status === 'Discuss' ? 'selected' : ''}>Discuss</option>
                    <option value="Selected" ${listing.status === 'Selected' ? 'selected' : ''}>Selected</option>
                    
                </select>
            </td>
            <td data-label="Remarks" contenteditable="true">${listing.remarks || ''}</td>
        `;

        // Add event listeners for updates
        const checkbox = tr.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => updateListing(projectId, doc.id, { selected: e.target.checked }));

        const select = tr.querySelector('select');
        select.addEventListener('change', (e) => updateListing(projectId, doc.id, { status: e.target.value }));
        
        // MODIFIED: Event listeners for all editable cells
        const ownerNoCell = tr.querySelector('td[data-label="Owner No."]');
        ownerNoCell.addEventListener('blur', (e) => updateListing(projectId, doc.id, { ownerNo: e.target.innerText.trim() }));

        const brokerNoCell = tr.querySelector('td[data-label="Broker No."]');
        brokerNoCell.addEventListener('blur', (e) => updateListing(projectId, doc.id, { brokerNo: e.target.innerText.trim() }));
        
        const remarksCell = tr.querySelector('td[data-label="Remarks"]');
        remarksCell.addEventListener('blur', (e) => updateListing(projectId, doc.id, { remarks: e.target.innerText.trim() }));

        listingsTbody.appendChild(tr);
        counter--;
    });
}


// --- Data Manipulation (Create/Update) ---

async function createProject(projectName) {
    try {
        await db.collection('projects').add({
            name: projectName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toggleModal('project-modal', false);
        fetchAndRenderProjects();
    } catch (error) {
        console.error("Error adding project: ", error);
        alert("Could not add project.");
    }
}

async function createListing(projectId, listingData) {
    try {
        await db.collection('projects').doc(projectId).collection('listings').add({
            ...listingData,
            selected: false,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toggleModal('listing-modal', false);
        const projectName = projectTitleHeader.textContent;
        fetchAndRenderListings(projectId, projectName); // Refresh list
    } catch (error) {
        console.error("Error adding listing: ", error);
        alert("Could not add listing.");
    }
}

async function updateListing(projectId, listingId, dataToUpdate) {
    try {
        await db.collection('projects').doc(projectId).collection('listings').doc(listingId).update(dataToUpdate);
    } catch (error) {
        console.error("Error updating listing: ", error);
    }
}

// --- Event Listeners ---

addProjectBtn.addEventListener('click', () => toggleModal('project-modal', true));

createProjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectName = newProjectNameInput.value.trim();
    if (projectName) {
        createProject(projectName);
        createProjectForm.reset();
    }
});

addListingBtn.addEventListener('click', () => toggleModal('listing-modal', true));

addListingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newListing = {
        title: document.getElementById('listing-title').value.trim(),
        url: document.getElementById('listing-url').value.trim(),
        ownerNo: document.getElementById('listing-owner-no').value.trim(),
        brokerNo: document.getElementById('listing-broker-no').value.trim(),
        price: document.getElementById('listing-price').value.trim(),
        remarks: document.getElementById('listing-remarks').value.trim(),
    };
    if (newListing.title && newListing.url && currentProjectId) {
        createListing(currentProjectId, newListing);
        addListingForm.reset();
    }
});

backToProjectsBtn.addEventListener('click', () => {
    currentProjectId = null;
    showPage('projects-page');
    fetchAndRenderProjects();
});

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleModal(btn.dataset.modal, false);
    });
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderProjects();
    showPage('projects-page');
});
