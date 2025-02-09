import { Environment, FixedSide, Moonshot, Token } from "@wen-moon-ser/moonshot-sdk-evm";
import { parseEther, Wallet } from "ethers";
import { JsonRpcProvider } from "ethers";

export const buyToken = async (wallet, tokenAddress, buyAmount) => {
    const provider = new JsonRpcProvider(process.env.RPC_URL as string)
    const privateKey = wallet.private_key;
    const signer = new Wallet(privateKey, provider)

    const moonshot = new Moonshot({
        signer,
        env: Environment.TESTNET
    });

    const moonshotToken = await Token.create({
        moonshot,
        provider,
        tokenAddress
    });

    const collateralAmount = parseEther(buyAmount.toString());

    const tokenAmountForTransaction = await moonshotToken.getTokenAmountByCollateral({
        collateralAmount,
        tradeDirection: 'BUY',
    });

    const slippageBps = 1000;

    const buyTx = await moonshotToken.prepareTx({
        slippageBps,
        tokenAmount: tokenAmountForTransaction,
        collateralAmount: collateralAmount,
        tradeDirection: 'BUY',
        fixedSide: FixedSide.IN,
    });

    const walletAddress = await signer.getAddress();

    const feeData = await provider.getFeeData();

    const nonce = await provider.getTransactionCount(walletAddress, 'latest');

    const enrichedBuyTx = {
        ...buyTx,
        gasPrice: feeData.gasPrice,
        nonce: nonce,
        from: walletAddress,
    };

    const buyTxGasLimit = await provider.estimateGas(enrichedBuyTx);

    const buyTxResponse = await signer.sendTransaction({
        ...buyTx,
        gasLimit: buyTxGasLimit,
    });

    const buyTxReceipt = await buyTxResponse.wait();

    return buyTxReceipt;
}