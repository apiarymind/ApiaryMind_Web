import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GOOGLE_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
    }})
  }

  try {
    if (!API_KEY) {
      return new Response(JSON.stringify({ 
        error: "Brak klucza GOOGLE_API_KEY",
        hint: "Ustaw zmienną środowiskową GOOGLE_API_KEY w Supabase"
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    console.log("🔍 Sprawdzam klucz API (końcówka):", API_KEY.slice(-4));

    // 1. Pobierz listę modeli (GET request)
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
    console.log("📡 Wywołuję:", listUrl);

    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json();

    if (!listResponse.ok) {
      return new Response(JSON.stringify({ 
        error: "Błąd pobierania listy modeli",
        status: listResponse.status,
        details: listData
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    if (listData.models) {
      // Filtruj modele z 'flash' w nazwie
      const flashes = listData.models.filter((m: any) => m.name && m.name.includes('flash'));
      
      // Sprawdź czy nasz model istnieje
      const exactMatch = flashes.some((m: any) => m.name === 'models/gemini-1.5-flash');
      const partialMatch = flashes.some((m: any) => 
        m.name === 'gemini-1.5-flash' || m.name.endsWith('/gemini-1.5-flash')
      );

      // Test generateContent (POST request)
      const MODEL = 'gemini-1.5-flash';
      const generateUrl = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;
      
      const testResponse = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Test" }]
          }]
        })
      });

      const testData = await testResponse.json();

      return new Response(JSON.stringify({
        success: true,
        apiKeyPresent: true,
        apiKeyEnding: API_KEY.slice(-4),
        availableModels: {
          total: listData.models.length,
          flashModels: flashes.map((m: any) => m.name),
          exactMatch: exactMatch ? "✅ TAK" : "❌ NIE",
          partialMatch: partialMatch ? "✅ TAK" : "❌ NIE"
        },
        generateContentTest: {
          url: generateUrl,
          method: "POST",
          status: testResponse.status,
          statusText: testResponse.statusText,
          response: testData
        },
        allModels: listData.models.map((m: any) => ({
          name: m.name,
          displayName: m.displayName || 'brak nazwy'
        }))
      }, null, 2), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    } else {
      return new Response(JSON.stringify({ 
        error: "Nieprawidłowa odpowiedź z API",
        response: listData
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: "Błąd krytyczny",
      message: error.message,
      stack: error.stack
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    })
  }
})





