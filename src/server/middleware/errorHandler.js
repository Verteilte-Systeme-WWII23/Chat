import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
    console.error('Server Error:', err);

    if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
        res.status(500).json({
            error: config.nodeEnv === 'production'
                ? 'Internal Server Error'
                : err.message
        });
    } else {
        // Für andere Requests HTML Error Page
        res.status(500).send(`
      ${config.nodeEnv === 'production' ? 'Something went wrong' : err.message}
    `);
    }
}