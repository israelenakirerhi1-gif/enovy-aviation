const express = require('express');
const { callClaude } = require('../lib/claude');
const { toolDefs, executeTool } = require('../lib/chatTools');
const { fallbackReply } = require('../lib/chatFallback');

const router = express.Router();

const SYSTEM_PROMPT = `You are the ENOVY Air customer support assistant for ENOVY GLOBAL LTD, a
Nigeria-based airline and logistics company. You help customers search flights, check and cancel
bookings, and get connected to a human when needed.

Rules:
- Use search_flights for any question about routes, prices, times, or seat availability. Never
  invent flight numbers, prices, or times — always call the tool.
- Use check_booking_status only after you have BOTH the booking reference (format ENV-XXXXXX) and
  the email used to book. Ask for whichever is missing before calling it.
- Use cancel_booking only after the customer has clearly confirmed they want to cancel, and only
  once you have a matching reference and email.
- If you can't resolve something, or the customer asks for a human, call create_support_ticket
  with their name, email, and a short summary, then let them know a human will follow up by email.
- Be concise, warm, and honest. If you don't know something, say so or escalate — don't guess.`;

router.post('/', async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Keep requests small and bounded regardless of what the client sends.
  const trimmed = messages.slice(-16).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 4000)
  }));
  const lastUserText = [...trimmed].reverse().find(m => m.role === 'user')?.content || '';

  if (!process.env.ANTHROPIC_API_KEY) {
    const reply = await fallbackReply(lastUserText);
    return res.json({ reply, mode: 'fallback' });
  }

  try {
    let convo = trimmed.slice();
    let finalText = null;

    for (let i = 0; i < 5 && finalText === null; i++) {
      const resp = await callClaude(convo, toolDefs, SYSTEM_PROMPT);

      if (resp.stop_reason === 'tool_use') {
        const toolResultBlocks = [];
        for (const block of resp.content) {
          if (block.type === 'tool_use') {
            const result = await executeTool(block.name, block.input || {});
            toolResultBlocks.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
          }
        }
        convo.push({ role: 'assistant', content: resp.content });
        convo.push({ role: 'user', content: toolResultBlocks });
      } else {
        finalText = (resp.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      }
    }

    if (!finalText) finalText = "I'm having trouble completing that right now — let me flag this for a human agent instead.";
    res.json({ reply: finalText, mode: 'ai' });
  } catch (err) {
    console.error('Chat AI mode failed, using fallback:', err.message);
    const reply = await fallbackReply(lastUserText);
    res.json({ reply, mode: 'fallback' });
  }
});

module.exports = router;
