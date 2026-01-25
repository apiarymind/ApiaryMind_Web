const apiKey = process.env.GOOGLE_API_KEY || Deno.env.get('GOOGLE_API_KEY');
console.log("Sprawdzam klucz:", apiKey ? "JEST (końcówka: " + apiKey.slice(-4) + ")" : "BRAK");

// 1. Pobierz listę modeli (To jest zapytanie GET)
const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

try {
  const response = await fetch(listUrl);
  const data = await response.json();
  
  if (data.models) {
    console.log("✅ SUKCES! Dostępne modele:");
    // Filtrujemy tylko te z 'flash' w nazwie dla czytelności
    const flashes = data.models.filter((m: any) => m.name.includes('flash'));
    console.log(JSON.stringify(flashes, null, 2));
    
    // Sprawdzenie czy nasz model tam jest
    const exists = flashes.some((m: any) => m.name === 'models/gemini-1.5-flash');
    console.log("Czy gemini-1.5-flash jest na liście? ->", exists ? "TAK" : "NIE");
    
    // Pokaż wszystkie modele dla pełnego obrazu
    console.log("\n📋 Wszystkie dostępne modele:");
    data.models.forEach((m: any) => {
      console.log(`  - ${m.name} (${m.displayName || 'brak nazwy'})`);
    });
  } else {
    console.error("❌ Błąd pobierania listy:", data);
  }
} catch (e) {
  console.error("❌ Błąd krytyczny połączenia:", e);
}





