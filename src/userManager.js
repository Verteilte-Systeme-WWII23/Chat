import { v4 as uuidv4 } from "uuid";

const users = new Map(); // userId => { ws, name, ip }
const ipToUserId = new Map(); // ip => userId
users.set("AI", null);

export function addUser(ws, ip) {
  let userId = ipToUserId.get(ip);
  if (userId && users.has(userId)) {
    // Reconnect: Update ws
    users.get(userId).ws = ws;
    return userId;
  }
  // Neuer User
  userId = uuidv4();
  // Eindeutiger Name
  let name = `Gast_${userId.slice(0, 4)}`;
  // Stelle sicher, dass der Name systemweit eindeutig ist
  while ([...users.values()].some(u => u && u.name === name)) {
    name = `Gast_${uuidv4().slice(0, 4)}`;
  }
  users.set(userId, { ws, name, ip });
  ipToUserId.set(ip, userId);
  return userId;
}

export function removeUser(userId) {
  const user = users.get(userId);
  if (user && user.ip) ipToUserId.delete(user.ip);
  users.delete(userId);
}

export function setUserName(userId, name) {
  const user = users.get(userId);
  if (user) user.name = name;
}

export function getUser(userId) {
  return users.get(userId);
}

export function hasUser(userId) {
  return users.has(userId);
}

export function getAllUsers() {
  return users;
}

// Für Admin-Tool: IP sperren
const bannedIps = new Set();
const bannedUsers = new Set();

export function banIp(ip) {
  bannedIps.add(ip);
}
export function banUser(userId) {
  bannedUsers.add(userId);
}
export function isBanned(ip, userId) {
  return bannedIps.has(ip) || bannedUsers.has(userId);
}