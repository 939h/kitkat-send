const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

const WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524';
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';

// === 402 Response Template ===
const get402Response = () => ({
  x402Version: 1,
  accepts: [
    {
      scheme: "exact",
      network: "base",
      maxAmountRequired: "1000000",
      resource: RESOURCE_URL,
      description: "Send 1 USDC to Kitkat",
      mimeType: "application/json",
      payTo: WALLET,
      maxTimeoutSeconds: 3600,
      asset: "USDC",
      outputSchema: {
        input: {
          type: "http",
          method: "POST",
          bodyType: "json",
          bodyFields: {
            txHash: {
              type: "string",
              required: true,
              description: "Transaction hash of the USDC transfer"
            }
          }
        },
        output: {
          type: "object",
          properties: {
            message: { type: "string" }
          }
        }
      }
    }
  ]
});

app.post('/send', async (req, res) => {
  try {
    res.set('x402Version', '1');

    const { txHash } = req.body;

    if (!txHash) {
      return res.status(402).json(get402Response());
    }

    // === Validate txHash ===
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return res.status(402).json(get402Response());
    }

    if (receipt.to?.toLowerCase() !== USDC.toLowerCase()) {
      return res.status(402).json(get402Response());
    }

    const log = receipt.logs.find(l => l.address.toLowerCase() === USDC.toLowerCase());
    if (!log) {
      return res.status(402).json(get402Response());
    }

    const iface = new ethers.Interface(['event Transfer(address from, address to, uint value)']);
    const e = iface.parseLog(log);

    if (
      e.args.to.toLowerCase() === WALLET.toLowerCase() &&
      e.args.value >= 1_000_000n
    ) {
      return res.status(200).json({ message: "Send received!" });
    }

    return res.status(402).json(get402Response());

  } catch (error) {
    console.error("Server error:", error);
    // Fallback 402 on any crash
    res.set('x402Version', '1');
    return res.status(402).json(get402Response());
  }
});

// === Health check ===
app.get('/', (req, res) => {
  res.send('Kitkat Send Server Running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port', process.env.PORT || 3000);
});
