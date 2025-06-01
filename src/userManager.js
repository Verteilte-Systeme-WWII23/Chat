import { v4 as uuidv4 } from "uuid";

const users = new Map();
users.set("AI", null);

export function addUser(ws) {
  const userId = uuidv4();
  users.set(userId, { ws, name: `Gast_${userId.slice(0, 4)}` });
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

export function hasUser(userId) {
  return users.has(userId);
}

export function getAllUsers() {
  return users;
}