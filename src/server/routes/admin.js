import express from 'express';
import { getAllUsers, getBannedIps, banIp, unBanIp } from '../managers/userManager.js';
import { adminAuth } from '../middleware/auth.js';
import { validateIP } from '../middleware/validation.js';

const router = express.Router();

router.use(express.json());
router.use(adminAuth);

router.post("/users", async (req, res) => {
  try {
    const users = [];
    for (const [id, user] of getAllUsers().entries()) {
      if (user) {
        users.push({ id, name: user.name, ip: user.ip });
      }
    }
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: "Fehler beim Laden der Benutzer" });
  }
});

router.post("/banned-ips", async (req, res) => {
  try {
    const bannedUserIps = [];
    const users = getAllUsers();
    const bannedIps = Array.from(getBannedIps());

    users.forEach((user, id) => {
      if (user && bannedIps.includes(user.ip)) {
        bannedUserIps.push({ id, name: user.name, ip: user.ip });
      }
    });

    res.json(bannedUserIps);
  } catch (error) {
    console.error('Error getting banned IPs:', error);
    res.status(500).json({ error: "Fehler beim Laden der gesperrten IPs" });
  }
});

router.post("/ban/ip", validateIP, async (req, res) => {
  try {
    const { ip } = req.body;
    banIp(ip);
    res.json({ success: true, message: `IP ${ip} wurde gesperrt` });
  } catch (error) {
    console.error('Error banning IP:', error);
    res.status(500).json({ error: "Fehler beim Sperren der IP" });
  }
});


router.post("/unban/ip", validateIP, async (req, res) => {
  try {
    const { ip } = req.body;
    unBanIp(ip);
    res.json({ success: true, message: `IP ${ip} wurde entsperrt` });
  } catch (error) {
    console.error('Error unbanning IP:', error);
    res.status(500).json({ error: "Fehler beim Entsperren der IP" });
  }
});

export default router;