import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function analyzeChat(text?: string, imageUrls?: string[]) {
  const analysisPrompt = `These are screenshots or text from a dating app or messaging conversation.
Extract the following and return ONLY valid JSON with no explanation or markdown:
{
  "conversationSummary": "2-3 sentence summary of what was discussed",
  "interestScore": <number 1-10>,
  "interestReason": "one sentence explaining the score based on behavioral signals",
  "signals": {
    "initiatesTopics": <boolean>,
    "asksQuestions": <boolean>,
    "suggestsPlans": <boolean>,
    "replyLength": "short" | "medium" | "long"
  },
  "keyTopicsDiscussed": ["topic1", "topic2"],
  "suggestedFollowUpAngle": "one sentence on what to bring up next",
  "extractedFacts": {
    "mentionedAvailability": <string | null>,
    "mentionedPlans": <string | null>,
    "anyRedFlags": <string | null>
  }
}
Be honest. If she seems disinterested, say so.`;

  const content: Anthropic.MessageParam['content'] = [];

  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      content.push({ type: 'image', source: { type: 'url', url } });
    }
  }

  if (text) {
    content.push({ type: 'text', text: `Conversation text:\n${text}` });
  }

  content.push({ type: 'text', text: analysisPrompt });

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content }],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text;
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
}

export async function parseVoiceMemo(transcript: string) {
  const systemPrompt = `You are parsing a voice memo about a dating conversation.
Extract structured data and return ONLY valid JSON. No explanation, no markdown.

If this describes a new person, return:
{
  "action": "create",
  "person": {
    "name": <string>,
    "age": <number | null>,
    "nationality": <string | null>,
    "heightCm": <number | null>,
    "attractiveness": <number | null>,
    "platform": <string — use "unknown" if not mentioned>,
    "drinks": <boolean | null>,
    "profession": <string | null>,
    "status": "ACTIVE" | "NEEDS_PING" | "GHOSTED" | "ARCHIVED",
    "dealBreakers": <string[]>,
    "greenFlags": <string[]>,
    "dateNotes": <string | null>,
    "lastContactDate": <ISO date string | null>,
    "followUpDate": <ISO date string | null>,
    "followUpNote": <string | null>
  },
  "interactionSummary": <string | null>
}

If this is an update to an existing person, return:
{
  "action": "update",
  "personNameHint": <string>,
  "updates": { <only the fields that changed> },
  "interactionSummary": <string | null>
}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: transcript }],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text;
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
}

export async function extractNameFromPhotos(imageUrls: string[]): Promise<string | null> {
  const content: Anthropic.MessageParam['content'] = [];
  for (const url of imageUrls) {
    content.push({ type: 'image', source: { type: 'url', url } });
  }
  content.push({
    type: 'text',
    text: 'These are profile photos from a dating app. Look for the person\'s name anywhere visible — in the profile bio, name field, or any overlay text. Return ONLY the first name as plain text with no punctuation or explanation. If no name is visible, return the single word: null',
  });

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 64,
    messages: [{ role: 'user', content }],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
  if (!raw || raw.toLowerCase() === 'null') return null;
  return raw;
}

export async function suggestFollowup(personContext: {
  name: string;
  lastContactDate?: Date | null;
  lastSummary?: string | null;
  dateNotes?: string | null;
  greenFlags?: string[];
  followUpNote?: string | null;
}) {
  const prompt = `Here is context about someone I've been talking to:

Name: ${personContext.name}
Last talked: ${personContext.lastContactDate?.toDateString() ?? 'unknown'}
Last conversation summary: ${personContext.lastSummary ?? 'none'}
Date notes: ${personContext.dateNotes ?? 'none'}
Green flags: ${personContext.greenFlags?.join(', ') ?? 'none'}
Follow-up note: ${personContext.followUpNote ?? 'none'}

Write one specific, natural follow-up message I could send.
Keep it casual and short. Reference something real from our conversations.
Do not use generic openers. Do not explain your reasoning.
Just write the message.`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  return (response.content[0] as Anthropic.TextBlock).text.trim();
}
