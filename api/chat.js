// api/chat.js — Vercel serverless function with logging

import { Redis } from '@upstash/redis';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

// Init Redis (Vercel/Upstash)
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const ORDERS = {
  '1001': { order_id: '1001', customer_name: 'John Smith', product_name: 'Wireless Headphones', status: 'Shipped', order_date: '2025-01-10', estimated_delivery: '2025-01-15', tracking_number: 'TRK123456789' },
  '1002': { order_id: '1002', customer_name: 'Sarah Johnson', product_name: 'Smart Watch', status: 'Processing', order_date: '2025-01-12', estimated_delivery: '2025-01-20', tracking_number: null },
  '1003': { order_id: '1003', customer_name: 'Mike Brown', product_name: 'Bluetooth Speaker', status: 'Delivered', order_date: '2025-01-05', estimated_delivery: '2025-01-09', tracking_number: 'TRK987654321' },
  '1004': { order_id: '1004', customer_name: 'Emily Davis', product_name: 'Laptop Stand', status: 'Shipped', order_date: '2025-01-11', estimated_delivery: '2025-01-16', tracking_number: 'TRK456789123' },
  '1005': { order_id: '1005', customer_name: 'David Wilson', product_name: 'USB-C Hub', status: 'Cancelled', order_date: '2025-01-08', estimated_delivery: '2025-01-12', tracking_number: null },
};

const KNOWLEDGE_BASE = `
STORE POLICIES

Shipping Policy:
- Standard shipping takes 3-5 business days.
- Express shipping takes 1-2 business days.
- Free standard shipping on orders over $50.
- We ship to all addresses within the United States.
- International shipping is not available at this time.

Return Policy:
- Items can be returned within 30 days of delivery.
- Items must be unused and in original packaging.
- To start a return, contact support with your order ID.
- Refunds are processed within 5-7 business days after we receive the item.
- Return shipping is free for defective items, otherwise the customer pays.

Warranty Policy:
- All electronics come with a 1-year manufacturer warranty.
- Warranty covers manufacturing defects, not accidental damage.
- To claim warranty, contact support with your order ID and a description of the issue.

Payment Methods:
- We accept Visa, Mastercard, American Express, and PayPal.
- We do not accept cash on delivery.

Order Cancellation:
- Orders can be cancelled within 2 hours of placing them.
- After 2 hours, orders cannot be cancelled but can be returned once delivered.

Contact:
- Email: support@volt-store.com
- Phone: 1-800-555-0199
- Hours: Monday to Friday, 9 AM to 5 PM EST.
`;

async function callGroq(messages, temperature = 0.3) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function searchKnowledgeBase(query) {
  const queryLower = query.toLowerCase();
  const sections = KNOWLEDGE_BASE.split('\n\n');
  let bestSection = '';
  let bestScore = 0;
  for (const section of sections) {
    const score = queryLower
      .split(/\s+/)
      .filter((word) => word.length > 2 && section.toLowerCase().includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      bestSection = section;
    }
  }
  return bestSection || KNOWLEDGE_BASE;
}

// Log the interaction to Redis (fire-and-forget — never blocks the reply)
async function logInteraction(intent, question, resolved) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      intent,
      question: question.slice(0, 200),
      resolved,
    };
    await redis.lpush('chat:logs', JSON.stringify(entry));
    await redis.ltrim('chat:logs', 0, 199); // keep the last 200 entries
  } catch (err) {
    console.error('Logging failed:', err);
    // Don't throw — logging should never break the chat
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { message } = body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const classificationPrompt = `You are a customer support agent for an online store.
You have access to two tools:
1. order_status: use this when the user asks about a specific order. Extract the order ID (like 1001).
2. policy_question: use this when the user asks about store policies.

Respond ONLY with a JSON object in one of these formats:
- {"action": "order_status", "order_id": "1001"}
- {"action": "policy_question", "question": "the user's question"}

No other text.`;

    const classificationRaw = await callGroq(
      [
        { role: 'system', content: classificationPrompt },
        { role: 'user', content: message },
      ],
      0
    );

    let intent;
    try {
      let cleaned = classificationRaw;
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      intent = JSON.parse(cleaned);
    } catch {
      intent = { action: 'policy_question', question: message };
    }

    let reply;
    let intentType = intent.action;
    let resolved = true;

    if (intent.action === 'order_status' && intent.order_id) {
      const order = ORDERS[String(intent.order_id)];
      if (!order) {
        reply = `I couldn't find an order with ID ${intent.order_id}. Please double-check the number.`;
        resolved = false;
      } else {
        const context = `Order ID: ${order.order_id}
Customer: ${order.customer_name}
Product: ${order.product_name}
Status: ${order.status}
Order date: ${order.order_date}
Estimated delivery: ${order.estimated_delivery}
Tracking number: ${order.tracking_number || 'Not available yet'}`;

        reply = await callGroq([
          {
            role: 'user',
            content: `You are a helpful customer support agent. Use the following order information to answer the user's question. Be concise and friendly.\n\nOrder details:\n${context}\n\nUser question: ${message}`,
          },
        ]);
      }
    } else {
      const question = intent.question || message;
      const context = searchKnowledgeBase(question);
      reply = await callGroq([
        {
          role: 'user',
          content: `You are a helpful customer support agent. Use the following store policy to answer the user's question. If the answer isn't in the policy, politely say you don't have that information.\n\nStore policy excerpt:\n${context}\n\nUser question: ${question}`,
        },
      ]);
    }

    // Log AFTER the reply is ready, but don't await it — return fast
    logInteraction(intentType, message, resolved);

    return res.status(200).json({ reply, intent: intentType });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}