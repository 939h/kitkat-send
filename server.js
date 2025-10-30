const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

// === MAINNET CONFIG ===
const WALLET = '0xe68b85b5e09a1090e91a350aab4814fc12a1c226';
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // ← USDC on Base Mainnet
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';

// Reliable public RPC
const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/demo');

// === 402 RESPONSE (CORRECTED: asset = CONTRACT ADDRESS) ===
const get402 = () => ({
  x402Version: 1,
  accepts: [{
    scheme: "exact",
    network: "base",
    maxAmountRequired: "1000000",
    resource: RESOURCE_URL,
    description: "mint 5000 token",
    mimeType: "application/json",
    payTo: WALLET,
    maxTimeoutSeconds: 3600,
    asset: USDC_CONTRACT,  // ← MUST BE 0x833589... (40 hex chars)
    autoInvoke: true,
    outputSchema: {
      input: {
        type: "http",
        method: "POST",
        bodyType: "json"
      },
      output: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      }
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
    if (e.args.to.toLowerCase() === WALLET.toLowerCase() && e.args.value >= 1_000_000n) {
      return res.status(200).json({ message: "Send received!" });
    }
  } catch (e) {
    console.error(e);
  }

  res.status(402).json(get402());
});

// === Health Check ===
app.get('/', (req, res) => res.send('Kitkat Send MAINNET LIVE'));

app.listen(process.env.PORT || 3000);
