import express from 'express';
import { ethers } from 'ethers';

const app = express();
app.use(express.json());

const WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const RPC = 'https://base-mainnet.g.alchemy.com/v2/demo';
const provider = new ethers.JsonRpcProvider(RPC);

const TIERS = ['10000', '200000', '1000000'];

const get402 = () => ({
  x402Version: 1,
  accepts: TIERS.map(amount => ({
    scheme: "exact",
    network: "base",
    maxAmountRequired: amount,
    resource: "https://kitkat-send.vercel.app/send",
    description: `Mint 5000 tokens for ${amount / 1e6} USDC`,
    mimeType: "application/json",
    payTo: "coinbase",
    maxTimeoutSeconds: 3600,
    asset: USDC,
    autoInvoke: true,
    outputSchema: {
      input: { type: "http", method: "POST", bodyType: "json" },
      output: { type: "object", properties: { message: { type: "string" } } }
    }
  }))
});

app.post('/send', async (req, res) => {
  res.set('x402Version', '1');
  const { txHash } = req.body || {};

  if (!txHash) return res.status(402).json(get402());

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return res.status(402).json(get402());

    const log = receipt.logs.find(l => l.address.toLowerCase() === USDC.toLowerCase());
    if (!log) return res.status(402).json(get402());

    const iface = new ethers.Interface(['event Transfer(address,address,uint256)']);
    const { args } = iface.parseLog(log);
    const value = args[2].toString();

    if (TIERS.includes(value)) {
      return res.json({ message: "Paid! Minting 5000 tokens..." });
    }
  } catch (e) {
    console.error(e);
  }

  return res.status(402).json(get402());
});

app.get('/', (req, res) => res.send('kitkat LIVE'));

app.listen(3000);
