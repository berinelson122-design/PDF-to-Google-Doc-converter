export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    geminiConfigured,
    platform: 'vercel',
  });
}
