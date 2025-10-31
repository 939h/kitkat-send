import express from 'express';
import { X402 } from '@coinbase/x402';

const app = express();
app.use(express.json());

// === CONFIG ===
const WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
const RPC_URL = 'https://base-mainnet.g.alchemy.com/v2/demo';

// === x402 INSTANCE ===
const x402 = new X402({
  payTo: WALLET,
  asset: USDC,
  network: 'base',
  rpcUrl: RPC_URL,
});

// === PRICING TIERS ===
const TIERS = [
  {
    amount: '1000000', // 1 USDC
    description: 'Mint 5000 tokens (Premium)',
    minValue: 1_000_000n
  },
  {
    amount: '200000',  // 0.2 USDC
    description: 'Mint 200 tokens (Standard)',
    minValue: 200_000n
  },
  {
    amount: '10000',   // 0.01 USDC
    description: 'Mint 100 tokens (Micro)',
    minValue: 10_000n
  }
];

// === 402 QUOTE (SHOWS ALL TIERS) ===
app.post('/send', async (req, res) => {
  const { txHash } = req.body || {};

  // No txHash → return all pricing options
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
        message: `Send received! Minting 5000 tokens for ${tier.amount / 1000000} USDC...`
      });
    }
  } catch (error) {
    console.error('Verification failed:', error);
  }

  // Invalid → show quote again
  return x402.quote(res, TIERS.map(t => ({
    amount: t.amount,
    description: t.description
  })));
});

// === Health Check ===
app.get('/', (req, res) => {
  res.send(`
    <h1>Kitkat Send — LIVE</h1>
    <p>3 Tiers: $1.00, $0.20, $0.01 → 5000 tokens</p>
    <p><a href="https://www.x402scan.com/recipient/0x853f424c5eDc170C57caA4De3dB4df0c52877524">View on x402scan</a></p>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kitkat Send running on port ${PORT}`);
});
