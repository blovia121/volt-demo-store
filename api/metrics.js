// api/metrics.js — Vercel serverless function that returns dashboard metrics

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch the last 200 logs (newest first)
    const rawLogs = await redis.lrange('chat:logs', 0, 199);

    // Parse each entry
    const logs = rawLogs
      .map((item) => {
        try {
          return typeof item === 'string' ? JSON.parse(item) : item;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Compute metrics
    const total = logs.length;
    const orderQueries = logs.filter((l) => l.intent === 'order_status').length;
    const policyQueries = logs.filter((l) => l.intent === 'policy_question').length;
    const resolved = logs.filter((l) => l.resolved).length;

    // Assume 3 minutes saved per resolved interaction
    const minutesSaved = resolved * 3;

    // Automation rate
    const automationRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return res.status(200).json({
      total,
      orderQueries,
      policyQueries,
      resolved,
      minutesSaved,
      automationRate,
      recent: logs.slice(0, 20), // last 20 for the table
    });
  } catch (error) {
    console.error('Metrics API error:', error);
    return res.status(500).json({ error: 'Failed to load metrics.' });
  }
}