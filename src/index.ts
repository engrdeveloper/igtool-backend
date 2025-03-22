import express from 'express';
import bodyParser from 'body-parser';
import https from 'https';
import fs from 'fs';
import instagramRoutes from './routes/instagramRoutes';
const app = express();
import { PORT } from './config';
import morgan from 'morgan';

app.use(bodyParser.json());

app.use(morgan('dev'));

// routes
app.use('/instagram', instagramRoutes);

// Load SSL certificate and key
const sslOptions = {
    key: fs.readFileSync('/server.key'),
    cert: fs.readFileSync('/server.cert'),
};

// Start HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🚀 Server running at https://localhost:${PORT}`);
});
