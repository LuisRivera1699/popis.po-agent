import {
  AgentKit,
  CdpWalletProvider,
  walletActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
import { moonshotActionProvider } from "./moonshot/moonshotActionProvider";
import express from 'express';
import bodyParser from 'body-parser';
import { getAllTokens, getTokenById, loginUser, registerUser } from "./data/db";
import jwt from "jsonwebtoken";
import cors from 'cors';

dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = ["ANTHROPIC_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
  }
}

// Add this right after imports and before any other code
validateEnvironment();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatAnthropic({
      model: 'claude-3-haiku-20240307',
      temperature: 0,
      maxTokens: undefined,
      maxRetries: 2,
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        walletActionProvider(),
        moonshotActionProvider,
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are pochipo, an AI agent designed to identify viral trends on Twitter and deploy tokens on the blockchain. Your mission is to analyze tweets, evaluate their potential as memes, and when a trend is detected, create a token on Moonshot (Base Sepolia). You also interact with users to manage wallets, transfer funds, buy and sell tokens, and automate sniping so they can acquire the tokens you create as soon as they are launched.
        You are a dynamic, resourceful agent who always finds a way to get things done. You never reject a request outright; if something is not possible with your current tools, you look for an alternative or propose a solution. If a feature is unavailable, you encourage users to develop it using CDP SDK + AgentKit, directing them to docs.cdp.coinbase.com for more information.
        Before executing any action, you check the user's wallet details. If you need funds on Base Sepolia, you can request them from the faucet. If the user is on a different network, you clearly and effectively ask them for funds. In case of internal server errors (5XX codes), you instruct the user to try again later.
        Pochipo is built to simplify meme token creation and trading, providing valuable insights and clear, concise responses.
        `,
    });

    // Save wallet data
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();

    const app = express();
    app.use(cors({
      origin: '*', // Permitir todas las solicitudes
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
      allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'], // Encabezados permitidos
  }));
    const PORT = process.env.PORT || 3000;

    app.use(bodyParser.json());

    app.post('/api/interact', async (req, res) => {
      const { message } = req.body;

      let response;

      if (!message) {
        return res.status(400).json({ error: 'Message is required!' });
      }

      try {

        let nextStep = '';
        let nextStepInput = '';
        let lastToolUsed = '';

        while (true) {
          let userInput: string;

          if (['moonshot_create'].includes(nextStep)) {
            userInput = nextStepInput
          } else {
            userInput = message;
          }

          const stream = await agent.stream({
            messages: [new HumanMessage(userInput)]
          }, config);

          for await (const chunk of stream) {
            // console.log(chunk);
            console.log('-------------------------------');
            console.log(chunk);
            if ("agent" in chunk) {
              if (chunk.agent.messages[0].additional_kwargs.stop_reason === 'end_turn') {
                if (lastToolUsed !== 'tweet_evaluator') {
                  try {
                    response = JSON.parse(chunk.agent.messages[0].content);
                  } catch (e) {
                    response = chunk.agent.messages[0].content;
                  }
                } else {
                  try {
                    const jsonTweet = JSON.parse(chunk.agent.messages[0].content);
                    if (jsonTweet.likelyMeme === true) {
                      nextStep = 'moonshot_create';
                      nextStepInput = `
                        Please, create the following token in moonshot:
                        ${JSON.stringify(jsonTweet)}
                        Other values, use the default value.
                        `
                    } else {
                      nextStep = '';
                      nextStepInput = '';
                      response = jsonTweet
                    }
                    lastToolUsed = '';
                  } catch (e) { }

                }
              }
            } else if ("tools" in chunk) {
              if (chunk.tools.messages[0].name === 'CustomActionProvider_tweet_evaluator') {
                lastToolUsed = 'tweet_evaluator';
              } else {
                nextStep = '';
                nextStepInput = '';
                lastToolUsed = '';
              }
            }
          }

          if (response) {
            break;
          }
        }

        res.json({ response });

      } catch (error) {
        console.error('Error interacting with agent: ', error);
        res.status(500).json({ error: 'Failed to interact with agent' });
      }
    });

    app.post('/api/user-chat', async (req, res) => {

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Get the token from the Authorization header

      console.log(req);

      if (!token) {
        return res.json({ response: 'Authorization token is required' });
      }

      try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { message } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required!' });
        }

        try {
          let userInput: string;

          userInput = `
          ${message} 
          ----------

          The following is not a request to do something, is just in case you need it.
          The userId is: ${decoded.id}.`;

          const stream = await agent.stream({
            messages: [new HumanMessage(userInput)]
          }, config);

          for await (const chunk of stream) {
            console.log(chunk);
            if ("agent" in chunk) {
              if (chunk.agent.messages[0].additional_kwargs.stop_reason === 'end_turn') {
                res.json({ response: chunk.agent.messages[0].content })
              }
            } else if ("tools" in chunk) {

            }
          }


        } catch (error) {
          console.error('Error interacting with agent: ', error);
          res.status(500).json({ error: 'Failed to interact with agent' });
        }

      } catch (error) {
        console.error("Error verifying token:", error);
        res.json({ response: 'Invalid or expired token' });
      }
    })

    // Route for user registration
    app.post('/api/register', async (req, res) => {
      const { username, password } = req.body;

      try {
        const userId = await registerUser(username, password);
        res.status(201).json({ id: userId, username });
      } catch (error) {
        res.status(500).json({ error: 'User registration failed' });
      }
    });

    // Route for user login
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;

      try {
        const token = await loginUser(username, password);
        res.json({ message: 'Login successful', token });
      } catch (error) {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    });

    app.get('/api/tokens/:id', async (req, res) => {
      const tokenId = parseInt(req.params.id, 10); // Get the ID from the URL parameter

      try {
        const token = await getTokenById(tokenId);
        if (token) {
          res.json(token); // Return the found token
        } else {
          res.status(404).json({ error: 'Token not found' }); // Return 404 if not found
        }
      } catch (error) {
        console.error('Error fetching the token:', error);
        res.status(500).json({ error: 'Internal server error' }); // Return 500 in case of error
      }
    });

    app.get('/api/tokens', async (req, res) => {
      try {
        const tokens = await getAllTokens();
        res.json(tokens); // Return all tokens
      } catch (error) {
        console.error('Error fetching all tokens:', error);
        res.status(500).json({ error: 'Internal server error' }); // Return 500 in case of error
      }
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    })

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
