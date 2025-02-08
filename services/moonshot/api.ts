// moonshot.js
import axios from 'axios';

export const moonshotPrepareMint = async (
    name: string,
    symbol: string,
    curveType: string = "CONSTANT_PRODUCT_V1",
    migrationDex: string = "UNISWAP",
    icon: string,
    description: string,
    links: any,
    banner: string,
    creator: string,
    tokenAmount: string,
    creatorId: string,
    chainId: string = "basesepolia"
) => {
    try {
        const response = await axios.post('https://api-devnet.moonshot.cc/tokens/v1', {
            name,
            symbol,
            curveType,
            migrationDex,
            icon,
            description,
            links,
            banner,
            creator,
            tokenAmount,
            creatorId,
            chainId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data; // Return the response object
    } catch (error) {
        console.error("Error preparing mint:", error);
        throw error; // Throw the error to be handled by the caller
    }
};