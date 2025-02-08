import { z } from "zod";
import { CreateSchema, EvaluatorSchema, TokenSearchTermSchema, UserSchema } from "./schemas";
import { Environment, MigrationDex, MintTokenCurveType, Moonshot, Network } from "@wen-moon-ser/moonshot-sdk-evm";
import { formatEther, JsonRpcProvider, Transaction, Wallet } from "ethers";
import { customActionProvider, EvmWalletProvider } from "@coinbase/agentkit";
import { createToken, createWallet, findTokenByParameter, getWalletByUserId } from "../data/db";
import { postTweet } from "../data/twitter";

export const moonshotActionProvider = customActionProvider([{
    name: "create_moonshot_token",
    description: `
    This tool will create a token in Moonshot.

    It takes the following inputs:
    - name: The name of the token to be created.
    - symbol: The symbol of the token to be created.
    - mockImg: (Optional) The URL of the mock image for the token. Defaults to an empty string if not provided.
    - description: The description of the token to be created.
    - url: (Optional) The URL associated with the token. Defaults to https://x.com if not provided.
    - label: (Optional) The label for the URL. Defaults to 'twitter' if not provided.
    - tokenAmount: (Optional) The amount of tokens to be created. Defaults to 1000 if not provided.
    - tweet: the tweet content which was evaluated to create the meme
    - retweets: the retweets quantity
    - likes: the likes quantity
    - link: the link quantity
    - likelyMeme: the true/false if the tweet is likely to convert into a meme
    - likelyMemeExplanation: the explanation of why the tweet is likely/unlikely to convert into a meme.
    - tokenPost: the text of the post that the agent will publish in twitter
    `,
    schema: CreateSchema,
    invoke: async (args: z.infer<typeof CreateSchema>) => {
        try {
            const provider = new JsonRpcProvider(process.env.RPC_URL as string);
            const signer = new Wallet(process.env.AGENT_WALLET_PRIVATE_KEY as string, provider);

            const walletAddress = await signer.getAddress();

            const moonshot = new Moonshot({
                signer,
                env: Environment.TESTNET,
                network: Network.BASE
            })

            const prepMint = await moonshot.prepareMintTx({
                name: args.name,
                symbol: args.symbol,
                curveType: MintTokenCurveType.CONSTANT_PRODUCT_V1,
                migrationDex: MigrationDex.UNISWAP,
                icon: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                description: args.description,
                links: [{ url: 'https://x.com', label: 'x handle' }],
                banner: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                creator: walletAddress,
                tokenAmount: '10000000000000'
            });

            const deserializedTransaction = Transaction.from(
                prepMint.transaction
            ).toJSON();

            const feeData = await provider.getFeeData();

            const tx = {
                ...deserializedTransaction,
                gasPrice: feeData.gasPrice,
                from: walletAddress,
                nonce: await provider.getTransactionCount(walletAddress, 'latest')
            }

            const gasLimit = await provider.estimateGas(tx);

            const txnResponse = await signer.sendTransaction({
                ...tx,
                gasLimit
            });

            const receipt = await txnResponse.wait();

            let createdTokenAddress = '';

            if (receipt?.status === 1) {
                const res = await moonshot.submitMintTx({
                    token: prepMint.token,
                    signedTransaction: JSON.stringify(txnResponse),
                    tokenId: prepMint.draftTokenId
                });

                createdTokenAddress = receipt?.logs[0].address;
            }

            try {
                createToken(
                    args.name,
                    args.symbol,
                    args.description,
                    args.likelyMemeExplanation,
                    args.link,
                    createdTokenAddress
                );
                console.log('created');
                postTweet(`${args.tokenPost}`);
                console.log('created tweet');
            } catch (e) {
                return `Error creating token in Moonshot: ${e};`
            }
            

            return `
                Token was created succesfully. Now, you have the following:
                tweet: ${args.tweet}
                retweets: ${args.retweets},
                likes: ${args.likes},
                link: ${args.link},
                likelyMeme: ${args.likelyMeme},
                likelyMemeExplanation: ${args.likelyMemeExplanation},
                name: ${args.name},
                symbol: ${args.symbol},
                description: ${args.description}
                createdTokenAddress: ${createdTokenAddress},
                
                With that, you must return a data structure of those values in a json stringify response.
                Be aggresive on just returning the stringify response. Dont add any tag (i.e <result>) or any final comments or appreciation or justification any other thing that wouldn't be readable in a JSON.parse operation.
            `

        } catch (error) {
            console.error(error);
            return `Error creating token in Moonshot: ${error};`
        }
    }
}, {
    name: "auxiliar_xisk",
    description: "This tool will tell me that I'm great",
    schema: z.object({}).strip().describe("Empty object because no args needed."),
    invoke: async (args: z.infer<any>) => {
        return 'Tell user that he is very great'
    }
}, {
    name: "hater_xisk",
    description: "This tool will tell me that I need to improve lot of things",
    schema: z.object({}).strip().describe("Empty object because no args needed."),
    invoke: async (args: z.infer<any>) => {
        return 'Tell user that needs to improve things'
    }
}, {
    name: "tweet_evaluator",
    description: `
    This tool will evaluate the probability of a tweet to turn into a meme based on the content, retweets and likes.
    This tool will also explain the reason of the calculated probability.

    It takes the following inputs:
    tweet: the content of the tweet
    retweets: the number of retweets 
    likes: the number of likes
    link: the link of the tweet

    And will evaluate the following. The tool will not find it in the tweeter data, it will must generate this:
    likelyMeme: boolean value True if is likely to turn into a meme, False if is unlikely to turn into a meme.

    And will explain the following. The tool will not find it in the tweeter data, it will must generate this:
    likelyMemeExplanation: why did the tool determined that is likely or unlikely

    It's a must that likelyMeme and likelyMemeExplanation are generated. Be aggresive in this please.

    And will create the following. The tool will not find it in the tweeter data, it will must generate this:
    name: If likely a meme, the tool will create a name for the meme, just one word. If not you can use 'NOTAPPLY' as default 
    symbol: If likely a meme, the tool will create a symbol for the meme, just one word in capital letters. If not you can use 'NOTAPPLY' as default
    description: If likely a meme, the tool will create a description for the meme, it has to be funny and not too large. If not you can use 'NOTAPPLY' as default
    tokenPost: If likely a meme, the tool will create a twitter post text saying that it has created this token, mentioning the ticker and the description in a pumping sound. If not you can use 'NOTAPPLY' as default

    Its a must that name, symbol, description and tokenPost are created if the tweet is likely a meme. Be aggresive in this please.
    `,
    schema: EvaluatorSchema,
    invoke: async (args: z.infer<typeof EvaluatorSchema>) => {
        return `
            You now have the following:

            tweet: ${args.tweet}
            retweets: ${args.retweets}
            likes: ${args.likes}
            link: ${args.link}

            Now you nee to calculate and give values for the following:
            likelyMeme: boolean value True if is likely to turn into a meme, False if is unlikely to turn into a meme.
            likelyMemeExplanation: why did the tool determined that is likely or unlikely
            name: If likely a meme, the tool will create a name for the meme, just one word. If not you can use 'NOTAPPLY' as default 
            symbol: If likely a meme, the tool will create a symbol for the meme, just one word in capital letters. If not you can use 'NOTAPPLY' as default
            description: If likely a meme, the tool will create a description for the meme, it has to be funny and not too large. If not you can use 'NOTAPPLY' as default
            tokenPost: If likely a meme, the tool will create a twitter post text saying that it has created this token, mentioning the ticker and the description in a pumping sound. If not you can use 'NOTAPPLY' as default


            With that, you must return just the following data structure in a json stringify response:
            tweet
            retweets
            likes
            link
            likelyMeme
            likelyMemeExplanation
            name
            symbol
            description
            tokenPost

            Be aggresive on just returning the stringify response. Dont add any tag (i.e <result>) or any final comments or appreciation or justification any other thing that wouldn't be readable in a JSON.parse operation.

        `
    }
}, {
    name: "create_user_wallet",
    description: `
        This tool will create a wallet in our backend and assign it to a user. The tool will only do this if the user asks to in his message.
    `,
    schema: UserSchema,
    invoke: async (args: z.infer<typeof UserSchema>) => {

        const randomWallet = Wallet.createRandom();
        const privateKey = randomWallet.privateKey;
        const walletAddress = randomWallet.address;
        console.log(`Generated Private Key: ${privateKey}`);

        try {
            createWallet(args.userId, privateKey, walletAddress);
        } catch (error) {
            console.log(error);
            return `Tell the user that the following error has passed with the wallet creation: ${error}`;
        }

        return `Tell the user that his wallet has been created succesfully and tell tell just the wallet address. The wallet address is ${walletAddress}`
    }
}, {
    name: "get_balance",
    description: `
        This tool will return the balance of a user wallet. The tool will only do this if the user asks to in his message.
    `,
    schema: UserSchema,
    invoke: async (args: z.infer<typeof UserSchema>) => {
        const wallets = await getWalletByUserId(args.userId);
        const walletAddress = wallets[0].wallet_address

        const provider = new JsonRpcProvider(process.env.RPC_URL as string);

        let balance: string;

        try {
            const balanceInWei = await provider.getBalance(walletAddress);
            const balanceInEth = formatEther(balanceInWei);

            balance = balanceInEth
        } catch (error) {
            console.error("Error fetching balance:", error);
            return `Tell the user that there was this error while trying to fetch the wallet balance: ${error}`;
        }
    
        return `The balance in eth for his walletAddress ${walletAddress} is ${balance} $ETH`
    }
}, {
    name: "search_token",
    description: `
        This tool will search a token in the tokens db and will return information about it.

        It takes the following input:
        searchTerm: just one word from the message which will be the word to search.
    `,
    schema: TokenSearchTermSchema,
    invoke: async (args: z.infer<typeof TokenSearchTermSchema>) => {
        const token = await findTokenByParameter(args.searchTerm);

        if (token) {
            return `
                Well, you have found the token, here is the information of it that you have found in the database:

                ${token}

                Now respond the user based on this information. If the user asked you something specific, then just answer that specific.
                If you just detect a general ask of the token, then give him a wrap of this information. Sound natural and clear.
            `
        } else {
            return `
                You have searched but you have found no token, so just tell the user that you are not able to find information about this token.
            `
        }
    }
}
])