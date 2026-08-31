/**
 * SuperLeeK Hub - Authentication & Access Control System
 */

// SHA-256 Helper using Web Crypto API
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Default Password Hash (Default: 'superleek123')
// SHA-256 of 'superleek123': 2e604fdf80907adceca1faec6291a2eb3511eb080b0fb6c4ea5eef72ed58ee58
const DEFAULT_PASSWORD_HASH = "2e604fdf80907adceca1faec6291a2eb3511eb080b0fb6c4ea5eef72ed58ee58";

export class AuthManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem("auth_password_hash")) {
      localStorage.setItem("auth_password_hash", DEFAULT_PASSWORD_HASH);
    }
    if (!localStorage.getItem("access_mode")) {
      localStorage.setItem("access_mode", "public"); // Default: 'public'
    }
  }

  // Get current access mode ('public' or 'private')
  getAccessMode() {
    return localStorage.getItem("access_mode") || "public";
  }

  // Set access mode ('public' or 'private')
  setAccessMode(mode) {
    if (mode === "public" || mode === "private") {
      localStorage.setItem("access_mode", mode);
      return true;
    }
    return false;
  }

  // Check if currently logged in
  isLoggedIn() {
    return localStorage.getItem("auth_session_active") === "true";
  }

  // Login attempt with raw password
  async login(password) {
    const inputHash = await hashPassword(password);
    const storedHash = localStorage.getItem("auth_password_hash") || DEFAULT_PASSWORD_HASH;

    if (inputHash === storedHash) {
      localStorage.setItem("auth_session_active", "true");
      return { success: true };
    }
    return { success: false, message: "비밀번호가 올바르지 않습니다." };
  }

  // Logout
  logout() {
    localStorage.removeItem("auth_session_active");
  }

  // Change Password
  async changePassword(currentPassword, newPassword) {
    const currentHash = await hashPassword(currentPassword);
    const storedHash = localStorage.getItem("auth_password_hash") || DEFAULT_PASSWORD_HASH;

    if (currentHash !== storedHash) {
      return { success: false, message: "현재 비밀번호가 일치하지 않습니다." };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: "새 비밀번호는 최소 4자리 이상이어야 합니다." };
    }

    const newHash = await hashPassword(newPassword);
    localStorage.setItem("auth_password_hash", newHash);
    return { success: true, message: "비밀번호가 성공적으로 변경되었습니다." };
  }

  // Guard page for Private mode
  guardPage(onAccessDenied) {
    const mode = this.getAccessMode();
    const loggedIn = this.isLoggedIn();

    if (mode === "private" && !loggedIn) {
      if (typeof onAccessDenied === "function") {
        onAccessDenied();
      }
      return false;
    }
    return true;
  }
}

export const auth = new AuthManager();
