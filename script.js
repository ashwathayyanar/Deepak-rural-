class ClinicSystem {
    constructor() {
        this.storageKey = 'clinicPatients';
        this.currentPatients = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPatients();
        this.showNotification('Rural Clinic System loaded! Data is stored in your browser.', 'success');
    }

    bindEvents() {
        // Form submission
        document.getElementById('patientForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPatient();
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePatient();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadPatients();
            this.showNotification('Patient list refreshed!', 'success');
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterPatients(e.target.value);
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.filterPatients('');
        });

        // Quick actions
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.openImportModal();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Modal events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('cancelImport').addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('confirmImport').addEventListener('click', () => {
            this.importData();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    // Data Management
    getPatients() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    savePatients(patients) {
        localStorage.setItem(this.storageKey, JSON.stringify(patients));
        this.currentPatients = patients;
    }

    loadPatients() {
        const patients = this.getPatients();
        this.currentPatients = patients;
        this.displayPatients(patients);
        this.updateStats(patients);
    }

    // Display Functions
    displayPatients(patients) {
        const tableBody = document.getElementById('patientsTableBody');
        const noPatients = document.getElementById('noPatients');

        if (patients.length === 0) {
            tableBody.innerHTML = '';
            document.querySelector('.patients-table').style.display = 'none';
            noPatients.style.display = 'block';
            return;
        }

        document.querySelector('.patients-table').style.display = 'table';
        noPatients.style.display = 'none';

        tableBody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.id}</td>
                <td>${this.escapeHtml(patient.name)}</td>
                <td>${patient.age}</td>
                <td>${this.escapeHtml(patient.disease)}</td>
                <td>${new Date(patient.created_at).toLocaleDateString()}</td>
                <td class="actions">
                    <button class="btn btn-edit" onclick="clinicSystem.openEditModal(${patient.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="clinicSystem.deletePatient(${patient.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterPatients(searchTerm) {
        if (!searchTerm) {
            this.displayPatients(this.currentPatients);
            return;
        }

        const filtered = this.currentPatients.filter(patient => 
            patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.disease.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.displayPatients(filtered);
    }

    updateStats(patients) {
        document.getElementById('totalPatients').textContent = patients.length;
        
        const averageAge = patients.length > 0 
            ? Math.round(patients.reduce((sum, patient) => sum + patient.age, 0) / patients.length)
            : 0;
        document.getElementById('averageAge').textContent = averageAge;
    }

    // Patient CRUD Operations
    addPatient() {
        const form = document.getElementById('patientForm');
        const formData = new FormData(form);
        
        const patientData = {
            id: Date.now(), // Simple unique ID
            name: formData.get('name').trim(),
            age: parseInt(formData.get('age')),
            disease: formData.get('disease').trim(),
            created_at: new Date().toISOString()
        };

        // Validation
        if (!this.validatePatient(patientData)) {
            return;
        }

        const patients = this.getPatients();
        patients.unshift(patientData); // Add to beginning for newest first
        this.savePatients(patients);
        
        this.showNotification('Patient added successfully!', 'success');
        form.reset();
        this.loadPatients();
    }

    validatePatient(patient) {
        if (!patient.name || patient.name.trim().length < 2) {
            this.showNotification('Please enter a valid name (at least 2 characters)', 'error');
            return false;
        }

        if (isNaN(patient.age) || patient.age < 0 || patient.age > 120) {
            this.showNotification('Please enter a valid age (0-120)', 'error');
            return false;
        }

        if (!patient.disease || patient.disease.trim().length < 2) {
            this.showNotification('Please enter a valid disease/condition', 'error');
            return false;
        }

        return true;
    }

    openEditModal(id) {
        const patient = this.currentPatients.find(p => p.id === id);
        if (!patient) return;

        document.getElementById('editId').value = patient.id;
        document.getElementById('editName').value = patient.name;
        document.getElementById('editAge').value = patient.age;
        document.getElementById('editDisease').value = patient.disease;
        
        document.getElementById('editModal').style.display = 'block';
    }

    updatePatient() {
        const id = parseInt(document.getElementById('editId').value);
        const formData = new FormData(document.getElementById('editForm'));
        
        const patientData = {
            id: id,
            name: formData.get('name').trim(),
            age: parseInt(formData.get('age')),
            disease: formData.get('disease').trim()
        };

        if (!this.validatePatient(patientData)) {
            return;
        }

        const patients = this.getPatients();
        const patientIndex = patients.findIndex(p => p.id === id);
        
        if (patientIndex === -1) {
            this.showNotification('Patient not found!', 'error');
            return;
        }

        // Preserve creation date
        patientData.created_at = patients[patientIndex].created_at;
        
        patients[patientIndex] = patientData;
        this.savePatients(patients);
        
        this.showNotification('Patient updated successfully!', 'success');
        this.closeAllModals();
        this.loadPatients();
    }

    deletePatient(id) {
        if (!confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
            return;
        }

        const patients = this.getPatients();
        const filteredPatients = patients.filter(patient => patient.id !== id);
        this.savePatients(filteredPatients);
        
        this.showNotification('Patient deleted successfully!', 'success');
        this.loadPatients();
    }

    // Data Import/Export
    exportData() {
        const patients = this.getPatients();
        const dataStr = JSON.stringify(patients, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clinic-patients-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Patient data exported successfully!', 'success');
    }

    openImportModal() {
        document.getElementById('importData').value = '';
        document.getElementById('importModal').style.display = 'block';
    }

    importData() {
        const importData = document.getElementById('importData').value.trim();
        
        if (!importData) {
            this.showNotification('Please paste patient data to import', 'error');
            return;
        }

        try {
            const parsedData = JSON.parse(importData);
            
            if (!Array.isArray(parsedData)) {
                throw new Error('Imported data must be an array of patients');
            }

            // Validate each patient
            for (const patient of parsedData) {
                if (!patient.name || !patient.age || !patient.disease) {
                    throw new Error('Invalid patient data structure');
                }
            }

            this.savePatients(parsedData);
            this.showNotification(`Successfully imported ${parsedData.length} patients!`, 'success');
            this.closeAllModals();
            this.loadPatients();
            
        } catch (error) {
            this.showNotification('Invalid data format. Please check your JSON data.', 'error');
            console.error('Import error:', error);
        }
    }

    clearAllData() {
        if (!confirm('⚠️ WARNING: This will delete ALL patient records permanently. This action cannot be undone!')) {
            return;
        }

        if (!confirm('Are you absolutely sure? All patient data will be lost forever.')) {
            return;
        }

        localStorage.removeItem(this.storageKey);
        this.showNotification('All patient data has been cleared.', 'success');
        this.loadPatients();
    }

    // Utility Functions
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.clinicSystem = new ClinicSystem();
    console.log('🏥 Rural Clinic Patient Record System initialized with local storage');
});
