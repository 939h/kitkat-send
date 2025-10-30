const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

// === CONFIG ===
const WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

// === 402 RESPONSE (Auto-Pay) ===
const get402 = () => ({
  x402Version: 1,
  accepts: [{
    scheme: "exact",
    network: "base",
    maxAmountRequired: "1000000",
    resource: RESOURCE_URL,
    description: "Send 1 USDC to Kitkat",
    mimeType: "application/json",
    payTo: WALLET,
    maxTimeoutSeconds: 3600,
    asset: "USDC",
    autoInvoke: true,  // ← THIS REMOVES txHash FIELD
    outputSchema: {
      input: { type: "http", method: "POST", bodyType: "json" },
      output: { type: "object", properties: { message: { type: "string" } } }
    }
  }]
});

// === POST /send (Auto-called after payment) ===
app.post('/send', async (req, res) => {
  res.set('x402Version', '1');
  const { txHash } = req.body;

  if (!txHash) return res.status(402).json(get402());

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.to?.toLowerCase() !== USDC.toLowerCase()) {
      return res.status(402).json(get402());
    }

    const log = receipt.logs.find(l => l.address.toLowerCase() === USDC.toLowerCase());
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

// === Health ===
app.get('/', (req, res) => res.send('Kitkat Send OK'));

app.listen(process.env.PORT || 3000);
