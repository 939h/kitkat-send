import express from 'express';
import { ethers } from 'ethers';

const app = express();
app.use(express.json());

// === CONFIG ===
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';
const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/demo');

// === VALID 402 RESPONSE (MATCHES x402scan SCHEMA) ===
const get402 = () => ({
  x402Version: 1,
  accepts: [{
    scheme: "exact",
    network: "base",
    maxAmountRequired: "1000000",
    resource: RESOURCE_URL,
    description: "Send 1 USDC",
    mimeType: "application/json",
    payTo: "coinbase",
    maxTimeoutSeconds: 3600,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    autoInvoke: true,
    outputSchema: {
      input: { type: "http", method: "POST", bodyType: "json" },
      output: { type: "object", properties: { message: { type: "string" } } }
    }
  }]
});

// === /send ENDPOINT ===
app.post('/send', async (req, res) => {
  res.set('x402Version', '1');  // ← REQUIRED
  const { txHash } = req.body || {};

  if (!txHash) {
    return res.status(402).json(get402());
  }

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return res.status(402).json(get402());

    const log = receipt.logs.find(l => l.address.toLowerCase() === USDC.toLowerCase());
    if (!log) return res.status(402).json(get402());

    const iface = new ethers.Interface(['event Transfer(address from, address to, uint256 value)']);
    const parsed = iface.parseLog(log);
    if (parsed.args.value.toString() === "1000000") {
      return res.status(200).json({ message: "Send received!" });
    }
  } catch (e) {
    console.error("Verification error:", e);
  }

  return res.status(402).json(get402());
});

// === HOME ===
app.get('/', (req, res) => {
  res.send(`
    <h1>Kitkat Send — LIVE</h1>
    <p><strong>Pay 1 USDC → Get Message</strong></p>
    <p><a href="https://www.x402scan.com/recipient/0x853f424c5eDc170C57caA4De3dB4df0c52877524">
      View on x402scan
    </a></p>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kitkat Send running on port ${PORT}`);
});
