import { config } from '../config/env.js';

export function adminAuth(req, res, next) {
  try {
    const { password } = req.body || {};
    if (!password || password !== config.adminPassword) {
      return res.status(401).json({ error: "Falsches Passwort" });
    }
    next();
  } catch (error) {
    return res.status(400).json({ error: "Ungültige Request" });
  }
}