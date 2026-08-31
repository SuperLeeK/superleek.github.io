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

export class AuthManager {
  constructor() {
    this.init();
  }

  // Get active expected password hash (Prioritizes secret injected via GitHub Actions)
  getExpectedHash() {
    if (window.DASHBOARD_PASSWORD_HASH && window.DASHBOARD_PASSWORD_HASH.trim() !== "") {
      return window.DASHBOARD_PASSWORD_HASH.trim();
    }
    return localStorage.getItem("auth_password_hash") || "";
  }

  init() {
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
    const expectedHash = this.getExpectedHash();
    if (!expectedHash) {
      return {
        success: false,
        message: "설정된 관리자 비밀번호가 없습니다. GitHub Secret을 확인하세요.",
      };
    }

    const inputHash = await hashPassword(password);
    if (inputHash === expectedHash) {
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
    const expectedHash = this.getExpectedHash();
    const currentHash = await hashPassword(currentPassword);

    if (currentHash !== expectedHash) {
      return { success: false, message: "현재 비밀번호가 일치하지 않습니다." };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: "새 비밀번호는 최소 4자리 이상이어야 합니다." };
    }

    const newHash = await hashPassword(newPassword);
    localStorage.setItem("auth_password_hash", newHash);
    window.DASHBOARD_PASSWORD_HASH = newHash; // Update runtime in-memory hash
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
