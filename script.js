// Application data storage (in real app, this would be a database)
let applications = [];
let projects = [];
let selectedTeams = [];

// Generate unique application ID
function generateApplicationId() {
    return 'APP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage if available
    loadData();
    updateStats();
    
    // Allow Enter key to trigger check
    document.getElementById('check-application-id').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkSelection();
        }
    });

    // Limit member fields to 4
    const membersContainer = document.getElementById('members-container');
    const addBtn = document.querySelector('.add-member-btn');
    if (membersContainer.children.length >= 4) {
        addBtn.style.display = 'none';
    }
});

// Add member field
function addMemberField() {
    const container = document.getElementById('members-container');
    if (container.children.length >= 4) {
        alert('Maximum 4 team members allowed');
        return;
    }
    
    const memberDiv = document.createElement('div');
    memberDiv.className = 'member-input';
    const memberNum = container.children.length + 1;
    memberDiv.innerHTML = `
        <input type="text" class="member-name" placeholder="Member ${memberNum} Name" required>
        <input type="email" class="member-email" placeholder="Member ${memberNum} Email" required>
        <button type="button" class="remove-member-btn" onclick="removeMemberField(this)">×</button>
    `;
    container.appendChild(memberDiv);
    
    if (container.children.length >= 4) {
        document.querySelector('.add-member-btn').style.display = 'none';
    }
}

// Remove member field
function removeMemberField(btn) {
    const container = document.getElementById('members-container');
    if (container.children.length <= 2) {
        alert('Minimum 2 team members required');
        return;
    }
    btn.parentElement.remove();
    document.querySelector('.add-member-btn').style.display = 'block';
    updateMemberPlaceholders();
}

// Update member placeholders
function updateMemberPlaceholders() {
    const members = document.querySelectorAll('.member-name');
    members.forEach((input, index) => {
        input.placeholder = `Member ${index + 1} Name`;
        input.nextElementSibling.placeholder = `Member ${index + 1} Email`;
    });
}

// Submit team application
function submitApplication(event) {
    event.preventDefault();
    
    const teamName = document.getElementById('team-name').value.trim();
    const teamLeadEmail = document.getElementById('team-lead-email').value.trim().toLowerCase();
    const teamLeadName = document.getElementById('team-lead-name').value.trim();
    const teamLeadPhone = document.getElementById('team-lead-phone').value.trim();
    const experience = document.getElementById('team-experience').value;
    
    // Get team members
    const memberInputs = document.querySelectorAll('.member-input');
    const members = [];
    memberInputs.forEach(memberDiv => {
        const name = memberDiv.querySelector('.member-name').value.trim();
        const email = memberDiv.querySelector('.member-email').value.trim().toLowerCase();
        if (name && email) {
            members.push({ name, email });
        }
    });
    
    // Validation
    if (members.length < 2) {
        showApplicationResult('Please add at least 2 team members.', 'error');
        return;
    }
    
    if (members.length > 4) {
        showApplicationResult('Maximum 4 team members allowed.', 'error');
        return;
    }
    
    // Check if team name already exists
    if (applications.some(app => app.teamName.toLowerCase() === teamName.toLowerCase())) {
        showApplicationResult('Team name already exists. Please choose a different name.', 'error');
        return;
    }
    
    // Check if email already used
    const allEmails = [teamLeadEmail, ...members.map(m => m.email)];
    const duplicateEmail = applications.some(app => 
        app.teamLeadEmail === teamLeadEmail || 
        app.members.some(m => allEmails.includes(m.email))
    );
    
    if (duplicateEmail) {
        showApplicationResult('One or more team members have already applied with another team.', 'error');
        return;
    }
    
    // Create application
    const applicationId = generateApplicationId();
    const application = {
        id: applicationId,
        teamName,
        teamLeadName,
        teamLeadEmail,
        teamLeadPhone,
        members,
        experience,
        status: 'pending', // pending, selected, rejected
        submittedAt: new Date().toISOString()
    };
    
    applications.push(application);
    saveData();
    updateStats();
    
    // Show success message
    showApplicationResult(
        `🎉 Application submitted successfully!<br><br>
        <strong>Your Application ID: ${applicationId}</strong><br>
        Please save this ID to check your status and submit your project.`,
        'success'
    );
    
    // Reset form
    document.getElementById('team-application-form').reset();
    const membersContainer = document.getElementById('members-container');
    while (membersContainer.children.length > 2) {
        membersContainer.removeChild(membersContainer.lastChild);
    }
    document.querySelector('.add-member-btn').style.display = 'block';
    updateMemberPlaceholders();
}

// Submit project
function submitProject(event) {
    event.preventDefault();
    
    const applicationId = document.getElementById('application-id').value.trim();
    const projectName = document.getElementById('project-name').value.trim();
    const projectTheme = document.getElementById('project-theme').value;
    const description = document.getElementById('project-description').value.trim();
    const techStack = document.getElementById('tech-stack').value.trim();
    const projectLink = document.getElementById('project-link').value.trim();
    
    // Find application
    const application = applications.find(app => app.id === applicationId);
    if (!application) {
        showProjectResult('Application ID not found. Please check your ID and try again.', 'error');
        return;
    }
    
    // Check if project already submitted
    if (projects.some(p => p.applicationId === applicationId)) {
        showProjectResult('Project already submitted for this application.', 'error');
        return;
    }
    
    // Create project
    const project = {
        applicationId,
        teamName: application.teamName,
        projectName,
        projectTheme,
        description,
        techStack,
        projectLink,
        submittedAt: new Date().toISOString()
    };
    
    projects.push(project);
    saveData();
    updateStats();
    
    showProjectResult('🎉 Project submitted successfully! We will review your project soon.', 'success');
    document.getElementById('project-form').reset();
}

// Check selection status
function checkSelection() {
    const input = document.getElementById('check-application-id').value.trim();
    const resultContainer = document.getElementById('result-container');
    const resultMessage = document.getElementById('result-message');
    const applicationDetails = document.getElementById('application-details');
    
    if (!input) {
        showResult('Please enter your Application ID or Team Name.', 'error');
        return;
    }
    
    // Find application by ID or team name
    const application = applications.find(app => 
        app.id.toUpperCase() === input.toUpperCase() || 
        app.teamName.toLowerCase() === input.toLowerCase()
    );
    
    if (!application) {
        showResult('Application not found. Please check your Application ID or Team Name.', 'error');
        applicationDetails.classList.add('hidden');
        return;
    }
    
    // Find project if submitted
    const project = projects.find(p => p.applicationId === application.id);
    
    // Display results
    let statusHTML = '';
    let statusClass = '';
    
    if (application.status === 'selected') {
        statusHTML = '🎉 <strong>CONGRATULATIONS! You have been SELECTED!</strong> 🎉';
        statusClass = 'success';
    } else if (application.status === 'rejected') {
        statusHTML = '❌ Unfortunately, your application was not selected this time.';
        statusClass = 'error';
    } else {
        statusHTML = '⏳ Your application is under review. We will notify you soon.';
        statusClass = 'pending';
    }
    
    showResult(statusHTML, statusClass);
    
    // Show application details
    let detailsHTML = `
        <div class="detail-section">
            <h3>Application Details</h3>
            <p><strong>Application ID:</strong> ${application.id}</p>
            <p><strong>Team Name:</strong> ${application.teamName}</p>
            <p><strong>Team Lead:</strong> ${application.teamLeadName} (${application.teamLeadEmail})</p>
            <p><strong>Team Members:</strong> ${application.members.length}</p>
            <p><strong>Experience Level:</strong> ${application.experience.charAt(0).toUpperCase() + application.experience.slice(1)}</p>
            <p><strong>Status:</strong> <span class="status-badge ${application.status}">${application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span></p>
            <p><strong>Submitted:</strong> ${new Date(application.submittedAt).toLocaleDateString()}</p>
        </div>
    `;
    
    if (project) {
        detailsHTML += `
            <div class="detail-section">
                <h3>Project Details</h3>
                <p><strong>Project Name:</strong> ${project.projectName}</p>
                <p><strong>Theme:</strong> ${project.projectTheme.charAt(0).toUpperCase() + project.projectTheme.slice(1)}</p>
                <p><strong>Tech Stack:</strong> ${project.techStack}</p>
                <p><strong>Description:</strong> ${project.description}</p>
                ${project.projectLink ? `<p><strong>Link:</strong> <a href="${project.projectLink}" target="_blank">${project.projectLink}</a></p>` : ''}
            </div>
        `;
    } else {
        detailsHTML += `
            <div class="detail-section">
                <p class="no-project">⚠️ No project submitted yet. Please submit your project details.</p>
            </div>
        `;
    }
    
    applicationDetails.innerHTML = detailsHTML;
    applicationDetails.classList.remove('hidden');
    
    // Clear input
    document.getElementById('check-application-id').value = '';
}

// Show result message
function showResult(message, type) {
    const resultContainer = document.getElementById('result-container');
    const resultMessage = document.getElementById('result-message');
    
    resultContainer.classList.remove('hidden', 'success', 'error', 'pending');
    resultContainer.classList.add(type);
    resultMessage.innerHTML = message;
    
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show application result
function showApplicationResult(message, type) {
    const resultContainer = document.getElementById('application-result');
    resultContainer.classList.remove('hidden', 'success', 'error');
    resultContainer.classList.add(type);
    resultContainer.innerHTML = message;
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show project result
function showProjectResult(message, type) {
    const resultContainer = document.getElementById('project-result');
    resultContainer.classList.remove('hidden', 'success', 'error');
    resultContainer.classList.add(type);
    resultContainer.innerHTML = message;
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Update statistics
function updateStats() {
    document.getElementById('total-applications').textContent = applications.length;
    document.getElementById('total-projects').textContent = projects.length;
    document.getElementById('total-selected').textContent = applications.filter(app => app.status === 'selected').length;
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('hackathon_applications', JSON.stringify(applications));
    localStorage.setItem('hackathon_projects', JSON.stringify(projects));
    localStorage.setItem('hackathon_selected', JSON.stringify(selectedTeams));
}

// Load data from localStorage
function loadData() {
    const savedApplications = localStorage.getItem('hackathon_applications');
    const savedProjects = localStorage.getItem('hackathon_projects');
    const savedSelected = localStorage.getItem('hackathon_selected');
    
    if (savedApplications) {
        applications = JSON.parse(savedApplications);
    }
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    }
    if (savedSelected) {
        selectedTeams = JSON.parse(savedSelected);
    }
}

// Admin function to select teams (for demonstration)
function selectTeam(applicationId) {
    const application = applications.find(app => app.id === applicationId);
    if (application) {
        application.status = 'selected';
        selectedTeams.push(applicationId);
        saveData();
        updateStats();
        return true;
    }
    return false;
}

// Admin function to reject teams
function rejectTeam(applicationId) {
    const application = applications.find(app => app.id === applicationId);
    if (application) {
        application.status = 'rejected';
        saveData();
        updateStats();
        return true;
    }
    return false;
}
