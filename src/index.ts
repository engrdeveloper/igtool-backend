import express from 'express';
import bodyParser from 'body-parser';
import https from 'https';
import fs from 'fs';
import instagramRoutes from './routes/instagramRoutes';
const app = express();
import { PORT } from './config';
import morgan from 'morgan';
import { socketService } from './utils/socket';


app.use(bodyParser.json());

app.use(morgan('dev'));

// routes
app.use('/instagram', instagramRoutes);

// Load SSL certificate and key
const sslOptions = {
    key: fs.readFileSync('/home/sohaib/Desktop/Projects/igtool/igtool-backend/https/server.key'),
    cert: fs.readFileSync('/home/sohaib/Desktop/Projects/igtool/igtool-backend/https/server.cert'),
};

const server = https.createServer(sslOptions, app);
// Initialize socket.io with the HTTP server
socketService.initialize(server);
// Start HTTPS server
server.listen(PORT, () => {
    console.log(`Server is running at: ${PORT}`);
});
