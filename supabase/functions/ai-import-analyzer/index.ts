import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('MY_SERVICE_ROLE_KEY');

const DB_SCHEMA = `
TABELE DOSTĘPNE W SYSTEMIE:
1. apiaries (Pasieki): id, name, location, owner_id
2. hives (Ule): id, hive_number, type, color, apiary_id
3. queens (Matki): id, lineage, breeder_name, year, marking_code, status, hive_id
4. inventory (Magazyn): id, item_name, category, quantity, owner_id
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Brak autoryzacji',
        success: false
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    // Walidacja konfiguracji
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Brak klucza API Gemini',
        success: false
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Brak konfiguracji Supabase',
        success: false
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    // Inicjalizacja klienta Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Autoryzacja użytkownika
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Błąd autoryzacji użytkownika',
        success: false
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    // Parsowanie body
    const body = await req.json()
    const { rows, fileName } = body

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Brak danych do analizy',
        success: false,
        detectedType: 'unknown',
        confidence: 0,
        recordCount: 0,
        mappedData: [],
        columnMapping: {}
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    // Przygotuj prompt dla AI
    const systemPrompt = `${DB_SCHEMA}

Dopasuj te dane z Excela do powyższego schematu bazy. Zwróć JSON z nazwą tabeli i mapowaniem kolumn.

INSTRUKCJE:
1. Rozpoznaj typ danych (hives, inspections, queens, inventory) na podstawie kolumn i zawartości
2. Zmapuj kolumny użytkownika na kolumny systemowe zgodnie ze schematem
3. Zwróć TYLKO JSON bez dodatkowego tekstu

PRZYKŁADY MAPOWANIA:
- "Numer ula", "Ul", "Hive", "Nr" -> hive_number
- "Pasieka", "Apiary", "Nazwa pasieki" -> apiary_name
- "Matka", "Queen", "Oznakowanie" -> marking_code
- "Rasa", "Linia", "Breed", "Lineage" -> lineage
- "Rok", "Year" -> year
- "Data", "Date", "Data przeglądu" -> inspection_date
- "Nazwa", "Item", "Przedmiot" -> item_name
- "Ilość", "Quantity" -> quantity

FORMAT ODPOWIEDZI (JSON):
{
  "detectedType": "hives|inspections|queens|inventory|unknown",
  "confidence": 0-100,
  "columnMapping": {"user_column": "system_column"},
  "mappedData": [...]
}`;

    // Przygotuj dane do analizy (pierwsze 3 wiersze zgodnie z wymaganiami)
    const sampleRows = rows.slice(0, 3);
    const dataSample = JSON.stringify(sampleRows);

    // Wywołanie Google Gemini API
    const prompt = `${systemPrompt}\n\nDANE Z PLIKU "${fileName || 'import'}":\n${dataSample}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return new Response(JSON.stringify({ 
        error: 'Brak odpowiedzi z AI',
        success: false,
        detectedType: 'unknown',
        confidence: 0,
        recordCount: 0,
        mappedData: [],
        columnMapping: {}
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    // Parsuj odpowiedź AI
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Jeśli nie jest JSON, spróbuj wyciągnąć JSON z tekstu
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Nie udało się sparsować odpowiedzi AI');
      }
    }

    // Jeśli AI zwróciło tylko mapowanie, zastosuj je do wszystkich wierszy
    let mappedData = parsed.mappedData || [];
    if (parsed.columnMapping && Object.keys(parsed.columnMapping).length > 0 && mappedData.length === 0) {
      // Zastosuj mapowanie do wszystkich wierszy
      mappedData = rows.map((row: any) => {
        const mapped: any = {};
        Object.entries(row).forEach(([key, value]) => {
          const systemKey = parsed.columnMapping[key] || parsed.columnMapping[key.toLowerCase()] || key;
          mapped[systemKey] = value;
        });
        return mapped;
      });
    } else if (parsed.columnMapping && Object.keys(parsed.columnMapping).length > 0 && mappedData.length < rows.length) {
      // Jeśli AI zwróciło tylko próbkę, zastosuj mapowanie do wszystkich wierszy
      mappedData = rows.map((row: any) => {
        const mapped: any = {};
        Object.entries(row).forEach(([key, value]) => {
          const systemKey = parsed.columnMapping[key] || parsed.columnMapping[key.toLowerCase()] || key;
          mapped[systemKey] = value;
        });
        return mapped;
      });
    }

    return new Response(JSON.stringify({
      success: true,
      detectedType: parsed.detectedType || 'unknown',
      confidence: parsed.confidence || 0,
      recordCount: mappedData.length,
      mappedData: mappedData,
      columnMapping: parsed.columnMapping || {},
    }), { 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      } 
    })

  } catch (error: any) {
    console.error('Błąd w ai-import-analyzer:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Wystąpił nieoczekiwany błąd',
      success: false,
      detectedType: 'unknown',
      confidence: 0,
      recordCount: 0,
      mappedData: [],
      columnMapping: {}
    }), { 
      status: 500, 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      } 
    })
  }
})
