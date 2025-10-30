const express = require('express');
const { ethers } = require('ethers');
const app = express();
app.use(express.json());

const WALLET = '0x853f424c5eDc170C57caA4De3dB4df0c52877524';
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const RESOURCE_URL = 'https://kitkat-send.vercel.app/send';

app.post('/send', async (req, res) => {
  const { txHash } = req.body;

  // === Always set x402Version header ===
  res.set('x402Version', '1');

  // === 402: Return full Accepts array ===
  if (!txHash) {
    return res.status(402).json({
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
  }

  // === Validate txHash ===
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt?.to?.toLowerCase() === USDC.toLowerCase()) {
      const log = receipt.logs.find(l => l.address.toLowerCase() === USDC.toLowerCase());
      if (log) {
        const iface = new ethers.Interface(['event Transfer(address from, address to, uint value)']);
        const e = iface.parseLog(log);
        if (e.args.to.toLowerCase() === WALLET.toLowerCase() && e.args.value >= 1_000_000n) {
          return res.status(200).json({ message: "Send received!" });
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  // === Invalid → Return Accepts again ===
  res.status(402).json({
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: "1000000",
        resource
