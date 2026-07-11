const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "CFS2026@";
const LOGIN_KEY = "cfsAdminLoggedIn";

export function isAdminLoggedIn() {
  return sessionStorage.getItem(LOGIN_KEY) === "true";
}

export function protectAdminPage() {
  if (!isAdminLoggedIn()) {
    window.location.replace("login.html");
  }
}

export function loginAdmin(username, password) {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");

  if (
    cleanUsername === ADMIN_USERNAME &&
    cleanPassword === ADMIN_PASSWORD
  ) {
    sessionStorage.setItem(LOGIN_KEY, "true");
    return true;
  }

  return false;
}

export function logoutAdmin() {
  sessionStorage.removeItem(LOGIN_KEY);
  window.location.replace("login.html");
}

export function redirectLoggedInAdmin() {
  if (isAdminLoggedIn()) {
    window.location.replace("dashboard.html");
  }
                               }
