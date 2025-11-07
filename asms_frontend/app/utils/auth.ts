// utils/auth.ts
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Try both storage locations
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.token || null;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return localStorage.getItem('jwtToken');
  }
  return null;
};

export const setToken = (token: string, userData?: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwtToken', token);
    if (userData) {
      localStorage.setItem('user', JSON.stringify({ ...userData, token }));
    }
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
  }
};

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }
  return null;
};