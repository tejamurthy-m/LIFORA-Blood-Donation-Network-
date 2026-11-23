import { simulatedDelay } from './api';
export { default as api } from './api';
import { INITIAL_USERS } from './mockData';

const USERS_STORAGE_KEY = 'lifora_registered_users';
const CURRENT_USER_STORAGE_KEY = 'lifora_current_user';
const TOKEN_STORAGE_KEY = 'lifora_auth_token';

// Ensure seed users are loaded into localStorage on initial run
export const getStoredUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed = JSON.parse(stored);
    // Ensure seed users (like hospital accounts) are present
    const existingEmails = new Set(parsed.map((u) => u.email.toLowerCase()));
    let hasNew = false;
    INITIAL_USERS.forEach((initUser) => {
      if (!existingEmails.has(initUser.email.toLowerCase())) {
        parsed.push(initUser);
        hasNew = true;
      }
    });
    if (hasNew) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
};

export const saveStoredUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authService = {
  // Login method with mock fallback
  async login(email, password) {
    await simulatedDelay(450);

    try {
      // If backend is active:
      // const res = await api.post('/auth/login', { email, password });
      // return res.data;
    } catch (e) {
      console.warn('Backend unavailable, using mock auth:', e);
    }

    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    // In demo mode, standard sample password is any valid 6+ chars or matches role
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Set mock token and session
    const mockToken = `jwt_mock_${user.id}_${Date.now()}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, mockToken);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));

    return { user, token: mockToken };
  },

  // Registration method
  async register(registrationData) {
    await simulatedDelay(500);

    const users = getStoredUsers();
    const existing = users.find(
      (u) => u.email.toLowerCase() === registrationData.email.trim().toLowerCase()
    );

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: registrationData.fullName,
      email: registrationData.email.trim().toLowerCase(),
      phone: registrationData.phone,
      role: registrationData.role || 'donor',
      bloodGroup: registrationData.bloodGroup || 'O+',
      city: registrationData.city || 'Mumbai',
      area: registrationData.area || 'Central',
      isAvailable: true,
      totalDonations: 0,
      profileCompletion: 80,
      badge: 'New Member',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);

    const mockToken = `jwt_mock_${newUser.id}_${Date.now()}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, mockToken);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));

    return { user: newUser, token: mockToken };
  },

  // Get currently logged-in user
  getCurrentUser() {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Update profile
  async updateProfile(updates) {
    await simulatedDelay(350);
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    const updated = { ...currentUser, ...updates };
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));

    // Also update in all users list
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = updated;
      saveStoredUsers(users);
    }

    return updated;
  },

  // Logout
  logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  },
};
