// In src/routes/api/debug/jina-stream/+server.js

import { env } from '$env/dynamic/private';
import fetch from 'node-fetch';

export async function GET() {
  const jinaApiKey = env.JINA_API_KEY;
  if (!jinaApiKey) {
    return new Response('<h1>Error: JINA_API_KEY is not configured in .env</h1>', {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }

  // A known URL that should return a lot of text
  const targetUrl = 'https://www.fcc.gov/ecfs/document/10703192295348/1';
  // We use the direct download variant that we know works better
  const jinaTargetUrl = targetUrl.replace('/document/', '/documents/');

  let htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Jina Stream Debugger</title>
      <style>
        body { font-family: monospace; background-color: #1e1e1e; color: #d4d4d4; padding: 20px; }
        h1, h2 { color: #569cd6; }
        pre { background-color: #252526; border: 1px solid #333; padding: 10px; white-space: pre-wrap; word-wrap: break-word; }
        .chunk { border-bottom: 2px dashed #444; margin-bottom: 20px; }
        .meta { color: #4ec9b0; }
        .error { color: #f44747; }
      </style>
    </head>
    <body>
      <h1>Jina Stream Debugger</h1>
      <p><span class="meta">Target URL:</span> ${jinaTargetUrl}</p>
      <h2>Raw Chunks Received:</h2>
  `;

  try {
    const response = await fetch('https://r.jina.ai/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jinaApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-respond-with': 'text',
      },
      body: JSON.stringify({
        url: jinaTargetUrl, // Sending the direct download URL
        headers: { 'Referer': targetUrl } // And the original as the Referer
      }),
      timeout: 90000,
    });

    if (!response.ok) {
      throw new Error(`Jina API failed: ${response.status} ${response.statusText}`);
    }

    let chunkCount = 0;
    for await (const chunk of response.body) {
      chunkCount++;
      const rawChunk = chunk.toString();
      htmlResponse += `
        <div class="chunk">
          <h3><span class="meta">Chunk #${chunkCount}</span> (Size: ${rawChunk.length} chars)</h3>
          <pre>${escapeHtml(rawChunk)}</pre>
        </div>
      `;
    }

    htmlResponse += `<h2><span class="meta">Total Chunks: ${chunkCount}</span></h2>`;

  } catch (error) {
    console.error('Error in Jina debug stream:', error);
    htmlResponse += `<h2 class="error">An Error Occurred:</h2><pre>${escapeHtml(error.stack)}</pre>`;
  }

  htmlResponse += '</body></html>';

  return new Response(htmlResponse, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Helper function to prevent HTML injection from the raw response
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
} 