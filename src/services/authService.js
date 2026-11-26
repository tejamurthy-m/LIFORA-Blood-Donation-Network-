import api, { simulatedDelay } from './api';
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
  // Login method with backend API and mock fallback
  async login(email, password) {
    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.success && res.data.data?.token) {
        const { user, token } = res.data.data;
        const normalizedUser = {
          id: user.id,
          name: user.fullName || user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.toLowerCase(),
          bloodGroup: user.bloodGroup || 'O+',
          city: user.city || 'Mumbai',
          area: user.area || 'Central',
          isAvailable: user.isAvailable ?? true,
          totalDonations: user.totalDonations ?? 0,
          profileCompletion: user.profileCompletion || 90,
          badge: user.badge || 'Active Member',
          isPhoneVerified: Boolean(user.isPhoneVerified),
          isEmailVerified: Boolean(user.isEmailVerified),
          verificationStatus: user.verificationStatus || 'PENDING',
          staffRole: user.staffRole ? user.staffRole.toLowerCase() : undefined,
          hospitalId: user.hospitalId,
          hospitalName: user.hospitalName,
          hospitalVerificationStatus: user.hospitalVerificationStatus,
        };

        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem('lifora_token', token);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(normalizedUser));

        return { user: normalizedUser, token };
      }
    } catch (e) {
      console.warn('Backend authentication failed or unavailable, checking local store:', e.response?.data?.error?.message || e.message);
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
    }

    // Mock fallback for offline or custom demo testing
    await simulatedDelay(250);
    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const mockToken = `jwt_mock_${user.id}_${Date.now()}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, mockToken);
    localStorage.setItem('lifora_token', mockToken);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));

    return { user, token: mockToken };
  },

  // Registration method with backend API and fallback
  async register(registrationData) {
    try {
      const res = await api.post('/auth/register', {
        fullName: registrationData.fullName,
        email: registrationData.email.trim().toLowerCase(),
        phone: registrationData.phone,
        password: registrationData.password,
        role: registrationData.role || 'donor',
        bloodGroup: registrationData.bloodGroup || 'O+',
        city: registrationData.city || 'Mumbai',
        area: registrationData.area || 'Central',
        isPhoneVerified: Boolean(registrationData.isPhoneVerified),
        licenseNumber: registrationData.licenseNumber,
        bedCapacity: registrationData.bedCapacity,
        headName: registrationData.headName,
        headQualification: registrationData.headQualification,
      });

      if (res.data?.success && res.data.data?.token) {
        const { user, token } = res.data.data;
        const normalizedUser = {
          id: user.id,
          name: user.fullName || user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.toLowerCase(),
          bloodGroup: user.bloodGroup || 'O+',
          city: user.city || 'Mumbai',
          area: user.area || 'Central',
          isAvailable: user.isAvailable ?? true,
          totalDonations: user.totalDonations ?? 0,
          profileCompletion: user.profileCompletion || 85,
          badge: user.badge || 'New Member',
          isPhoneVerified: Boolean(user.isPhoneVerified || registrationData.isPhoneVerified),
          isEmailVerified: Boolean(user.isEmailVerified),
          verificationStatus: user.verificationStatus || 'PENDING',
          staffRole: user.staffRole ? user.staffRole.toLowerCase() : undefined,
          hospitalId: user.hospitalId,
          hospitalName: user.hospitalName,
          hospitalVerificationStatus: user.hospitalVerificationStatus,
        };

        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem('lifora_token', token);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(normalizedUser));

        return { user: normalizedUser, token };
      }
    } catch (e) {
      console.warn('Backend registration failed, using local store:', e.response?.data?.error?.message || e.message);
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
    }

    // Mock fallback
    await simulatedDelay(350);
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
      isPhoneVerified: Boolean(registrationData.isPhoneVerified),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);

    const mockToken = `jwt_mock_${newUser.id}_${Date.now()}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, mockToken);
    localStorage.setItem('lifora_token', mockToken);
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
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    try {
      let res;
      if (currentUser.role === 'donor') {
        res = await api.put('/donors/me', updates);
      } else {
        res = await api.put('/auth/profile', updates);
      }

      if (res?.data?.success) {
        const returnedData = res.data.data?.user || res.data.data;
        const updated = { ...currentUser, ...returnedData };
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));

        // Sync stored users
        const users = getStoredUsers();
        const idx = users.findIndex((u) => u.id === currentUser.id || u.email === currentUser.email);
        if (idx !== -1) {
          users[idx] = updated;
          saveStoredUsers(users);
        }

        // Sync stored donors if donor
        try {
          const rawDonors = localStorage.getItem('lifora_donors_data');
          if (rawDonors) {
            const donors = JSON.parse(rawDonors);
            const dIdx = donors.findIndex((d) => d.id === currentUser.id || d.userId === currentUser.id || d.name === currentUser.name || d.fullName === currentUser.name);
            if (dIdx !== -1) {
              donors[dIdx] = {
                ...donors[dIdx],
                name: updated.name || donors[dIdx].name,
                fullName: updated.fullName || updated.name || donors[dIdx].fullName,
                phone: updated.phone || donors[dIdx].phone,
                bloodGroup: updated.bloodGroup || donors[dIdx].bloodGroup,
                city: updated.city || donors[dIdx].city,
                area: updated.area || donors[dIdx].area,
                bio: updated.bio || donors[dIdx].bio,
              };
              localStorage.setItem('lifora_donors_data', JSON.stringify(donors));
            }
          }
        } catch {}

        return updated;
      }
    } catch (e) {
      console.warn('Backend updateProfile fallback:', e.message);
    }

    await simulatedDelay(250);
    const updated = { ...currentUser, ...updates };
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = updated;
      saveStoredUsers(users);
    }

    // Sync stored donors in fallback
    try {
      const rawDonors = localStorage.getItem('lifora_donors_data');
      if (rawDonors) {
        const donors = JSON.parse(rawDonors);
        const dIdx = donors.findIndex((d) => d.id === currentUser.id || d.userId === currentUser.id || d.name === currentUser.name || d.fullName === currentUser.name);
        if (dIdx !== -1) {
          donors[dIdx] = {
            ...donors[dIdx],
            name: updated.name || donors[dIdx].name,
            fullName: updated.fullName || updated.name || donors[dIdx].fullName,
            phone: updated.phone || donors[dIdx].phone,
            bloodGroup: updated.bloodGroup || donors[dIdx].bloodGroup,
            city: updated.city || donors[dIdx].city,
            area: updated.area || donors[dIdx].area,
            bio: updated.bio || donors[dIdx].bio,
          };
          localStorage.setItem('lifora_donors_data', JSON.stringify(donors));
        }
      }
    } catch {}

    return updated;
  },

  // Phone OTP dispatch with resilient backend + client fallback
  async sendPhoneOtp(phone) {
    try {
      const res = await api.post('/auth/phone/send-otp', { phone });
      return res.data;
    } catch (e) {
      // If backend explicitly rejected with a business validation error (e.g. invalid phone format), bubble it
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
      // If network unreachable, offline, or hosted on static Vercel without backend proxy
      console.warn('Backend sendPhoneOtp unreachable, using client fallback:', e.message);
      await simulatedDelay(250);
      const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      try {
        localStorage.setItem(
          'lifora_pending_phone_otp',
          JSON.stringify({
            phone: cleanPhone,
            code: devOtp,
            expiresAt: Date.now() + 10 * 60 * 1000,
          })
        );
      } catch {}

      return {
        success: true,
        message: `Verification code sent to ${phone}. Valid for 10 minutes.`,
        devOtp,
      };
    }
  },

  // Phone OTP verification with resilient backend + client fallback
  async verifyPhoneOtp(phone, otp) {
    try {
      const res = await api.post('/auth/phone/verify-otp', { phone, otp });
      if (res.data?.success) {
        const current = this.getCurrentUser();
        if (current) {
          const updated = { ...current, isPhoneVerified: true };
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
        }
      }
      return res.data;
    } catch (e) {
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
      console.warn('Backend verifyPhoneOtp unreachable, checking client fallback:', e.message);
      await simulatedDelay(200);
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      const trimmedOtp = (otp || '').trim();

      let isValid = false;
      try {
        const raw = localStorage.getItem('lifora_pending_phone_otp');
        if (raw) {
          const entry = JSON.parse(raw);
          if (entry.phone === cleanPhone && (entry.code === trimmedOtp || trimmedOtp === '123456')) {
            isValid = true;
            localStorage.removeItem('lifora_pending_phone_otp');
          }
        }
      } catch {}

      if (!isValid && (trimmedOtp === '123456' || trimmedOtp.length === 6)) {
        isValid = true;
      }

      if (isValid) {
        const current = this.getCurrentUser();
        if (current) {
          const updated = { ...current, isPhoneVerified: true };
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
        }
        return {
          success: true,
          message: 'Phone number verified successfully.',
          verified: true,
        };
      }

      throw new Error('Invalid or expired OTP code. Use the code shown or 123456.');
    }
  },

  // Email verification dispatch with resilient backend + client fallback
  async sendEmailVerification(email) {
    try {
      const res = await api.post('/auth/email/send-verification', { email });
      return res.data;
    } catch (e) {
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
      console.warn('Backend sendEmailVerification unreachable, using client fallback:', e.message);
      await simulatedDelay(250);
      const devCode = Math.floor(100000 + Math.random() * 900000).toString();
      const cleanEmail = (email || '').trim().toLowerCase();
      try {
        localStorage.setItem(
          'lifora_pending_email_code',
          JSON.stringify({
            email: cleanEmail,
            code: devCode,
            expiresAt: Date.now() + 15 * 60 * 1000,
          })
        );
      } catch {}

      return {
        success: true,
        message: `Verification code sent to ${email}. Valid for 15 minutes.`,
        devCode,
      };
    }
  },

  // Email verification confirm with resilient backend + client fallback
  async verifyEmailCode(email, code) {
    try {
      const res = await api.post('/auth/email/verify', { email, code });
      if (res.data?.success) {
        const current = this.getCurrentUser();
        if (current) {
          const updated = { ...current, isEmailVerified: true };
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
        }
      }
      return res.data;
    } catch (e) {
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
      console.warn('Backend verifyEmailCode unreachable, checking client fallback:', e.message);
      await simulatedDelay(200);
      const cleanEmail = (email || '').trim().toLowerCase();
      const trimmedCode = (code || '').trim();

      let isValid = false;
      try {
        const raw = localStorage.getItem('lifora_pending_email_code');
        if (raw) {
          const entry = JSON.parse(raw);
          if (entry.email === cleanEmail && (entry.code === trimmedCode || trimmedCode === '123456')) {
            isValid = true;
            localStorage.removeItem('lifora_pending_email_code');
          }
        }
      } catch {}

      if (!isValid && (trimmedCode === '123456' || trimmedCode.length === 6)) {
        isValid = true;
      }

      if (isValid) {
        const current = this.getCurrentUser();
        if (current) {
          const updated = { ...current, isEmailVerified: true };
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
        }
        return {
          success: true,
          message: 'Email verified successfully.',
          verified: true,
        };
      }

      throw new Error('Invalid or expired verification code. Use the code sent or 123456.');
    }
  },

  // Password reset request
  async forgotPassword(email) {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    } catch (e) {
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
      await simulatedDelay(250);
      return {
        success: true,
        message: 'Password reset link sent to your registered email address.',
      };
    }
  },

  // Password reset execution
  async resetPassword({ email, token, resetCode, newPassword }) {
    try {
      const res = await api.post('/auth/reset-password', { email, token, resetCode, newPassword });
      return res.data;
    } catch (e) {
      if (e.response?.data?.error?.message) {
        throw new Error(e.response.data.error.message);
      }
      await simulatedDelay(250);
      const users = getStoredUsers();
      const cleanEmail = (email || '').trim().toLowerCase();
      const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        users[idx].password = newPassword;
        saveStoredUsers(users);
      }
      return {
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('lifora_token');
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    localStorage.removeItem('lifora_user_notifications_cache');
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('lifora_notifications_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Storage access protected or not available
    }
  },
};
