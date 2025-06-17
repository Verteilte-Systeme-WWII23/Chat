
let adminPassword = '';

// Login-Handling
document.getElementById('login-btn').addEventListener('click', () => {
  const password = document.getElementById('password').value;
  if (!password) {
    document.getElementById('login-error').textContent = 'Bitte gib ein Passwort ein';
    return;
  }

  adminPassword = password;
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-section').style.display = 'block';

  // Lade Daten nach erfolgreicher Anmeldung
  refreshAllData();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  adminPassword = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('admin-section').style.display = 'none';
});

// Event-Listener für Aktualisierungsbutton
document.getElementById('refresh-all').addEventListener('click', refreshAllData);

// Aktualisiert alle Daten
async function refreshAllData() {
  const tablesContainer = document.getElementById('tables-container');
  tablesContainer.classList.add('loading');
  
  try {
    await Promise.all([loadUsers(), loadBannedUsers()]);
  } finally {
    tablesContainer.classList.remove('loading');
  }
}

// Lädt aktive Benutzer
async function loadUsers() {
  const usersTbody = document.getElementById('users-tbody');
  
  try {
    // Lade zuerst die gebannten Benutzer
    const bannedResponse = await fetch('/admin/banned-ips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: adminPassword })
    });
    
    if (!bannedResponse.ok) {
      throw new Error('Konnte gebannte Benutzer nicht laden');
    }
    
    const bannedUsers = await bannedResponse.json();
    const bannedIps = bannedUsers.map(user => user.ip);
    
    // Dann lade die aktiven Benutzer
    const response = await fetch('/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: adminPassword })
    });
    
    if (!response.ok) {
      throw new Error('Konnte Benutzerdaten nicht laden');
    }
    
    const users = await response.json();
    
    // Filtere gebannte Benutzer aus der aktiven Liste
    const activeUsers = users.filter(user => !bannedIps.includes(user.ip));
    
    if (activeUsers.length === 0) {
      usersTbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">Keine aktiven Benutzer vorhanden</td>
        </tr>
      `;
      return;
    }
    
    usersTbody.innerHTML = activeUsers.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.name || 'Unbenannt'}</td>
        <td>${user.ip || 'Unbekannt'}</td>
        <td>
          ${user.id !== 'AI' ?
            `<button class="ban-btn" data-ip="${user.ip}">Sperren</button>` :
            '-'}
        </td>
      </tr>
    `).join('');
    
    // Event-Listener für Ban-Buttons
    usersTbody.querySelectorAll('.ban-btn').forEach(btn => {
      btn.addEventListener('click', () => banUser(btn.dataset.ip));
    });
    
  } catch (error) {
    usersTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Fehler beim Laden: ${error.message}</td>
      </tr>
    `;
  }
}

// Lädt gesperrte Benutzer
async function loadBannedUsers() {
  const bannedTbody = document.getElementById('banned-tbody');

  try {
    const response = await fetch('/admin/banned-ips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: adminPassword })
    });

    if (!response.ok) {
      throw new Error('Konnte gesperrte Benutzer nicht laden');
    }

    const bannedUsers = await response.json();

    if (bannedUsers.length === 0) {
      bannedTbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">Keine gesperrten Benutzer vorhanden</td>
        </tr>
      `;
      return;
    }

    bannedTbody.innerHTML = bannedUsers.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.name || 'Unbenannt'}</td>
        <td>${user.ip || 'Unbekannt'}</td>
        <td>
          <button class="unban-btn" data-ip="${user.ip}">Entsperren</button>
        </td>
      </tr>
    `).join('');

    // Event-Listener für Unban-Buttons
    bannedTbody.querySelectorAll('.unban-btn').forEach(btn => {
      btn.addEventListener('click', () => unbanUser(btn.dataset.ip));
    });

  } catch (error) {
    bannedTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Fehler beim Laden: ${error.message}</td>
      </tr>
    `;
  }
}

// Sperrt einen Benutzer anhand seiner IP
async function banUser(ip) {
  if (!ip) return;

  try {
    const response = await fetch('/admin/ban/ip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: adminPassword,
        ip
      })
    });

    if (!response.ok) {
      throw new Error('Konnte Benutzer nicht sperren');
    }

    // Lade beide Listen neu
    refreshAllData();

  } catch (error) {
    alert(`Fehler: ${error.message}`);
  }
}

// Entsperrt einen Benutzer anhand seiner IP
async function unbanUser(ip) {
  if (!ip) return;

  try {
    const response = await fetch('/admin/unban/ip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: adminPassword,
        ip
      })
    });

    if (!response.ok) {
      throw new Error('Konnte Benutzer nicht entsperren');
    }

    // Lade beide Listen neu
    refreshAllData();

  } catch (error) {
    alert(`Fehler: ${error.message}`);
  }
}
