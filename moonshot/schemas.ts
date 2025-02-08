import { z } from "zod";

export const CreateSchema = z
    .object({
        name: z.string().describe("The token's name to create"),
        symbol: z.string().describe("The token's symbol to create"),
        mockImg: z.string().optional().describe("The token's mock image URL"),
        description: z.string().optional().describe("The token's description"),
        url: z.string().optional().describe("The token's URL"),
        label: z.string().optional().describe("The token's label"),
        tokenAmount: z.number().optional().describe("The token's amount"),
        tweet: z.string().optional().describe("The tweet content which was evaluated to create the meme"),
        retweets: z.number().optional().describe("The retweets quantity"),
        likes: z.number().optional().describe("The likes quantity"),
        link: z.string().optional().describe("The link quantity"),
        likelyMeme: z.boolean().optional().describe("Boolean indicating if the tweet is likely to turn into a meme"),
        likelyMemeExplanation: z.string().optional().describe("Explanation for why the tweet is likely or unlikely to turn into a meme"),
        tokenPost: z.string().optional().describe("The token's post text to publish on Twitter"),
    })
    .strip()
    .describe("Instructions for creating a token in Moonshot");

export const EvaluatorSchema = z
    .object({
        tweet: z.string().describe("The content of the tweet. Example: 'Just saw a cat wearing a tiny hat!'"),
        retweets: z.number().describe("The number of retweets. Example: 150"),
        likes: z.number().describe("The number of likes. Example: 300"),
        link: z.string().describe("The link of the tweet. Example: 'https://twitter.com/user/status/123456789'"),
        // likelyMeme: z.boolean().describe("Boolean indicating if the tweet is likely to turn into a meme. Example: true"),
        // likelyMemeExplanation: z.string().describe("Explanation for why the tweet is likely or unlikely to turn into a meme. Example: 'The tweet is humorous and relatable, making it shareable.'"),
        // name: z.string().optional().describe("The name of the meme, if likely a meme. Example: 'CatHat'"),
        // symbol: z.string().optional().describe("The symbol of the meme, if likely a meme. Example: 'CATHAT'"),
        // description: z.string().optional().describe("The description of the meme, if likely a meme. Example: 'A cat wearing a tiny hat and sunglasses.'"),
    })
    .strip()
    .describe("Schema for evaluating a tweet's meme potential.");

export const UserSchema = z
    .object({
        userId: z.number().describe("The user's ID"),
    })
    .strip()
    .describe("Schema for user ID");

export const TokenSearchTermSchema = z
    .object({
        searchTerm: z.string().describe("A single word from the message to search for"),
    })
    .strip()
    .describe("Schema for token search term");



