import { authService } from '../services/authService';

interface JWTPayload {
  sub?: string;
  email?: string;
  role?: string;
  tier?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodifica un JWT sin verificar la firma (solo para leer claims)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Un JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    
    // Reemplazar caracteres especiales de URL-safe base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decodificar de base64
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Obtiene el payload del token actual
 */
export function getCurrentTokenPayload(): JWTPayload | null {
  const token = authService.getToken();
  if (!token) {
    return null;
  }
  return decodeJWT(token);
}

/**
 * Verifica si el usuario actual tiene un rol específico
 */
export function hasRole(role: string): boolean {
  const payload = getCurrentTokenPayload();
  if (!payload || !payload.role) {
    return false;
  }
  
  // El rol puede venir en diferentes formatos:
  // - "Admin" o "SuperAdmin" 
  // - "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin"
  const userRole = typeof payload.role === 'string' 
    ? payload.role 
    : payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    
  return userRole === role;
}

/**
 * Verifica si el usuario actual es Admin o SuperAdmin
 */
export function isAdmin(): boolean {
  const payload = getCurrentTokenPayload();
  if (!payload) {
    return false;
  }
  
  // Buscar el rol en diferentes posibles ubicaciones del JWT
  let role = 
    payload.role || 
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    '';
  
  // El rol puede venir como string o array
  const roleStr = Array.isArray(role) ? role[0] : (typeof role === 'string' ? role : '');
  return roleStr === 'Admin' || roleStr === 'SuperAdmin';
}

/**
 * Obtiene el rol del usuario actual
 */
export function getUserRole(): string | null {
  const payload = getCurrentTokenPayload();
  if (!payload) {
    return null;
  }
  
  const role = 
    payload.role || 
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    null;
  
  // El rol puede venir como string o array
  return Array.isArray(role) ? role[0] : (typeof role === 'string' ? role : null);
}

/**
 * Verifica si el token ha expirado
 */
export function isTokenExpired(): boolean {
  const payload = getCurrentTokenPayload();
  if (!payload || !payload.exp) {
    return true;
  }
  
  // exp está en segundos, Date.now() en milisegundos
  return payload.exp * 1000 < Date.now();
}
