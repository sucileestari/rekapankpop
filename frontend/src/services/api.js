const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function getAssetUrl(path) {
  if (!path || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('rekap_token');
  let body = options.body;
  const headers = {
    ...options.headers
  };

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
    body
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Request gagal.');
  }

  return data;
}

export const api = {
  login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: payload
  });
},
  getMembers(search = '') {
    return request(`/members?search=${encodeURIComponent(search)}`);
  },
  addMember(payload) {
    return request('/members', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateMember(memberId, payload) {
    return request(`/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deleteMember(memberId) {
    return request(`/members/${memberId}`, {
      method: 'DELETE'
    });
  },
  getMemberTransactions(memberId) {
    return request(`/members/${memberId}/transactions`);
  },
  addMemberTransaction(memberId, payload) {
    return request(`/members/${memberId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getRecapBatches(country) {
    return request(`/recaps/${country}/batches`);
  },
  getRecapCategories() {
    return request('/recaps/categories');
  },
  addRecapCategory(payload) {
    return request('/recaps/categories', {
      method: 'POST',
      body: payload
    });
  },
  updateRecapCategory(categoryId, payload) {
    return request(`/recaps/categories/${categoryId}`, {
      method: 'PUT',
      body: payload
    });
  },
  deleteRecapCategory(categoryId) {
    return request(`/recaps/categories/${categoryId}`, {
      method: 'DELETE'
    });
  },
  addRecapBatch(country, payload) {
    return request(`/recaps/${country}/batches`, {
      method: 'POST',
      body: payload
    });
  },
  deleteRecapBatch(country, batchId) {
    return request(`/recaps/${country}/batches/${batchId}`, {
      method: 'DELETE'
    });
  },
  getRecapTransactions(country) {
    return request(`/recaps/${country}/transactions`);
  },
  addRecapTransaction(country, payload) {
    return request(`/recaps/${country}/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateRecapTransaction(country, transactionId, payload) {
    return request(`/recaps/${country}/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  settleRecapTransaction(country, transactionId) {
    return request(`/recaps/${country}/transactions/${transactionId}/settle`, {
      method: 'PATCH'
    });
  },
  submitDpPayment(country, transactionId, payload) {
    return request(`/recaps/${country}/transactions/${transactionId}/dp-payment`, {
      method: 'PATCH',
      body: payload
    });
  },
  submitSettlementPayment(country, transactionId, payload) {
    return request(`/recaps/${country}/transactions/${transactionId}/settlement-payment`, {
      method: 'PATCH',
      body: payload
    });
  },
  reviewPayment(country, transactionId, payload) {
    return request(`/recaps/${country}/transactions/${transactionId}/review-payment`, {
      method: 'PATCH',
      body: payload
    });
  },
  deleteRecapTransaction(country, transactionId) {
    return request(`/recaps/${country}/transactions/${transactionId}`, {
      method: 'DELETE'
    });
  },
  cleanDatabase() {
    return request('/admin/clean-database', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },
  getUsers() {
    return request('/admin/users');
  },
  addUser(payload) {
    return request('/admin/users', {
      method: 'POST',
      body: payload
    });
  },
  updateUser(userId, payload) {
    return request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: payload
    });
  },
  deleteUser(userId) {
    return request(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },
  getRolePermissions() {
    return request('/admin/role-permissions');
  },
  addRolePermission(payload) {
    return request('/admin/role-permissions', {
      method: 'POST',
      body: payload
    });
  },
  updateRolePermission(permissionId, payload) {
    return request(`/admin/role-permissions/${permissionId}`, {
      method: 'PUT',
      body: payload
    });
  },
  getCoProofs() {
    return request('/co-proofs');
  },
  addCoProof(formData) {
    return request('/co-proofs', {
      method: 'POST',
      body: formData
    });
  }
};
