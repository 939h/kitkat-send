const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

// === CONFIG ===
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base USDC
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';
const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/demo');

// === 402 RESPONSE ===
const get402 = () => ({
  x402Version: 1,
  accepts: [{
    scheme: "exact",
    network: "base",
    maxAmountRequired: "1000000",
    resource: RESOURCE_URL,
    description: "Send 1 USDC",
    mimeType: "application/json",
    payTo: "coinbase",  // ← Coinbase sends to your registered wallet
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
    if (!receipt) return res.status(402).json(get402());

    const log = receipt.logs.find(l => l.address.toLowerCase() === USDC_CONTRACT.toLowerCase());
    if (!log) return res.status(402).json(get402());

    const iface = new ethers.Interface(['event Transfer(address,address,uint256)']);
    const { args } = iface.parseLog(log);
    const value = args[2].toString();

    if (value === "1000000") {
      return res.json({ message: "Send received!" });
    }
  } catch (e) {
    console.error(e);
  }

  return res.status(402).json(get402());
});

// === HOME ===
app.get('/', (req, res) => res.send('Kitkat Send LIVE'));

app.listen(process.env.PORT || 3000);
