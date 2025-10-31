{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "base",
      "maxAmountRequired": "1000000",
      "resource": "https://kitkat-send.vercel.app/send",
      "description": "Send 1 USDC",
      "mimeType": "application/json",
      "payTo": "coinbase",
      "maxTimeoutSeconds": 3600,
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "autoInvoke": true,
      "outputSchema": {
        "input": { "type": "http", "method": "POST", "bodyType": "json" },
        "output": { "type": "object", "properties": { "message": { "type": "string" } } }
      }
    }
  ]
}
