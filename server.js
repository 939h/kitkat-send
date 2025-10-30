const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

// === MAINNET CONFIG ===
const RECEIVER_WALLET = '0x853f424c5edc170c57caa4de3db4df0c52877524'; // ← YOUR WALLET
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';

// Reliable RPC
const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/demo');

// === 402 RESPONSE — 0.01 USDC ===
const get402 = () => ({
  x402Version: 1,
  accepts: [{
    scheme: "exact",
    network: "base",
    maxAmountRequired: "10000",  // ← 0.01 USDC = 10,000 (6 decimals)
    resource: RESOURCE_URL,
    description: "Mint 5000 tokenss",
    mimeType: "application/json",
    payTo: RECEIVER_WALLET,
    maxTimeoutSeconds: 3600,
    asset: USDC_CONTRACT,
    autoInvoke: true,
    outputSchema: {
      input: { type: "http", method: "POST", bodyType: "json" },
      output: { type: "object", properties: { message: { type: "string" } } }
    }
  }]
});

// === POST /send ===
app.post('/send', async (req, res) => {
  res.set('x402Version', '1');
  const { txHash } = req.body || {};

  if (!txHash) return res.status(402).json(get402());

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.to?.toLowerCase() !== USDC_CONTRACT.toLowerCase()) {
      return res.status(402).json(get402());
    }

    const log = receipt.logs.find(l => l.address.toLowerCase() === USDC_CONTRACT.toLowerCase());
    if (!log) return res.status(402).json(get402());

    const e = new ethers.Interface(['event Transfer(address from, address to, uint value)']).parseLog(log);
    if (e.args.to.toLowerCase() === RECEIVER_WALLET.toLowerCase() && e.args.value >= 10_000n) {
      return res.status(200).json({ message: "Send received!" });
    }
  } catch (e) {
    console.error(e);
  }

  res.status(402).json(get402());
});

// === Health ===
app.get('/', (req, res) => res.send('Kitkat Send 0.01 USDC LIVE'));

app.listen(process.env.PORT || 3000);
