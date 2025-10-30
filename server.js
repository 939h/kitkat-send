const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

// === CONFIG ===
const WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';
const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/demo');

// === ALL RESOURCES ===
const RESOURCES = [
  {
    amount: "1000000",  // 1 USDC
    description: "Mint 5000 tokens for 1 USDC",
    minValue: 1_000_000n
  },
  {
    amount: "200000",   // 0.2 USDC
    description: "Mint 5000 tokens for 0.2 USDC",
    minValue: 200_000n
  }
];

// === 402 RESPONSE (SHOWS BOTH OPTIONS) ===
const get402 = () => ({
  x402Version: 1,
  accepts: RESOURCES.map(r => ({
    scheme: "exact",
    network: "base",
    maxAmountRequired: r.amount,
    resource: RESOURCE_URL,
    description: r.description,
    mimeType: "application/json",
    payTo: WALLET,
    maxTimeoutSeconds: 3600,
    asset: USDC,
    autoInvoke: true,
    outputSchema: {
      input: { type: "http", method: "POST", bodyType: "json" },
      output: { type: "object", properties: { message: { type: "string" } } }
    }
  }))
});

// === POST /send ===
app.post('/send', async (req, res) => {
  res.set('x402Version', '1');
  const { txHash } = req.body || {};

  if (!txHash) return res.status(402).json(get402());

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.to?.toLowerCase() !== USDC.toLowerCase()) {
      return res.status(402).json(get402());
    }

    const log = receipt.logs.find(l => l.address.toLowerCase() === USDC.toLowerCase());
    if (!log) return res.status(402).json(get402());

    const e = new ethers.Interface(['event Transfer(address from, address to, uint value)']).parseLog(log);
    const value = e.args.value;
    const to = e.args.to.toLowerCase();

    if (to === WALLET.toLowerCase()) {
      const resource = RESOURCES.find(r => value >= r.minValue);
      if (resource) {
        return res.status(200).json({ message: "Send received! Minting 5000 tokens..." });
      }
    }
  } catch (e) {
    console.error(e);
  }

  res.status(402).json(get402());
});

app.get('/', (req, res) => res.send('Kitkat Send: 1 USDC & 0.2 USDC LIVE'));

app.listen(process.env.PORT || 3000);
