import axios from 'axios';
import { Request, Response } from 'express';
import FormData from 'form-data';
import { WEBHOOK_VERIFICATION } from '../config';
import { socketService } from '../utils/socket';

/**
 * Instagram login
 * @description Redirects to Instagram login page
 * 
 * @param req - express request
 * @param res - express response
 */
export const instagramLogin = (req: Request, res: Response): void => {
    // Business login for instagram
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login

    const scopes = [
        'instagram_business_basic',
        'instagram_business_manage_messages',
    ];
    const instagramAuthURL = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=${scopes.join(',')}&response_type=code`;
    res.redirect(instagramAuthURL);
};

/**
 * Instagram callback
 * @description Handles Instagram callback
 * 
 * @param req - express request
 * @param res - express response
 */
export const instagramCallback = async (req: Request, res: Response): Promise<void> => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send('Code is missing')
        return
    };

    try {
        // Exchange code for access token
        // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-2---exchange-the-code-for-a-token
        const form = new FormData();
        form.append('client_id', process.env.INSTAGRAM_APP_ID!);
        form.append('client_secret', process.env.INSTAGRAM_APP_SECRET!);
        form.append('grant_type', 'authorization_code');
        form.append('redirect_uri', process.env.INSTAGRAM_REDIRECT_URI!);
        form.append('code', code as string);

        const response = await axios.post('https://api.instagram.com/oauth/access_token', form, {
            headers: form.getHeaders(),
        });

        const instagramUserId = response.data.user_id;
        let accessToken = response.data.access_token;

        // Get the long lived token
        // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#long-lived
        // Expiry of 60 days has to refresh it, as per the docs of long lived token, procedure is mentioned there
        const longLivedTokenResponse = await axios.get(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET!}&access_token=${accessToken}`
        );

        accessToken = longLivedTokenResponse.data.access_token;
        const accessTokenExpiresIn = longLivedTokenResponse.data.expires_in;

        // Get user data
        // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started#example-request
        const userData = await axios.get(
            `https://graph.instagram.com/v22.0/me?fields=id,user_id,username,account_type,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`
        );

        // subscribe webhook for instagram messenging
        // https://developers.facebook.com/docs/instagram-platform/webhooks#enable-subscriptions
        const webhookResponse = await axios.post(
            `https://graph.instagram.com/v22.0/${instagramUserId}/subscribed_apps?access_token=${accessToken}&subscribed_fields=messages`
        );


        res.send({
            message: 'Connected to Instagram',
            accessToken,
            accessTokenExpiresIn,
            instagramUserId,
            userData: userData.data,
            webhookResponse: webhookResponse.data
        });
    } catch (err) {
        console.log(err);
        res.status(500).send(`Error during login: ${err.message}`);
    }
};

/**
 * Instagram webhook
 * @description Handles Instagram webhook verification
 * @url https://developers.facebook.com/docs/instagram-platform/webhooks/
 * 
 * @param req - express request
 * @param res - express response
 */
export const webhookGet = (req: Request, res: Response): void => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WEBHOOK_VERIFICATION) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};

/**
 * Fetch Instagram message information
 * @description Fetches information about an Instagram message
 * @url https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/conversations-api/#get-information-about-a-message
 * 
 * @param messageId - The ID of the message to fetch information for
 * @param accessToken - The access token to use for the request
 * @returns The information about the message, or null if an error occurs
 */
const fetchInstagramMessageInformation = async (messageId: string, accessToken: string): Promise<any> => {
    try {
        const response = await axios.get(`https://graph.instagram.com/v22.0/${messageId}?fields=id,created_time,from,to,message&access_token=${accessToken}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching Instagram message information:', error);
        return null;
    }

}

/**
 * Instagram webhook
 * @description Handles Incoming Instagram webhook
 * @url https://developers.facebook.com/docs/instagram-platform/webhooks/
 * 
 * @param req - express request
 * @param res - express response
 */
export const webhookPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body;
        console.log('Received message:', JSON.stringify(body, null, 2));
        if (body.object === 'instagram') {
            console.log('Instagram message received:', JSON.stringify(body, null, 2));

            // for loop for entry
            for (const messages of body.entry) {

                for (const msg of messages?.messaging) {

                    // TODO: Fetch access token from the database and also save the message to the database
                    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

                    const { from } = await fetchInstagramMessageInformation(msg.message.mid, accessToken).catch(err => {
                        // handle error if necessary
                    })

                    socketService.emit('instagram_message', {
                        message: {
                            sender: msg.sender.id,
                            recipient: msg.recipient.id,
                            timestamp: msg.timestamp,
                            content: msg.message.text
                        },
                        contact: {
                            id: from?.id,
                            username: from?.username
                        }
                    });
                }

            }




        }
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
};
