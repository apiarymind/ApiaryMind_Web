// Wersja Node.js
const apiKey = process.env.GOOGLE_API_KEY;
console.log("Sprawdzam klucz:", apiKey ? "JEST (końcówka: " + apiKey.slice(-4) + ")" : "BRAK");

if (!apiKey) {
  console.error("❌ Brak klucza GOOGLE_API_KEY w zmiennych środowiskowych!");
  console.log("Ustaw klucz: export GOOGLE_API_KEY=twoj_klucz (Linux/Mac) lub set GOOGLE_API_KEY=twoj_klucz (Windows)");
  process.exit(1);
}

// 1. Pobierz listę modeli (To jest zapytanie GET)
const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

(async () => {
  try {
    const response = await fetch(listUrl);
    const data = await response.json();
    
    if (data.models) {
      console.log("✅ SUKCES! Dostępne modele:");
      // Filtrujemy tylko te z 'flash' w nazwie dla czytelności
      const flashes = data.models.filter((m) => m.name && m.name.includes('flash'));
      console.log("\n🔍 Modele z 'flash' w nazwie:");
      console.log(JSON.stringify(flashes, null, 2));
      
      // Sprawdzenie czy nasz model tam jest
      const exists = flashes.some((m) => m.name === 'models/gemini-1.5-flash');
      console.log("\n❓ Czy 'models/gemini-1.5-flash' jest na liście? ->", exists ? "✅ TAK" : "❌ NIE");
      
      // Sprawdź też bez prefiksu models/
      const existsWithoutPrefix = flashes.some((m) => m.name === 'gemini-1.5-flash' || m.name.endsWith('/gemini-1.5-flash'));
      console.log("❓ Czy 'gemini-1.5-flash' (bez prefiksu) jest na liście? ->", existsWithoutPrefix ? "✅ TAK" : "❌ NIE");
      
      // Pokaż wszystkie modele dla pełnego obrazu
      console.log("\n📋 Wszystkie dostępne modele:");
      data.models.forEach((m) => {
        console.log(`  - ${m.name} (${m.displayName || 'brak nazwy'})`);
      });
    } else {
      console.error("❌ Błąd pobierania listy:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("❌ Błąd krytyczny połączenia:", e.message);
  }
})();





