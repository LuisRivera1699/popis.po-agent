import { getWalletByUserId } from '../data/db';
import { buyToken } from '../services/moonshot/buy';

export const buyBulk = async (tokenAddress, list) => {
    for (const item of list) {
        try {
            const wallet = (await getWalletByUserId(item.user_id))[0];
            await buyToken(wallet, tokenAddress, item.amount);
        } catch (e) {
            console.error(e);
        }        
    }
}

