// twitter.js
import Twitter, { TwitterApiTokens } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

// Configure the Twitter client with your credentials
const userClient = new Twitter({
    appKey: process.env.API_KEY || ' ',
    appSecret: process.env.API_SECRET || ' ',
    accessToken: process.env.ACCESS_TOKEN || ' ',
    accessSecret: process.env.ACCESS_SECRET || ' ',
    clientId: process.env.CLIENT_ID || ' ',
    clientSecret: process.env.CLIENT_SECRET || ' '
} as TwitterApiTokens);

// Function to post a tweet
export const postTweet = async (text) => {
    try {
        const response = await userClient.v2.tweet(text);
        console.log("Tweet posted:", response);
        return response; // Return the response of the posted tweet
    } catch (error) {
        console.error("Error posting tweet:", error);
        throw error; // Throw the error to be handled by the caller
    }
};
