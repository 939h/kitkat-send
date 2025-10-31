import express from 'express';
import { X402 } from '@coinbase/x402';

const app = express();
app.use(express.json());

// === YOUR CONFIG ===
const YOUR_WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524'; // ← YOU GET PAID HERE
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
const RPC_URL = 'https://base-mainnet.g.alchemy.com/v2/demo'; // Free RPC

// === x402 INSTANCE — USES COINBASE FACILITATOR ===
const x402 = new X402({
  payTo: "coinbase",           // ← COINBASE SENDS USDC TO YOUR WALLET
  asset: USDC_CONTRACT,
  network: 'base',
  rpcUrl: RPC_URL,
  // Coinbase knows your wallet from x402scan registration
});

// === PRICING TIERS ===
const TIERS = [
  {
    amount: '1000000', // 1 USDC
    description: 'Mint 5000 tokens — Premium ($1.00)'
  },
  {
    amount: '200000',  // 0.2 USDC
    description: 'Mint 5000 tokens — Standard ($0.20)'
  },
  {
    amount: '10000',   // 0.01 USDC
    description: 'Mint 5000 tokens — Micro ($0.01)'
  }
];

// === MAIN ENDPOINT: /send ===
app.post('/send', async (req, res) => {
  const { txHash } = req.body || {};

  // No txHash → Show all pricing options
  if (!txHash) {
    return x402.quote(res, TIERS.map(t => ({
      amount: t.amount,
      description: t.description
    })));
  }

  try {
    // Verify payment matches any tier
    const validTier = await x402.verify(txHash, TIERS.map(t => t.amount));

    if (validTier) {
      const tier = TIERS.find(t => t.amount === validTier.amount);
      return res.status(200).json({
        message: `Payment received! Minting 5000 tokens for $${tier.amount / 1000000}...`,
        tier: tier.description
      });
    }
  } catch (error) {
    console.error('Verification failed:', error.message);
  }

  // Invalid payment → show quote again
  return x402.quote(res, TIERS.map(t => ({
    amount: t.amount,
    description: t.description
  })));
});

// === HEALTH CHECK & LANDING PAGE ===
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: Arial; text-align: center; padding: 40px; background: #000; color: #0f0;">
      <h1>KITKAT SEND — LIVE ON x402</h1>
      <p><strong>Wallet:</strong> <code>${YOUR_WALLET}</code></p>
      <p><strong>3 Tiers:</strong> $1.00, $0.20, $0.01 → 5000 Tokens</p>
      <p>
        <a href="https://www.x402scan.com/recipient/${YOUR_WALLET}" 
           style="color: #0ff; font-weight: bold;">
          View on x402scan.com
        </a>
      </p>
      <hr>
      <p><em>Powered by Coinbase x402 Facilitator</em></p>
    </div>
  `);
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kitkat Send LIVE on port ${PORT}`);
  console.log(`View: http://localhost:${PORT}`);
});
