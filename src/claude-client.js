/**
 * Claude API client with retry logic and error handling.
 */

async function callClaude({ apiKey, model, systemPrompt, userMessage, maxTokens = 1024, maxRetries = 3 }) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      if (response.status === 429 || response.status >= 500) {
        const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Claude API returned ${response.status}, retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, waitMs));
        lastError = new Error(`API returned ${response.status}`);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();

      if (!data.content || !data.content[0]) {
        throw new Error('Unexpected API response structure: ' + JSON.stringify(data).substring(0, 200));
      }

      return {
        text: data.content[0].text,
        model: data.model || model,
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        stopReason: data.stop_reason
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const waitMs = 1000 * attempt;
        console.log(`Claude API call failed: ${err.message}. Retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }

  throw lastError;
}

module.exports = { callClaude };
