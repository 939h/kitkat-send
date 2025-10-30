const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

const WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524';
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

app.post('/send', async (req, res) => {
  const { txHash } = req.body;

  // === 402: Missing or Invalid txHash → Return x402 Quote ===
  if (!txHash) {
    return res.status(402).json({
      amount: 1000000,                    // ← NUMBER, not string
      currency: "USDC",
      chain: "base",
      recipient: WALLET,
      description: "Send 1 USDC to Kitkat"
    });
  }

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt?.to?.toLowerCase() === USDC.toLowerCase()) {
      const log = receipt.logs.find(l => l.address.toLowerCase() === USDC.toLowerCase());
      if (log) {
        const iface = new ethers.Interface(['event Transfer(address from, address to, uint value)']);
        const e = iface.parseLog(log);
        if (e.args.to.toLowerCase() === WALLET.toLowerCase() && e.args.value >= 1_000_000n) {
          return res.status(200).send('Send received!');
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  // === 402: Invalid txHash → Return Quote Again ===
  res.status(402).json({
    amount: 1000000,
    currency: "USDC",
    chain: "base",
    recipient: WALLET,
    description: "Send 1 USDC to Kitkat"
  });
});

app.listen(process.env.PORT || 3000);
