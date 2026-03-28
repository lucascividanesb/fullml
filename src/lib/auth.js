import { cookies } from 'next/headers';
import db from './db';
import crypto from 'crypto';

const SESSION_COOKIE = 'magiiv_session';

/**
 * Handle OAuth login with ML payload
 */
export async function loginWithML(tokenData, userData) {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_COOKIE)?.value;

  let currentSystemUserId = null;

  // Verify if there is an active valid session
  if (existingSessionId) {
    const session = db.prepare('SELECT system_user_id FROM system_sessions WHERE id = ? AND expires_at > ?')
                      .get(existingSessionId, Date.now());
    if (session) {
      currentSystemUserId = session.system_user_id;
    }
  }

  // Check if this ML account already exists in the database
  const existingMlAccount = db.prepare('SELECT system_user_id FROM ml_accounts WHERE id = ?').get(userData.id);

  if (existingMlAccount) {
    // If the account exists, the user logging in MUST be logging into its owner system_user
    // If they already have a session, either they are the owner, or they are trying to hijack it - we enforce the owner.
    currentSystemUserId = existingMlAccount.system_user_id;
  } else {
    // Completely new ML Account. Do we link to current session or create a new user?
    if (!currentSystemUserId) {
      // Create new System User
      currentSystemUserId = crypto.randomUUID();
      db.prepare('INSERT INTO system_users (id, name, email, role) VALUES (?, ?, ?, ?)').run(
        currentSystemUserId, 
        userData.nickname || userData.first_name, 
        userData.email,
        'admin' // first account is admin
      );
    }
  }

  // Upsert the ML Account
  const stmt = db.prepare(`
    INSERT INTO ml_accounts (
      id, system_user_id, nickname, first_name, last_name, email, thumbnail, access_token, refresh_token, token_expires_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET 
      access_token=excluded.access_token,
      refresh_token=excluded.refresh_token,
      token_expires_at=excluded.token_expires_at,
      nickname=excluded.nickname,
      thumbnail=excluded.thumbnail
  `);

  stmt.run(
    userData.id,
    currentSystemUserId,
    userData.nickname,
    userData.first_name,
    userData.last_name,
    userData.email,
    userData.thumbnail?.picture_url || null,
    tokenData.access_token,
    tokenData.refresh_token,
    tokenData.expires_at
  );

  // Re-create session to extend it
  const newSessionId = crypto.randomUUID();
  const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
  
  db.prepare('INSERT INTO system_sessions (id, system_user_id, expires_at) VALUES (?, ?, ?)').run(
    newSessionId, currentSystemUserId, expiresAt
  );

  // Set Cookie
  cookieStore.set(SESSION_COOKIE, newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return currentSystemUserId;
}

/**
 * Get current logged in System User and their Session
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const row = db.prepare(`
    SELECT s.system_user_id as id, u.name, u.email, u.role
    FROM system_sessions s
    JOIN system_users u ON s.system_user_id = u.id
    WHERE s.id = ? AND s.expires_at > ?
  `).get(sessionId, Date.now());

  return row || null;
}

/**
 * Get ALL Mercado Livre accounts linked to the user
 */
export async function getUserAccounts(systemUserId) {
  return db.prepare('SELECT id, nickname, thumbnail, email, is_active FROM ml_accounts WHERE system_user_id = ?').all(systemUserId);
}

/**
 * Get a specific ML account with tokens for API calls
 */
export async function getAccountTokens(mlAccountId) {
  return db.prepare('SELECT access_token, refresh_token, token_expires_at FROM ml_accounts WHERE id = ?').get(mlAccountId);
}

/**
 * Generic getToken for backwards compatibility - returns the active account token
 * based on the magiiv_active_account cookie, falling back to the first one available.
 */
export async function getToken() {
  const user = await getSessionUser();
  if (!user) return null;
  const accounts = await getUserAccounts(user.id);
  if (!accounts || accounts.length === 0) return null;
  
  const cookieStore = await cookies();
  const activeAccountId = cookieStore.get('magiiv_active_account')?.value;
  
  let targetAccount = accounts[0];
  if (activeAccountId) {
    const matched = accounts.find(a => a.id === activeAccountId);
    if (matched) targetAccount = matched;
  }
  
  const tokens = await getAccountTokens(targetAccount.id);
  
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.token_expires_at,
    user_id: targetAccount.id
  };
}

/**
 * Logout
 */
export async function clearAuth() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    db.prepare('DELETE FROM system_sessions WHERE id = ?').run(sessionId);
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Token Check
 */
export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - 60000;
}
