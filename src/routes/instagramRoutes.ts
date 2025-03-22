// add routes to login , calback and webhook

import { Router } from 'express';
import { instagramLogin, instagramCallback, webhookGet, webhookPost } from '../controllers/instagramController';

const router = Router();

// route to redirect to instagram login
// https://localhost:3000/instagram/login
router.get('/login', instagramLogin);

// route to handle instagram callback
router.get('/callback', instagramCallback);

// route to handle instagram webhook verification
router.get('/webhook', webhookGet);

// route to handle income instagram webhook
router.post('/webhook', webhookPost);

export default router;