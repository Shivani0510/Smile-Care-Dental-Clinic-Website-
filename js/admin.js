document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const loginFeedback = document.getElementById('login-feedback');
  const dashboardFeedback = document.getElementById('dashboard-feedback');
  const tableBody = document.getElementById('appointments-body');
  const emptyState = document.getElementById('empty-state');
  const statusFilter = document.getElementById('status-filter');
  const refreshBtn = document.getElementById('refresh-btn');
  const logoutBtn = document.getElementById('logout-btn');

  const TOKEN_KEY = 'smilecare_admin_token';

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function showFeedback(el, message, type) {
    el.textContent = message;
    el.className = `form-feedback show ${type}`;
  }

  function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    loadAppointments();
  }

  function showLogin() {
    dashboardView.hidden = true;
    loginView.hidden = false;
  }

  async function authFetch(url, options = {}) {
    const token = getToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      clearToken();
      showLogin();
      showFeedback(loginFeedback, 'Session expired. Please log in again.', 'error');
      throw new Error('Unauthorized');
    }
    return res;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function renderRows(appointments) {
    tableBody.innerHTML = '';
    emptyState.hidden = appointments.length > 0;

    appointments.forEach((appt) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(appt.name)}</td>
        <td>${escapeHtml(appt.email)}<br>${escapeHtml(appt.phone)}</td>
        <td>${escapeHtml(appt.service)}</td>
        <td>${formatDate(appt.preferredDate)}</td>
        <td>${escapeHtml(appt.message || '—')}</td>
        <td><span class="status-badge status-${appt.status}">${appt.status}</span></td>
        <td class="row-actions">
          <select data-id="${appt._id}" class="status-select">
            <option value="pending" ${appt.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${appt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${appt.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${appt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <button data-id="${appt._id}" class="delete-btn">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  async function loadAppointments() {
    try {
      const status = statusFilter.value;
      const url = `${API_BASE_URL}/appointments${status ? `?status=${status}` : ''}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load appointments');
      renderRows(data.data);
      dashboardFeedback.className = 'form-feedback';
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showFeedback(dashboardFeedback, err.message, 'error');
      }
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginFeedback.className = 'form-feedback';

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showFeedback(loginFeedback, data.message || 'Login failed', 'error');
        return;
      }

      setToken(data.token);
      loginForm.reset();
      showDashboard();
    } catch (err) {
      showFeedback(loginFeedback, 'Could not reach the server.', 'error');
    }
  });

  tableBody.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('status-select')) return;
    const id = e.target.dataset.id;
    const status = e.target.value;
    try {
      const res = await authFetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      loadAppointments();
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showFeedback(dashboardFeedback, err.message, 'error');
      }
    }
  });

  tableBody.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-btn')) return;
    if (!confirm('Delete this appointment permanently?')) return;
    const id = e.target.dataset.id;
    try {
      const res = await authFetch(`${API_BASE_URL}/appointments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete appointment');
      loadAppointments();
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showFeedback(dashboardFeedback, err.message, 'error');
      }
    }
  });

  refreshBtn.addEventListener('click', loadAppointments);
  statusFilter.addEventListener('change', loadAppointments);
  logoutBtn.addEventListener('click', () => {
    clearToken();
    showLogin();
  });

  // Auto-login if a token already exists in this browser tab
  if (getToken()) {
    showDashboard();
  }
});
