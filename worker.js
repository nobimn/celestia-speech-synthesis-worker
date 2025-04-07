/**
 * Cloudflare Worker for text-to-speech using @cf/myshell-ai/melotts model
 */
export default {
  async fetch(request, env, ctx) {
    // Set CORS headers to allow cross-origin requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, Authorization"
    };

    // Handle OPTIONS request for CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Check API key
    const apiKey = request.headers.get('X-Api-Key') || request.headers.get('Authorization');
    const validApiKey = env.API_KEY;
    
    // If API key is not valid, return 401 Unauthorized
    if (!apiKey || apiKey !== validApiKey) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing API key" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    try {
      // Parse request body
      const requestData = await request.json();
      
      // Validate request parameters
      if (!requestData.prompt) {
        return new Response(JSON.stringify({ error: "Missing prompt parameter" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      
      // Limit text length to prevent abuse
      const maxLength = 3000;
      const prompt = requestData.prompt.slice(0, maxLength);
      
      // Get language parameter or default to English
      const lang = requestData.lang || 'en';
      
      console.log(`Generating speech for text (${prompt.length} chars) in language: ${lang}`);
      
      // Call Cloudflare AI API to generate speech
      const result = await env.AI.run('@cf/myshell-ai/melotts', {
        prompt: prompt,
        lang: lang
      });

      // Return audio data as base64 string
      return new Response(JSON.stringify({ 
        audio: result.audio 
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error('Error generating speech:', error);
      
      return new Response(JSON.stringify({ 
        error: "Failed to generate speech",
        details: error.message 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
};
