// =====================================================
// PHASE 0 – PROJECT INITIALIZATION
// =====================================================

window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

let currentUser = null;

// Helper: Get auth header for protected API calls
function getAuthHeader() {
    const token = sessionStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// =====================================================
// PHASE 4 – STORAGE CONFIG
// =====================================================

const STORAGE_KEY = "ipt_demo_v1";

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            window.db = JSON.parse(data);
            // Ensure all accounts have proper structure
            window.db.accounts = window.db.accounts.map(acc => ({
                ...acc,
                verified: acc.verified || false
            }));
        } catch {
            seedDefaultData();
        }
    } else {
        seedDefaultData();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function seedDefaultData() {
    window.db = {
        accounts: [
            { 
                firstName: "Admin", 
                lastName: "User", 
                email: "admin@example.com", 
                password: "Password123!", 
                role: "admin", 
                verified: true 
            }
        ],
        departments: [
            { id: 1, name: "Engineering", description: "Tech Department" },
            { id: 2, name: "HR", description: "Human Resources" },
            { id: 3, name: "Marketing", description: "Marketing Team" }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

// =====================================================
// PHASE 8 – TOAST NOTIFICATIONS (UX IMPROVEMENT)
// =====================================================

function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// =====================================================
// PHASE 8 – LOADING STATES
// =====================================================

function showLoading(button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    return originalText;
}

function hideLoading(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
}

// =====================================================
// PHASE 8 – FORM VALIDATION
// =====================================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add('is-invalid');
    
    // Remove existing error message
    const existingError = input.nextElementSibling;
    if (existingError && existingError.classList.contains('invalid-feedback')) {
        existingError.remove();
    }
    
    // Add new error message
    const error = document.createElement('div');
    error.className = 'invalid-feedback';
    error.textContent = message;
    input.parentNode.appendChild(error);
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    input.classList.remove('is-invalid');
    
    const error = input.nextElementSibling;
    if (error && error.classList.contains('invalid-feedback')) {
        error.remove();
    }
}

function clearAllErrors() {
    document.querySelectorAll('.is-invalid').forEach(input => {
        input.classList.remove('is-invalid');
    });
    document.querySelectorAll('.invalid-feedback').forEach(error => {
        error.remove();
    });
}

// =====================================================
// PHASE 3 – AUTHENTICATION (UPDATED FOR BACKEND)
// =====================================================

function setAuthState(isAuthenticated, user = null) {
    const body = document.body;
    if (isAuthenticated && user) {
        currentUser = user;
        body.classList.remove("not-authenticated");
        body.classList.add("authenticated");
        if (user.role === "admin") {
            body.classList.add("is-admin");
        } else {
            body.classList.remove("is-admin");
        }
        const dropdown = document.querySelector(".dropdown-toggle");
        if (dropdown) dropdown.textContent = `${user.firstName} ${user.lastName}`;
        showToast(`Welcome, ${user.firstName}!`, 'success');
    } else {
        currentUser = null;
        body.classList.remove("authenticated", "is-admin");
        body.classList.add("not-authenticated");
    }
}

async function checkAuthOnLoad() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/profile', {  //Call /api/profile to get user role
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const fullUser = window.db.accounts.find(acc => acc.email === data.user.username);
            if (fullUser) {
                setAuthState(true, fullUser);
            }
        } else {
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// =====================================================
// PHASE 5 – PROFILE PAGE
// =====================================================

function renderProfile() {
    const profileDiv = document.getElementById("profileContent");
    if (!profileDiv || !currentUser) return;
    
    profileDiv.innerHTML = `
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Profile Information</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
                        <p><strong>Email:</strong> ${currentUser.email}</p>
                        <p><strong>Role:</strong> <span class="badge bg-${currentUser.role === 'admin' ? 'danger' : 'info'}">${currentUser.role}</span></p>
                        <p><strong>Status:</strong> <span class="badge bg-success">Verified</span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Member Since:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <button class="btn btn-warning mt-3" onclick="editProfile()">Edit Profile</button>
            </div>
        </div>
    `;
}

function editProfile() { 
    showToast("Edit Profile feature coming soon!", "info");
}

// =====================================================
// PHASE 6 – ADMIN FEATURES (CRUD)
// =====================================================

// ACCOUNTS MANAGEMENT
let editingAccountEmail = null;

function renderAccountsList() {
    const container = document.getElementById("accountsTableContainer");
    if (!container) return;

    let html = `<table class="table table-bordered table-hover">
        <thead class="table-dark">
            <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Actions</th>
            </tr>
        </thead><tbody>`;

    window.db.accounts.forEach((acc) => {
        html += `<tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td><span class="badge bg-${acc.role === 'admin' ? 'danger' : 'info'}">${acc.role}</span></td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editAccount('${acc.email}')">Edit</button>
                <button class="btn btn-sm btn-info" onclick="resetPassword('${acc.email}')">Reset PW</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount('${acc.email}')">Delete</button>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function openAccountForm(editEmail = null) {
    editingAccountEmail = editEmail;
    const container = document.getElementById("accountFormContainer");
    let account = { firstName: "", lastName: "", email: "", password: "", role: "user", verified: false };
    
    if (editEmail !== null) {
        account = window.db.accounts.find(a => a.email === editEmail);
    }

    container.innerHTML = `
        <div class="card p-3">
            <h5>${editEmail ? 'Edit' : 'Add'} Account</h5>
            <form onsubmit="saveAccount(event)">
                <div class="mb-2">
                    <input id="accFirstName" class="form-control" placeholder="First Name" value="${account.firstName}" required>
                </div>
                <div class="mb-2">
                    <input id="accLastName" class="form-control" placeholder="Last Name" value="${account.lastName}" required>
                </div>
                <div class="mb-2">
                    <input id="accEmail" type="email" class="form-control" placeholder="Email" value="${account.email}" ${editEmail ? 'readonly' : ''} required>
                </div>
                <div class="mb-2">
                    <input id="accPassword" type="password" class="form-control" placeholder="${editEmail ? 'Leave blank to keep current' : 'Password (min 6)'}" ${editEmail ? '' : 'required'}>
                </div>
                <div class="mb-2">
                    <select id="accRole" class="form-control">
                        <option value="user" ${account.role === "user" ? "selected" : ""}>User</option>
                        <option value="admin" ${account.role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </div>
                <div class="form-check mb-2">
                    <input id="accVerified" type="checkbox" class="form-check-input" ${account.verified ? "checked" : ""}>
                    <label class="form-check-label">Verified</label>
                </div>
                <button class="btn btn-success">Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeAccountForm()">Cancel</button>
            </form>
        </div>`;
}

function closeAccountForm() {
    document.getElementById("accountFormContainer").innerHTML = "";
    editingAccountEmail = null;
}

function saveAccount(event) {
    event.preventDefault();
    
    const email = document.getElementById('accEmail').value.trim();
    const firstName = document.getElementById('accFirstName').value.trim();
    const lastName = document.getElementById('accLastName').value.trim();
    const role = document.getElementById('accRole').value;
    const verified = document.getElementById('accVerified').checked;

    if (editingAccountEmail === null) {
        // New account
        const password = document.getElementById('accPassword').value;
        if (!password || password.length < 6) {
            showToast("Password must be at least 6 characters", "danger");
            return;
        }
        
        // Check if email already exists
        if (window.db.accounts.find(a => a.email === email)) {
            showToast("Email already exists", "danger");
            return;
        }
        
        window.db.accounts.push({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            role: role,
            verified: verified
        });
        showToast("Account created successfully!", "success");
    } else {
        // Edit existing
        const index = window.db.accounts.findIndex(a => a.email === editingAccountEmail);
        const password = document.getElementById('accPassword').value;
        
        window.db.accounts[index] = {
            ...window.db.accounts[index],
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
            verified: verified,
            password: password || window.db.accounts[index].password
        };
        showToast("Account updated successfully!", "success");
    }

    saveToStorage();
    renderAccountsList();
    closeAccountForm();
}

function editAccount(email) { 
    openAccountForm(email); 
}

function resetPassword(email) {
    const newPw = prompt("Enter new password (min 6 chars)");
    if (!newPw || newPw.length < 6) {
        showToast("Invalid password", "danger");
        return;
    }
    
    const account = window.db.accounts.find(a => a.email === email);
    account.password = newPw;
    saveToStorage();
    showToast("Password reset successfully!", "success");
}

function deleteAccount(email) {
    if (email === currentUser?.email) {
        showToast("Cannot delete yourself", "danger");
        return;
    }
    
    if (!confirm("Delete this account?")) return;
    
    window.db.accounts = window.db.accounts.filter(a => a.email !== email);
    saveToStorage();
    renderAccountsList();
    showToast("Account deleted successfully!", "info");
}

// DEPARTMENTS MANAGEMENT
let editingDeptId = null;

function renderDepartmentsTable() {
    const container = document.getElementById("departmentsTableContainer");
    if (!container) return;
    
    let html = `<table class="table table-bordered table-hover">
        <thead class="table-dark">
            <tr>
                <th>Name</th><th>Description</th><th>Actions</th>
            </tr>
        </thead><tbody>`;
    
    if (window.db.departments.length === 0) {
        html += `<tr><td colspan="3" class="text-center">No departments found</td></tr>`;
    } else {
        window.db.departments.forEach(d => { 
            html += `<tr>
                <td>${d.name}</td>
                <td>${d.description}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editDepartment(${d.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${d.id})">Delete</button>
                </td>
            </tr>`; 
        });
    }
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function openDepartmentForm(editId = null) {
    editingDeptId = editId;
    const container = document.getElementById("departmentFormContainer");
    let dept = { name: "", description: "" };
    
    if (editId !== null) {
        dept = window.db.departments.find(d => d.id === editId);
    }

    container.innerHTML = `
        <div class="card p-3">
            <h5>${editId ? 'Edit' : 'Add'} Department</h5>
            <form onsubmit="saveDepartment(event)">
                <div class="mb-2">
                    <input id="deptName" class="form-control" placeholder="Department Name" value="${dept.name}" required>
                </div>
                <div class="mb-2">
                    <textarea id="deptDesc" class="form-control" placeholder="Description" required>${dept.description}</textarea>
                </div>
                <button class="btn btn-success">Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeDepartmentForm()">Cancel</button>
            </form>
        </div>`;
}

function closeDepartmentForm() {
    document.getElementById("departmentFormContainer").innerHTML = "";
    editingDeptId = null;
}

function saveDepartment(event) {
    event.preventDefault();
    
    const name = document.getElementById('deptName').value.trim();
    const description = document.getElementById('deptDesc').value.trim();

    if (editingDeptId === null) {
        // Add new department
        const newId = window.db.departments.length > 0 
            ? Math.max(...window.db.departments.map(d => d.id)) + 1 
            : 1;
        
        window.db.departments.push({
            id: newId,
            name: name,
            description: description
        });
        showToast("Department added successfully!", "success");
    } else {
        // Edit existing
        const index = window.db.departments.findIndex(d => d.id === editingDeptId);
        window.db.departments[index] = {
            ...window.db.departments[index],
            name: name,
            description: description
        };
        showToast("Department updated successfully!", "success");
    }

    saveToStorage();
    renderDepartmentsTable();
    closeDepartmentForm();
}

function editDepartment(id) {
    openDepartmentForm(id);
}

function deleteDepartment(id) {
    if (!confirm("Delete this department?")) return;
    
    // Check if department is used by employees
    const isUsed = window.db.employees.some(e => e.deptId === id);
    if (isUsed) {
        showToast("Cannot delete department that has employees", "danger");
        return;
    }
    
    window.db.departments = window.db.departments.filter(d => d.id !== id);
    saveToStorage();
    renderDepartmentsTable();
    showToast("Department deleted successfully!", "info");
}

// EMPLOYEES MANAGEMENT
let editingEmployeeId = null;

function renderEmployeesTable() {
    const container = document.getElementById("employeesTableContainer");
    if (!container) return;
    
    let html = `<table class="table table-bordered table-hover">
        <thead class="table-dark">
            <tr>
                <th>ID</th><th>Email</th><th>Position</th><th>Department</th><th>Actions</th>
            </tr>
        </thead><tbody>`;
    
    if (window.db.employees.length === 0) {
        html += `<tr><td colspan="5" class="text-center">No employees found</td></tr>`;
    } else {
        window.db.employees.forEach(e => {
            const dept = window.db.departments.find(d => d.id === e.deptId);
            html += `<tr>
                <td>${e.employeeId}</td>
                <td>${e.userEmail}</td>
                <td>${e.position}</td>
                <td>${dept ? dept.name : "N/A"}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editEmployee('${e.employeeId}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${e.employeeId}')">Delete</button>
                </td>
            </tr>`;
        });
    }
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function openEmployeeForm(editId = null) {
    editingEmployeeId = editId;
    const container = document.getElementById("employeeFormContainer");
    const deptOptions = window.db.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
    
    let emp = { employeeId: "", userEmail: "", position: "", deptId: "", hireDate: "" };
    if (editId !== null) {
        emp = window.db.employees.find(e => e.employeeId === editId);
    }

    container.innerHTML = `
        <div class="card p-3">
            <h5>${editId ? 'Edit' : 'Add'} Employee</h5>
            <form onsubmit="saveEmployee(event)">
                <div class="mb-2">
                    <input id="empId" class="form-control" placeholder="Employee ID" value="${emp.employeeId}" ${editId ? 'readonly' : ''} required>
                </div>
                <div class="mb-2">
                    <input id="empEmail" class="form-control" placeholder="User Email" value="${emp.userEmail}" required>
                </div>
                <div class="mb-2">
                    <input id="empPosition" class="form-control" placeholder="Position" value="${emp.position}" required>
                </div>
                <div class="mb-2">
                    <select id="empDept" class="form-control" required>
                        <option value="">Select Department</option>
                        ${deptOptions}
                    </select>
                </div>
                <div class="mb-2">
                    <input id="empHireDate" type="date" class="form-control" value="${emp.hireDate}" required>
                </div>
                <button class="btn btn-success">Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeEmployeeForm()">Cancel</button>
            </form>
        </div>`;
    
    if (editId) document.getElementById('empDept').value = emp.deptId;
}

function closeEmployeeForm() {
    document.getElementById("employeeFormContainer").innerHTML = "";
    editingEmployeeId = null;
}

function saveEmployee(event) {
    event.preventDefault();
    
    const employeeId = document.getElementById('empId').value.trim();
    const email = document.getElementById('empEmail').value.trim();
    const position = document.getElementById('empPosition').value.trim();
    const deptId = parseInt(document.getElementById('empDept').value);
    const hireDate = document.getElementById('empHireDate').value;
    
    // Validate user exists
    const userExists = window.db.accounts.find(a => a.email === email);
    if (!userExists) {
        showToast("User email does not exist", "danger");
        return;
    }

    if (editingEmployeeId === null) {
        // Check if employee ID already exists
        if (window.db.employees.find(e => e.employeeId === employeeId)) {
            showToast("Employee ID already exists", "danger");
            return;
        }
        
        window.db.employees.push({
            employeeId: employeeId,
            userEmail: email,
            position: position,
            deptId: deptId,
            hireDate: hireDate
        });
        showToast("Employee added successfully!", "success");
    } else {
        // Edit existing
        const index = window.db.employees.findIndex(e => e.employeeId === editingEmployeeId);
        window.db.employees[index] = {
            employeeId: employeeId,
            userEmail: email,
            position: position,
            deptId: deptId,
            hireDate: hireDate
        };
        showToast("Employee updated successfully!", "success");
    }

    saveToStorage();
    renderEmployeesTable();
    closeEmployeeForm();
}

function editEmployee(employeeId) {
    openEmployeeForm(employeeId);
}

function deleteEmployee(employeeId) {
    if (!confirm("Delete this employee?")) return;
    window.db.employees = window.db.employees.filter(e => e.employeeId !== employeeId);
    saveToStorage();
    renderEmployeesTable();
    showToast("Employee deleted successfully!", "info");
}

// =====================================================
// PHASE 7 – USER REQUESTS
// =====================================================

let requestModal = null;

function openRequestModal() {
    clearAllErrors();
    document.getElementById('requestForm').reset();
    document.getElementById('itemsContainer').innerHTML = '';
    addItemRow();
    
    if (requestModal) {
        requestModal.show();
    }
}

function addItemRow() {
    const container = document.getElementById('itemsContainer');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row d-flex gap-2 mb-2';
    itemRow.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name" required>
        <input type="number" class="form-control" placeholder="Qty" min="1" value="1" required style="width: 100px">
        <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.item-row').remove()">×</button>
    `;
    container.appendChild(itemRow);
}

function saveRequest() {
    // Get form values
    const type = document.getElementById('requestType').value;
    
    // Validate type
    if (!type) {
        showToast('Please select a request type', 'danger');
        return;
    }
    
    // Get all items
    const itemRows = document.querySelectorAll('.item-row');
    const items = [];
    
    for (let row of itemRows) {
        const inputs = row.querySelectorAll('input');
        const itemName = inputs[0].value.trim();
        const quantity = parseInt(inputs[1].value);
        
        if (!itemName) {
            showToast('Please fill in all item names', 'danger');
            return;
        }
        
        if (itemName && quantity > 0) {
            items.push({
                name: itemName,
                qty: quantity
            });
        }
    }
    
    // Validate at least one item
    if (items.length === 0) {
        showToast('Please add at least one item', 'danger');
        return;
    }
    
    // Create request object
    const newRequest = {
        id: Date.now(),
        type: type,
        items: items,
        status: 'Pending',
        date: new Date().toISOString(),
        employeeEmail: currentUser.email
    };
    
    // Add to database
    if (!window.db.requests) {
        window.db.requests = [];
    }
    window.db.requests.push(newRequest);
    
    // Save to storage
    saveToStorage();
    
    // Close modal and refresh list
    requestModal.hide();
    renderRequestsList();
    
    showToast('Request submitted successfully!', 'success');
}

function renderRequestsList() {
    const container = document.getElementById('requestsTableContainer');
    if (!container) return;
    
    // Filter requests for current user
    const userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser?.email);
    
    if (userRequests.length === 0) {
        container.innerHTML = '<p class="text-muted">No requests found. Click "+ New Request" to create one.</p>';
        return;
    }
    
    let html = `<table class="table table-bordered table-hover">
        <thead class="table-dark">
            <tr>
                <th>Type</th>
                <th>Items</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>`;
    
    userRequests.forEach(request => {
        const itemsList = request.items.map(item => `${item.name} (x${item.qty})`).join(', ');
        
        let badgeClass = 'bg-warning';
        if (request.status === 'Approved') badgeClass = 'bg-success';
        if (request.status === 'Rejected') badgeClass = 'bg-danger';
        
        const date = new Date(request.date).toLocaleDateString();
        
        html += `<tr>
            <td><span class="badge bg-info">${request.type}</span></td>
            <td>${itemsList}</td>
            <td><span class="badge ${badgeClass}">${request.status}</span></td>
            <td>${date}</td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// =====================================================
// PHASE 2 – ROUTING SYSTEM (UPDATED FOR BACKEND)
// =====================================================

function navigateTo(hash){ window.location.hash = hash; }

function handleRouting(){
    let hash = window.location.hash || "#/";
    
    // PHASE 8 – ACCESS CONTROL TESTS (UPDATED FOR BACKEND)
    const protectedRoutes = ['#/profile', '#/requests', '#/employees', '#/accounts', '#/departments'];
    const adminRoutes = ['#/employees', '#/accounts', '#/departments'];
    
    // Check authentication using sessionStorage token
    const isAuthenticated = sessionStorage.getItem('authToken') !== null;
    
    if (protectedRoutes.includes(hash) && !isAuthenticated) {
        showToast('Please login first', 'warning');
        navigateTo('#/login');
        return;
    }
    
    if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
        showToast('Access denied: Admin only', 'danger');
        navigateTo('#/');
        return;
    }
    
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const map = {
        "#/": "home-page",
        "#/login": "login-page",
        "#/register": "register-page",
        "#/verify-email": "verify-email-page",
        "#/profile": "profile-page",
        "#/accounts": "accounts-page",
        "#/departments": "departments-page",
        "#/employees": "employees-page",
        "#/requests": "requests-page"
    };

    const pageId = map[hash] || "home-page";
    document.getElementById(pageId)?.classList.add("active");

    if(pageId === "profile-page") renderProfile();
    if(pageId === "accounts-page") renderAccountsList();
    if(pageId === "departments-page") renderDepartmentsTable();
    if(pageId === "employees-page") renderEmployeesTable();
    if(pageId === "requests-page") renderRequestsList();
}

// =====================================================
// PHASE 3 – REGISTER / LOGIN / LOGOUT (UPDATED FOR BACKEND)
// =====================================================

async function registerUser(event) {
    event.preventDefault();
    
    clearAllErrors();
    
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    // Validation
    let isValid = true;
    
    if (!firstName) {
        showFieldError('regFirstName', 'First name is required');
        isValid = false;
    }
    
    if (!lastName) {
        showFieldError('regLastName', 'Last name is required');
        isValid = false;
    }
    
    if (!email) {
        showFieldError('regEmail', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('regEmail', 'Please enter a valid email');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('regPassword', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('regPassword', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Call backend API
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password, role: 'user' })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        // Also save to local db for frontend data
        window.db.accounts.push({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            role: "user",
            verified: true
        });
        saveToStorage();
        
        showToast("Registration successful! You can now login.", "success");
        navigateTo("#/login");
    } catch (error) {
        showToast(error.message, "danger");
    }
}

function verifyEmail(){
    const email = localStorage.getItem("unverified_email");
    const user = window.db.accounts.find(a => a.email === email);
    if(user) { 
        user.verified = true; 
        saveToStorage(); 
        showToast("Email verified successfully! You can now login.", "success");
    }
    localStorage.removeItem("unverified_email");
    navigateTo("#/login");
}

async function loginUser(event) {
    event.preventDefault();
    
    clearAllErrors();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validation
    let isValid = true;
    
    if (!email) {
        showFieldError('loginEmail', 'Email is required');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('loginPassword', 'Password is required');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Call backend API
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store token in sessionStorage
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        // Find full user in local db
        const user = window.db.accounts.find(a => a.email === data.user.username);
        
        if (user) {
            setAuthState(true, user);
            navigateTo("#/profile");
        } else {
            throw new Error('User data not found');
        }
    } catch (error) {
        showToast(error.message, "danger");
    }
}

function logoutUser() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    setAuthState(false);
    showToast("Logged out successfully", "info");
    navigateTo("#/");
}

// =====================================================
// PHASE 8 – TEST SCENARIO HELPERS
// =====================================================

// Test 1: Register → verify → login → view profile (already implemented)

// Test 2: Log in as admin → create new user → log out → log in as new user
function testCreateNewUser() {
    if (currentUser?.role !== 'admin') {
        showToast('Please login as admin first', 'warning');
        return;
    }
    
    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        role: 'user',
        verified: true
    };
    
    window.db.accounts.push(testUser);
    saveToStorage();
    showToast(`Test user created: ${testUser.email}`, 'success');
}

// Test 3: Submit a request → see it in "My Requests" (already implemented)

// Test 4: Refresh browser → data persists (handled by localStorage)

// =====================================================
// INIT
// =====================================================

window.addEventListener("DOMContentLoaded", ()=>{
    loadFromStorage();
    checkAuthOnLoad();
    handleRouting();
    
    // Initialize request modal
    const modalElement = document.getElementById('requestModal');
    if (modalElement) {
        requestModal = new bootstrap.Modal(modalElement);
    }
    
    showToast('App loaded successfully!', 'info');
});

window.addEventListener("hashchange", handleRouting);