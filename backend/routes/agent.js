// backend/routes/agent.js
// POST /api/agent/chat — Super Support Agent endpoint

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { classifyIntent } from '../services/agent/intentClassifier.js';
import { assembleContext } from '../services/agent/contextAssembler.js';
import { buildSystemPrompt, buildContentSection } from '../services/agent/promptBuilder.js';
import { logAgentInteraction } from '../services/agent/auditLogger.js';

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/agent/chat
 * Body: { message, sessionId, conversationHistory?, clientId? }
 * Auth: Bearer JWT token
 */
router.post('/chat', async (req, res) => {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { message, sessionId = 'default', conversationHistory = [], clientId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 2. Resolve user identity + role
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, full_name, email, is_coach')
      .eq('id', authUser.id)
      .single();

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userRecord.id;
    const role = userRecord.is_coach ? 'coach' : 'client';

    // 3. Classify intent
    const intent = classifyIntent(message);

    // 4. Assemble minimum required context
    const { context, tablesAccessed, rowsRetrieved } = await assembleContext(
      userId, role, intent, { clientId }
    );

    // 5. Build prompts
    const systemPrompt = buildSystemPrompt(context, role);
    const contentSection = buildContentSection(context);
    const fullSystemPrompt = contentSection
      ? `${systemPrompt}\n${contentSection}`
      : systemPrompt;

    // 6. Build conversation messages
    const messages = [
      { role: 'system', content: fullSystemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 exchanges for context
      { role: 'user', content: message }
    ];

    // 7. Call OpenAI with streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let promptTokens = 0;
    let completionTokens = 0;
    let fullResponse = '';

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1200,
      temperature: 0.5,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }
    }

    // Estimate tokens if not returned
    if (!promptTokens) {
      promptTokens = Math.ceil(fullSystemPrompt.length / 4);
      completionTokens = Math.ceil(fullResponse.length / 4);
    }

    // Send completion signal with metadata
    res.write(`data: ${JSON.stringify({
      type: 'done',
      intent,
      rows_retrieved: rowsRetrieved,
      content_scope: context.content_scope || null,
    })}\n\n`);
    res.end();

    // 8. Audit log (non-blocking)
    logAgentInteraction({
      userId,
      role,
      sessionId,
      intent,
      tablesAccessed,
      rowsRetrieved,
      promptTokens,
      completionTokens,
      model: 'gpt-4o',
    });

  } catch (err) {
    console.error('[/api/agent/chat] Error:', err);

    // If streaming has started, send error via stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Agent error occurred' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Agent error', details: err.message });
    }
  }
});

export default router;
