const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function createBoardApi(payload) {
  const res = await fetch(`${API_BASE}/api/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create whiteboard');
  }
  return data;
}

export async function getBoardApi(roomId) {
  const res = await fetch(`${API_BASE}/api/boards/${roomId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to retrieve whiteboard');
  }
  return data;
}

export async function saveBoardApi(roomId, payload) {
  const res = await fetch(`${API_BASE}/api/boards/${roomId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to save whiteboard');
  }
  return data;
}

// Real-Time HTTP Synchronization APIs
export async function syncBoardApi(roomId, payload) {
  try {
    const res = await fetch(`${API_BASE}/api/boards/${roomId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addBoardOperationApi(roomId, element) {
  try {
    const res = await fetch(`${API_BASE}/api/boards/${roomId}/operation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ element })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function undoBoardOperationApi(roomId) {
  try {
    const res = await fetch(`${API_BASE}/api/boards/${roomId}/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function clearBoardElementsApi(roomId) {
  try {
    const res = await fetch(`${API_BASE}/api/boards/${roomId}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// User Authentication APIs
export async function registerApi(payload) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

export async function loginApi(payload) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

// Personal Saved Snapshots APIs
export async function saveSnapshotApi(payload) {
  const res = await fetch(`${API_BASE}/api/auth/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to save snapshot');
  }
  return data;
}

export async function getMySnapshotsApi(email) {
  const res = await fetch(`${API_BASE}/api/auth/snapshots?email=${encodeURIComponent(email)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to retrieve snapshots');
  }
  return data;
}

export async function deleteSnapshotApi(payload) {
  const res = await fetch(`${API_BASE}/api/auth/snapshots`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete snapshot');
  }
  return data;
}
