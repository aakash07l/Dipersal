// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder

// Configure RPC URLs and Private Key
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
    console.error("PRIVATE_KEY not found in .env file. Please set it.");
    process.exit(1);
}

const rpcUrls = {
    base: process.env.BASE_RPC_URL,
    zora: process.env.ZORA_RPC_URL,
    optimism: process.env.OPTIMISM_RPC_URL,
    arbitrum: process.env.ARBITRUM_RPC_URL,
};

// --- API Endpoint for Token Dispersal ---
app.post('/api/disperse', async (req, res) => {
    const { network, tokenAddress, recipientAddresses, amounts } = req.body;

    if (!network || !tokenAddress || !recipientAddresses || !amounts) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    if (!rpcUrls[network]) {
        return res.status(400).json({ success: false, message: `Unsupported network: ${network}` });
    }

    if (recipientAddresses.length !== amounts.length) {
        return res.status(400).json({ success: false, message: 'Recipient addresses and amounts must have the same length.' });
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrls[network]);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Standard ERC-20 ABI for transfer function
        const erc20Abi = [
            "function transfer(address to, uint256 amount) returns (bool)"
        ];

        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);

        const transactionHashes = [];

        for (let i = 0; i < recipientAddresses.length; i++) {
            const recipient = recipientAddresses[i];
            const amountInWei = ethers.parseUnits(amounts[i].toString(), 18); // Adjust decimals if needed

            console.log(`Sending ${amounts[i]} tokens to ${recipient} on ${network}...`);
            const tx = await tokenContract.transfer(recipient, amountInWei);
            await tx.wait(); // Wait for the transaction to be mined
            transactionHashes.push(tx.hash);
            console.log(`Transaction sent: ${tx.hash}`);
        }

        res.json({ success: true, message: 'Tokens dispersed successfully!', transactions: transactionHashes });

    } catch (error) {
        console.error('Error dispersing tokens:', error);
        res.status(500).json({ success: false, message: 'Failed to disperse tokens.', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
