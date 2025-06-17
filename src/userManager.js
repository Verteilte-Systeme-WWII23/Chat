import { v4 as uuidv4 } from "uuid";

const users = new Map();
users.set("AI", null);
/*
{
  ws:  WebSocket-Objekt,
  name: "Gast_ab12" oder ein gesetzter Name
  ip: "127.0.0.1" oder die echte IP-Adresse des Nutzers
}
*/
const bannedIps = new Set();

export function addUser(ws, ip) {
  const userId = uuidv4();
  const name = `Default_${userId.slice(0, 4)}`;
  users.set(userId, { ws, name, ip });
  return userId;
}

export function removeUser(userId) {
  users.delete(userId);
}

export function setUserName(userId, name) {
  const user = users.get(userId);
  if (user) user.name = name;
}

export function getUser(userId) {
  return users.get(userId);
}

export function getAllUsers() {
  return users;
}

export function getUserName(userId) {
  const user = users.get(userId);
  return { name: user ? user.name : null, id: userId };
}

export function getBannedIps() {
  return bannedIps;
}

export function banIp(ip) {
  if(bannedIps.has(ip)) return; 

  bannedIps.add(ip);
  for (const [id, user] of users.entries()) {
    if (!user) continue;
    if (user.ip === ip) {
      user.ws.close();
      user.ws = null;
    }
  }
}

export function isBanned(ip) {
  return bannedIps.has(ip);
}

export function unBanIp(ip) {
  bannedIps.delete(ip);
}