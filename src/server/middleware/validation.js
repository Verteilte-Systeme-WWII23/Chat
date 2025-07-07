export function validateIP(req, res, next) {
    const { ip } = req.body;

    if (!ip) {
        return res.status(400).json({ error: "IP-Adresse ist erforderlich" });
    }

    // Einfache IP-Validierung
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
        return res.status(400).json({ error: "Ungültige IP-Adresse" });
    }

    next();
}