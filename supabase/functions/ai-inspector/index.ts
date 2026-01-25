import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('MY_SERVICE_ROLE_KEY');

const APIARY_MIND_INFO = `Apiary Mind: System zarządzania pasieką.`

const DB_SCHEMA = `
RELACJE:
1. apiaries (id, owner_id) -> Pasieki użytkownika.
2. hives (id, apiary_id) -> Ule należące do pasiek.
3. treatments_log (hive_id, medication_name, withdrawal_end_date) -> Karencje leków.
4. inspections (hive_id, colony_strength, pests_detected, inspection_date) -> Przeglądy uli.
5. apiary_tasks (user_id, task_description, due_date, status) -> Zadania użytkownika.
6. products (owner_id, name, stock) -> Produkty użytkownika.
7. inventory (owner_id, item_name, quantity) -> Sprzęt użytkownika.
`

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
    // Bezpieczne parsowanie body requesta
    let note_text = ''
    let current_date: string | undefined = undefined
    
    try {
      const body = await req.json()
      note_text = body?.note_text || body?.message || body?.text || ''
      current_date = body?.current_date
    } catch (parseError) {
      // Jeśli nie ma body lub jest nieprawidłowe, kontynuuj z pustym tekstem
      console.warn('Nie udało się sparsować body requesta:', parseError)
    }
    
    const authHeader = req.headers.get('Authorization')

    // Obsługa niezalogowanych użytkowników
    if (!authHeader) {
      if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ 
          error: 'Brak klucza API Gemini!',
          chat_message: 'System wymaga autoryzacji. Zaloguj się, aby korzystać z BiBi.'
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
        })
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ 
            parts: [{ 
              text: `Jesteś BiBi - asystent pszczelarski w systemie Apiary Mind. 
              Opisz krótko system Apiary Mind jako narzędzie do zarządzania pasieką. 
              Powiedz, że do pełnej funkcjonalności wymagane jest zalogowanie.` 
            }] 
          }] 
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Błąd API Gemini: ${errorData.error?.message || response.statusText}`)
      }
      
      const data = await response.json()
      const message = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Witaj w Apiary Mind!'
      
      return new Response(JSON.stringify({ chat_message: message }), { 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      })
    }

    // Walidacja konfiguracji
    if (!GEMINI_API_KEY) {
      throw new Error('Brak klucza API Gemini!')
    }
    
    if (!SUPABASE_URL) {
      throw new Error("Brak konfiguracji SUPABASE_URL!")
    }
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Brak konfiguracji MY_SERVICE_ROLE_KEY")
    }

    // Inicjalizacja klienta Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Autoryzacja użytkownika
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error("Błąd autoryzacji użytkownika")
    }

    // Pobieranie profilu użytkownika do sprawdzenia roli
    let userProfile: any = null
    let isOwner = false
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, system_role, role')
        .eq('id', user.id)
        .single()
      
      if (!profileError && profileData) {
        userProfile = profileData
        // Sprawdzamy czy użytkownik jest właścicielem pasiek
        const { count } = await supabase
          .from('apiaries')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('is_deleted', false)
        
        isOwner = (count || 0) > 0
      }
    } catch (profileErr: any) {
      console.error('Błąd pobierania profilu użytkownika:', profileErr)
    }
    
    const userSystemRole = userProfile?.system_role || userProfile?.role || 'USER'
    const isSystemAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userSystemRole?.toUpperCase())
    // Administratorzy i pomocnicy (nie-właściciele) nie mogą mieć dostępu do danych finansowych
    const canAccessFinancialData = isOwner && !isSystemAdmin

    // Przygotowanie dat
    let todayISO: string
    try {
      todayISO = current_date || new Date().toISOString()
    } catch (dateError) {
      todayISO = new Date().toISOString()
    }
    
    let dateLookback: string
    try {
      dateLookback = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    } catch (dateError) {
      dateLookback = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Pobieranie pasiek użytkownika
    let apiariesData: any[] | null = null
    let apiariesCount = 0
    
    try {
      const apiariesRes = await supabase
        .from('apiaries')
        .select('id, name', { count: 'exact' })
        .eq('owner_id', user.id)
        .eq('is_deleted', false)

      if (apiariesRes.error) {
        console.error('Błąd pobierania pasiek:', apiariesRes.error)
      } else {
        apiariesData = apiariesRes.data
        apiariesCount = apiariesRes.count || 0
      }
    } catch (error: any) {
      console.error('Nieoczekiwany błąd przy pobieraniu pasiek:', error)
    }

    const apiaryIds = apiariesData ? apiariesData.map(a => a.id) : []
    const apiaryNames = apiariesData && apiariesData.length > 0 
      ? apiariesData.map(a => a.name).join(', ') 
      : 'Brak pasiek'

    // Pobieranie uli
    let hivesCount = 0
    let hiveIds: string[] = []
    let hivesData: any[] = []
    
    if (apiaryIds.length > 0) {
      try {
        const { data: hivesDataRes, error: hivesError, count: hivesCountRes } = await supabase
          .from('hives')
          .select('id, hive_number, apiary_id', { count: 'exact' })
          .in('apiary_id', apiaryIds)
        
        if (hivesError) {
          console.error('Błąd pobierania uli:', hivesError)
        } else {
          hivesCount = hivesCountRes || 0
          hiveIds = hivesDataRes ? hivesDataRes.map(h => h.id) : []
          hivesData = hivesDataRes || []
        }
      } catch (error: any) {
        console.error('Nieoczekiwany błąd przy pobieraniu uli:', error)
      }
    }

    // Pobieranie danych z bazy (równolegle) z obsługą błędów
    let productsRes: any = { data: null, error: null }
    let inventoryRes: any = { data: null, error: null }
    let tasksRes: any = { data: null, error: null }
    let treatmentsRes: any = { data: null, error: null }
    let inspectionsRes: any = { data: null, error: null }

    try {
      const results = await Promise.allSettled([
        supabase
          .from('products')
          .select('name, stock')
          .eq('owner_id', user.id),
        supabase
          .from('inventory')
          .select('item_name, quantity')
          .eq('owner_id', user.id),
        supabase
          .from('apiary_tasks')
          .select('task_description, due_date, status, priority')
          .neq('status', 'DONE')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(10),
        hiveIds.length > 0
          ? supabase
              .from('treatments_log')
              .select('hive_id, medication_name, withdrawal_end_date, application_date, removal_date, is_removed')
              .in('hive_id', hiveIds)
              .gt('withdrawal_end_date', todayISO)
              .order('withdrawal_end_date', { ascending: true })
          : Promise.resolve({ data: null, error: null }),
        hiveIds.length > 0
          ? supabase
              .from('inspections')
              .select('hive_id, pests_detected, inspection_date, colony_strength, mood, is_queen_seen')
              .in('hive_id', hiveIds)
              .gt('inspection_date', dateLookback)
              .order('inspection_date', { ascending: false })
              .limit(2000)
          : Promise.resolve({ data: null, error: null })
      ])

      // Przetwarzanie wyników
      productsRes = results[0].status === 'fulfilled' ? results[0].value : { data: null, error: results[0].reason }
      inventoryRes = results[1].status === 'fulfilled' ? results[1].value : { data: null, error: results[1].reason }
      tasksRes = results[2].status === 'fulfilled' ? results[2].value : { data: null, error: results[2].reason }
      treatmentsRes = results[3].status === 'fulfilled' ? results[3].value : { data: null, error: results[3].reason }
      inspectionsRes = results[4].status === 'fulfilled' ? results[4].value : { data: null, error: results[4].reason }

      // Logowanie błędów (ale nie przerywamy działania)
      if (productsRes.error) console.error('Błąd pobierania produktów:', productsRes.error)
      if (inventoryRes.error) console.error('Błąd pobierania magazynu:', inventoryRes.error)
      if (tasksRes.error) console.error('Błąd pobierania zadań:', tasksRes.error)
      if (treatmentsRes.error) console.error('Błąd pobierania karencji:', treatmentsRes.error)
      if (inspectionsRes.error) console.error('Błąd pobierania przeglądów:', inspectionsRes.error)
    } catch (error: any) {
      console.error('Błąd podczas pobierania danych z bazy:', error)
      // Kontynuujemy z pustymi danymi
    }

    // Przetwarzanie danych o karencji
    const activeTreatments = treatmentsRes.data || []
    const hivesWithKarencja = new Set(activeTreatments.map(t => t.hive_id)).size
    const pendingRemovals = activeTreatments.filter(t => 
      t.removal_date && !t.is_removed && new Date(t.removal_date) <= new Date(todayISO)
    )

    // Mapowanie uli do numerów dla czytelności
    const hiveNumberMap = new Map(hivesData.map(h => [h.id, h.hive_number]))

    // Przetwarzanie przeglądów - najnowsze dla każdego ula
    const uniqueHivesMap = new Map()
    if (inspectionsRes.data) {
      inspectionsRes.data.forEach((ins) => {
        if (!uniqueHivesMap.has(ins.hive_id)) {
          uniqueHivesMap.set(ins.hive_id, {
            id: ins.hive_id,
            hive_number: hiveNumberMap.get(ins.hive_id) || ins.hive_id,
            strength: ins.colony_strength,
            pests: Array.isArray(ins.pests_detected) 
              ? ins.pests_detected.join(', ') 
              : (ins.pests_detected || 'brak'),
            date: ins.inspection_date,
            mood: ins.mood,
            queen_seen: ins.is_queen_seen
          })
        }
      })
    }
    const apiarySnapshot = Array.from(uniqueHivesMap.values())

    // Przygotowanie danych o magazynie (szczegółowe dla modułu logistyki)
    const fullInventory = [
      ...(productsRes.data || []).map(p => `${p.name}:${p.stock || 0}`),
      ...(inventoryRes.data || []).map(i => `${i.item_name}:${i.quantity || 0}`)
    ]
    
    // Mapowanie leków dla szybkiego wyszukiwania
    const medicationMap = new Map<string, number>()
    ;[...(productsRes.data || []), ...(inventoryRes.data || [])].forEach(item => {
      const name = item.name || item.item_name || ''
      const quantity = item.stock || item.quantity || 0
      const lowerName = name.toLowerCase()
      // Mapowanie popularnych nazw leków
      if (lowerName.includes('apiwarol') || lowerName.includes('kwas') || lowerName.includes('kwasek')) {
        medicationMap.set('kwas', (medicationMap.get('kwas') || 0) + quantity)
      }
      if (lowerName.includes('biowar') || lowerName.includes('biovar')) {
        medicationMap.set('biowar', (medicationMap.get('biowar') || 0) + quantity)
      }
      if (lowerName.includes('bayvarol') || lowerName.includes('bayvar')) {
        medicationMap.set('bayvarol', (medicationMap.get('bayvarol') || 0) + quantity)
      }
      if (lowerName.includes('formivar') || lowerName.includes('formic')) {
        medicationMap.set('formivar', (medicationMap.get('formivar') || 0) + quantity)
      }
      if (lowerName.includes('apiguard') || lowerName.includes('thymol')) {
        medicationMap.set('apiguard', (medicationMap.get('apiguard') || 0) + quantity)
      }
      medicationMap.set(name.toLowerCase(), quantity)
    })

    // Przygotowanie szczegółów karencji
    const karencjaDetails = activeTreatments.length > 0
      ? activeTreatments.map(t => {
          const hiveNum = hiveNumberMap.get(t.hive_id) || t.hive_id
          const removalInfo = t.removal_date && !t.is_removed 
            ? ` [WYMAGANE USUNIĘCIE: ${t.removal_date}]` 
            : ''
          return `- Ul ${hiveNum}: ${t.medication_name} (karencja do ${t.withdrawal_end_date})${removalInfo}`
        }).join('\n')
      : 'Brak aktywnych karencji'

    // Przygotowanie zadań
    const tasksDetails = tasksRes.data && tasksRes.data.length > 0
      ? tasksRes.data.map(t => {
          const dueInfo = t.due_date ? ` (termin: ${t.due_date})` : ' (bez terminu)'
          return `- ${t.task_description}${dueInfo} [${t.status || 'pending'}]`
        }).join('\n')
      : 'Brak aktywnych zadań'

    // Budowa kontekstu dla AI z walidacją
    const userRoleInfo = canAccessFinancialData
      ? 'Użytkownik jest właścicielem pasiek i może mieć dostęp do danych finansowych.'
      : `UWAGA: Użytkownik jest ${userSystemRole} i ${isOwner ? 'właścicielem' : 'NIE jest właścicielem'} pasiek. ZAKAZ DOSTĘPU DO DANYCH FINANSOWYCH.`
    
    // Lista pasiek dla walidacji
    const apiariesList = apiariesData && apiariesData.length > 0
      ? apiariesData.map(a => `"${a.name}" (id: ${a.id})`).join(', ')
      : 'BRAK PASIEK'
    
    // Lista uli z przypisaniem do pasiek dla walidacji
    const hivesByApiary = new Map<string, string[]>()
    hivesData.forEach(h => {
      const apiaryName = apiariesData?.find(a => a.id === h.apiary_id)?.name || 'Nieznana'
      if (!hivesByApiary.has(apiaryName)) {
        hivesByApiary.set(apiaryName, [])
      }
      hivesByApiary.get(apiaryName)?.push(h.hive_number)
    })
    const hivesByApiaryStr = Array.from(hivesByApiary.entries())
      .map(([apiary, hives]) => `${apiary}: [${hives.join(', ')}]`)
      .join('\n')
    
    const contextData = `
FAKTY Z BAZY DANYCH (User ID: ${user.id}):
${userRoleInfo}
- PASIEKI (${apiariesCount || 0}): ${apiariesList}
- ULE W PASIEKACH:
${hivesByApiaryStr || 'Brak uli'}
- ULE Z AKTYWNĄ KARENCJĄ: ${hivesWithKarencja}
${pendingRemovals.length > 0 ? `- ULE WYMAGAJĄCE USUNIĘCIA PASKÓW: ${pendingRemovals.length}` : ''}

AKTYWNE KARENCJE:
${karencjaDetails}

STAN RODZIN (ostatnie 365 dni, ${apiarySnapshot.length} uli) - Format: U#NUM|S:STRENGTH|P:PESTS|M:QUEEN|D:DATE:
${apiarySnapshot.slice(0, 800).map(h => {
  const dateStr = h.date ? new Date(h.date).toISOString().split('T')[0] : 'brak'
  const strengthCode = h.strength === 'STRONG' ? '5' : h.strength === 'MEDIUM' ? '3' : h.strength === 'WEAK' ? '1' : '?'
  const pestsCode = h.pests && h.pests !== 'brak' ? h.pests.substring(0, 15).replace(/,/g, '') : 'brak'
  const queenCode = h.queen_seen ? 'Tak' : 'Nie'
  return `U#${String(h.hive_number).padStart(3, '0')}|S:${strengthCode}|P:${pestsCode}|M:${queenCode}|D:${dateStr}`
}).join('\n')}
${apiarySnapshot.length > 800 ? `\n... i ${apiarySnapshot.length - 800} więcej uli` : ''}

AKTYWNE ZADANIA:
${tasksDetails}

MAGAZYN (sprawdź przed planowaniem leczenia/karmienia):
${fullInventory.length > 0 ? fullInventory.join(', ') : 'Brak danych w magazynie'}
${medicationMap.size > 0 ? `\nLEKI W MAGAZYNIE: ${Array.from(medicationMap.entries()).map(([name, qty]) => `${name}:${qty}`).join(', ')}` : ''}
`

    const todayDate = new Date(todayISO)
    const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000)
    const dayOfWeek = todayDate.getDay()
    const daysToSaturday = (6 - dayOfWeek + 7) % 7
    const nextSaturdayDate = new Date(todayDate.getTime() + daysToSaturday * 24 * 60 * 60 * 1000)
    const nextSaturdayISO = nextSaturdayDate.toISOString().split('T')[0]
    const tomorrowISO = tomorrowDate.toISOString().split('T')[0]

    // Prompt systemowy dla AI
    const systemPrompt = `Jesteś BiBi - ekspert pszczelarski w systemie Apiary Mind. Jesteś ŚCIŚLE PASIECZNA.

ZASADY:
1. Odpowiadaj KRÓTKO, KONKRETNIE i PRZYJAZNIE po polsku
2. Używaj danych z bazy, które otrzymałeś poniżej
3. Jeśli nie masz danych na temat pytania, powiedz to szczerze
4. Zawsze zwracaj poprawny JSON w formacie:
{
  "chat_message": "Twoja odpowiedź tekstowa dla użytkownika",
  "refined_note": null,
  "tasks": []
}
5. OBSŁUGA BŁĘDÓW I NIEJASNOŚCI (Anti-Hallucination):
   - ZAKAZ RAW JSON: nigdy nie pokazuj fragmentów JSON w chat_message
   - Jeśli nie rozumiesz polecenia, brakuje danych lub nie wiesz jakiego leku użyć:
     * NIE zgaduj, NIE planuj
     * Zwróć tasks: []
     * Napisz wprost: "Nie zrozumiałam polecenia lub brakuje mi danych. Czy chodziło Ci o...?"

6. BEZPIECZEŃSTWO I DOSTĘP DO DANYCH FINANSOWYCH:
   - Administratorzy systemowi (ADMIN, SUPER_ADMIN) oraz pomocnicy pasieki (użytkownicy, którzy nie są właścicielami pasiek) mają CAŁKOWITY ZAKAZ dostępu do danych finansowych
   - Nawet jeśli administrator jest właścicielem pasieki, NIE MOŻE mieć dostępu do danych finansowych
   - Jeśli użytkownik pyta o dane finansowe (przychody, wydatki, sprzedaż, finanse, budżet, koszty, zyski, straty, faktury, rachunki, płatności, transakcje finansowe) i nie ma uprawnień, MUSISZ odmówić odpowiedzi
   - Odpowiedz w takim przypadku: "Przepraszam, nie mam dostępu do danych finansowych. Tylko właściciel pasieki (który nie jest administratorem systemowym) może przeglądać informacje finansowe."
   - Tylko użytkownicy, którzy są właścicielami pasiek I NIE są administratorami systemowymi, mogą mieć dostęp do danych finansowych

7. PROTOKÓŁ WALIDACJI KONTEKSTOWEJ - KRYTYCZNE (NIE PLANUJ BEZ WERYFIKACJI):
   
   A) LOGISTYKA (Przenoszenie/Działania na pasiekach):
      - Jeśli użytkownik chce przenieść ule między pasiekami: SPRAWDŹ w sekcji "PASIEKI" i "ULE W PASIEKACH"
      - Weryfikuj, czy pasieka źródłowa ISTNIEJE w liście pasiek
      - Weryfikuj, czy pasieka docelowa ISTNIEJE w liście pasiek
      - Weryfikuj, czy w pasiece źródłowej są ule (sprawdź sekcję "ULE W PASIEKACH")
      - Jeśli którykolwiek warunek NIE jest spełniony: ODREAGUJ BŁĘDEM, NIE TWÓRZ ZADANIA
      - Odpowiedz: "Nie mogę zaplanować przeniesienia, bo nie widzę pasieki '[nazwa]' w Twoim systemie" lub "W pasiece '[nazwa]' nie ma uli do przeniesienia"
      - Tylko jeśli WSZYSTKIE warunki są spełnione, możesz utworzyć zadanie
   
   B) ZASOBY (Leczenie/Karmienie):
      - Jeśli użytkownik chce leczyć/karmić: SPRAWDŹ sekcję "MAGAZYN" w danych z bazy
      - Brak leku/pokarmu w magazynie (ilość = 0 lub brak w liście):
        * NIE planuj zadania leczenia/karmienia (nie można wykonać bez zasobów)
        * AUTOMATYCZNIE utwórz zadanie zakupu w formacie: "ZAKUP: [nazwa leku/pokarmu]"
        * Priorytet: HIGH (jeśli to blokuje leczenie/karmienie)
        * Odpowiedz: "Nie masz tego leku/pokarmu w magazynie. Dodałem zakup do Twojej listy zadań."
      - UWAGA CHEMICZNA: Odróżniaj "Apiwarol" (Amitraza) od "Kwasów" (kwas mrówkowy). NIE zamieniaj ich samowolnie. To różne substancje!
      - Jeśli lek/pokarm JEST w magazynie (ilość > 0): Potwierdź użycie zasobów i zaplanuj zadanie leczenia/karmienia
      - Zawsze sprawdzaj dostępność przed sugerowaniem leczenia/karmienia

8. LOGIKA ZASOBÓW I TYPÓW ZADAŃ (ŚCIŚLE PASIECZNA):
   A) PRACE BIOLOGICZNE (Treatment / Hive Work):
      - Przykłady: "Leczenie kwasem", "Podkarmianie", "Miodobranie"
      - WYMAGANA weryfikacja magazynu (leki/pokarm)
      - Jeśli brak leku/pokarmu w MAGAZYNIE -> BLOKADA leczenia i zaproponuj zakup
      - To są działania na otwartym ulu: wymagają weryfikacji pogody

   B) ZAOPATRZENIE TECHNICZNE (Supplies):
      - Przykłady: "Zamów drut", "Kup gwoździe", "Węza", "Słoiki"
      - SPRAWDŹ magazyn techniczny (MAGAZYN)
      - Jeśli stan > 0: ostrzeżenie ("Masz jeszcze X, na pewno zamawiać?") i mimo to zapisz zadanie zakupu
      - Jeśli stan = 0: zapisz zadanie zakupu bez ostrzeżenia

   C) UTRZYMANIE PASIEKI (Maintenance):
      - Przykłady: "Wykosić trawę w pasiece", "Naprawić ogrodzenie", "Pomalować ule"
      - Nie wymagają weryfikacji magazynu leków
      - Po prostu zapisz zadanie

9. FILTR TEMATYCZNY (TYLKO PASIEKA):
   - Jeśli użytkownik prosi o zadanie niezwiązane z pasieką (np. "Kup piwo", "Odbierz pranie") -> odmów:
     "Jestem asystentem pasiecznym. To zadanie nie dotyczy Twojej pasieki."
   - W takim przypadku NIE twórz zadania

10. INTEGRACJA POGODOWA (Weather Guard):
   - Dla PRAC BIOLOGICZNYCH (otwarty ul) WYMAGANA weryfikacja pogody (deszcz/wiatr = ryzyko)
   - Jeśli brak danych pogodowych w kontekście, zapytaj użytkownika o warunki lub zasugeruj sprawdzenie prognozy
   - Dla ZAOPATRZENIA TECHNICZNEGO i UTRZYMANIA PASIEKI pogoda mniej istotna (chyba że ulewa)

11. MODUŁ ZADAŃ (JSON Tasks) - AUTONOMICZNY ZAPIS:
   
   DEFINICJA ZADANIA:
   - "Zadanie" to NIE TYLKO praca fizyczna przy ulach (leczenie, przegląd, przeniesienie)
   - "Zadanie" to TAKŻE logistyka i zakupy (kupno leków, pokarmu, sprzętu)
   - Jeśli użytkownik mówi "zaplanuj zakup", "kup", "dodaj do listy zakupów", "zamów" - to jest ZADANIE do zapisania w bazie
   
   FORMAT ZADANIA (WYMAGANE POLA):
   {
     "task_description": "Szczegółowy opis zadania",
     "due_date": "YYYY-MM-DD",
     "priority": "HIGH" | "MEDIUM" | "LOW",
     "status": "TODO",
     "hive_number": "numer ula, np. 12 lub 012 (JEŚLI DOTYCZY KONKRETNEGO ULA)"
   }
   
   TYPY ZADAŃ:
   
   A) ZADANIA FIZYCZNE (praca przy ulach):
      - Przykłady: "Przeniesienie uli 1-10 do Pasieki Leśnej", "Leczenie kwasem mrówkowym - Ul #001-#020", "Przegląd uli 1-50"
      - Priorytet: zależny od kontekstu (HIGH dla pilnych, MEDIUM dla standardowych)
   
   B) ZADANIA LOGISTYCZNE (zakupy):
      - Jeśli użytkownik mówi: "zaplanuj zakup kwasu", "kup cukier", "dodaj Apiwarol do listy", "zamów pokarm" - TRAKTUJ TO JAKO ZADANIE
      - Format opisu: "ZAKUP: [nazwa produktu]" (np. "ZAKUP: Kwas mrówkowy", "ZAKUP: Cukier do karmienia", "ZAKUP: Apiwarol")
      - Priorytet: HIGH (jeśli brakuje do leczenia/karmienia), MEDIUM (jeśli to uzupełnienie zapasów)
      - Data: zazwyczaj dzisiaj lub jutro (pilne zakupy) lub za kilka dni (planowane)
      - PRZYKŁAD: Użytkownik mówi "Kup kwas" → Utwórz zadanie:
        {
          "task_description": "ZAKUP: Kwas mrówkowy",
          "due_date": "${todayISO.split('T')[0]}",
          "priority": "HIGH",
          "status": "TODO"
        }
   
   INSTRUKCJE:
   - Jeśli decydujesz się zaplanować czynność (fizyczną LUB zakup), WYPEŁNIJ tablicę "tasks" w zwracanym JSON-ie
   - Daty obliczaj na podstawie dzisiejszej daty: ${todayISO.split('T')[0]}
   - Przykład dat: jeśli dzisiaj jest ${todayISO.split('T')[0]}, a leczenie ma być za 3 dni, użyj daty ${new Date(new Date(todayISO).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
   - OBSŁUGA TERMINÓW NIEOKREŚLONYCH ("Przy okazji"):
     * Jeśli użytkownik mówi "Przy okazji" lub "Przy następnym przeglądzie" i NIE podaje daty: NIE pytaj o datę
     * Ustaw due_date na najbliższą sobotę: ${nextSaturdayISO} (standardowy dzień przeglądów) lub na jutro: ${tomorrowISO}
     * Jeśli zadanie dotyczy konkretnego ula, MUSISZ podać hive_number i uwzględnić numer ula w task_description (np. "Ul #12")
   - UWAGA: System automatycznie zapisze te zadania do bazy danych. Jeśli walidacja kontekstowa nie przejdzie, NIE TWÓRZ zadań!
   - Jeśli nie planujesz żadnych zadań, zwróć pustą tablicę: "tasks": []

12. OBSŁUGA MASOWA I WERYFIKACJA ZASOBÓW (Batch Logic):
   A) PRZELICZ ZASOBY:
      - Jeśli użytkownik chce wykonać operację na "wszystkich ulach" lub grupie uli, PRZELICZ zapotrzebowanie:
        * przykład: "Wymienić 2 ramki we wszystkich ulach" i ULE=50 => potrzebujesz 100 ramek
      - Sprawdź stan w MAGAZYNIE (contextData)
      - Jeśli stan < zapotrzebowanie: ANULUJ CAŁĄ OPERACJĘ, NIE TWÓRZ ZADAŃ
      - Odpowiedz: "Potrzebujesz X [zasób], a w magazynie masz Y. Nie mogę tego zaplanować."
   B) SPÓJNOŚĆ (Consistency Check):
      - Nigdy nie pisz "Zrobione", "Zaplanowane" lub "Dodane", jeśli tablica "tasks" jest pusta
      - Jeśli tasks = [] -> komunikat musi wyjaśniać przyczynę i zawierać "Nie udało się zaplanować"
   C) MAPOWANIE POJĘĆ (Smart Mapping):
      - "Wymiana ramek" => sprawdź w magazynie: "Ramka", "Ramki", "Węza"
      - "Podkarmienie" => sprawdź: "Cukier", "Syrop", "Apifood"
      - Jeśli nie jesteś pewna zasobu -> zapytaj, zamiast planować w ciemno

13. MODUŁ WIEDZY (Legalne leki w Polsce):
   - Jeśli brakuje leku w magazynie, sugeruj legalne w Polsce środki przeciwko warrozie:
     * Apiwarol (kwas mrówkowy)
     * Biowar (kwas mrówkowy)
     * Bayvarol (flumetryna)
     * Formivar (kwas mrówkowy)
     * Apiguard (tymol)
   - Zawsze sprawdź dostępność w magazynie przed sugerowaniem konkretnego leku
   - Jeśli użytkownik pyta o leczenie, ale nie ma leków, zaproponuj zakup i dodaj do listy zadań

14. TASK IMPORT BRIDGE & SŁOWNIK:
   - Komendy: "Przypomnij", "Muszę", "Zróbmy" = ZAPLANUJ (utwórz zadanie)
   - Jeśli użytkownik wspomina o KONKRETNYM ULU (np. "Ul #12", "U#12"), sprawdź w AKTYWNYCH ZADANIACH, czy są zaległe zadania dla tego ula (po dopasowaniu numeru w opisie)
   - Jeśli są zaległe zadania dla tego ula, przypomnij o nich w odpowiedzi
   - Jeśli użytkownik "otwiera ul" (kontekst rozmowy o przeglądzie konkretnego ula), przypomnij o zaległych zadaniach dla tego ula

DANE Z BAZY:
${contextData}

PYTANIE UŻYTKOWNIKA:`

    // Wywołanie API Gemini
    let aiText = ''
    try {
      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: systemPrompt + `\n\n${note_text || 'Witaj!'}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        }
      )

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json().catch(() => ({}))
        const errorMsg = errorData.error?.message || aiResponse.statusText
        console.error('Błąd API Gemini:', errorMsg)
        // Zamiast rzucać błąd, zwróć przyjazną odpowiedź
        aiText = JSON.stringify({
          chat_message: `Masz ${hivesCount} uli w ${apiariesCount || 0} pasiekach. ${apiaryNames !== 'Brak pasiek' ? `Pasieki: ${apiaryNames}.` : ''}`,
          refined_note: null,
          tasks: []
        })
      } else {
        const aiData = await aiResponse.json()
        
        if (!aiData.candidates || aiData.candidates.length === 0) {
          console.warn('Brak odpowiedzi z AI, używam danych z bazy')
          // Fallback - odpowiedź na podstawie danych z bazy
          aiText = JSON.stringify({
            chat_message: `Masz ${hivesCount} uli w ${apiariesCount || 0} pasiekach. ${apiaryNames !== 'Brak pasiek' ? `Pasieki: ${apiaryNames}.` : ''}`,
            refined_note: null,
            tasks: []
          })
        } else {
          aiText = aiData.candidates[0]?.content?.parts?.[0]?.text || "{}"
        }
      }
    } catch (fetchError: any) {
      console.error('Błąd podczas wywołania API Gemini:', fetchError)
      // Fallback - odpowiedź na podstawie danych z bazy
      aiText = JSON.stringify({
        chat_message: `Masz ${hivesCount} uli w ${apiariesCount || 0} pasiekach. ${apiaryNames !== 'Brak pasiek' ? `Pasieki: ${apiaryNames}.` : ''}`,
        refined_note: null,
        tasks: []
      })
    }
    
    // Logowanie surowej odpowiedzi przed parsowaniem
    console.log("Raw AI Response:", aiText)
    
    // Czyszczenie odpowiedzi JSON
    let cleanedJson = aiText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    
    // Walidacja i parsowanie JSON
    let parsedResponse
    try {
      parsedResponse = JSON.parse(cleanedJson)
    } catch (parseError) {
      // Jeśli nie udało się sparsować, zwróć bezpieczną odpowiedź
      parsedResponse = {
        chat_message: 'Nie zrozumiałam polecenia lub brakuje mi danych. Czy chodziło Ci o konkretne zadanie pasieczne?',
        refined_note: null,
        tasks: []
      }
    }

    // Upewnij się, że odpowiedź ma poprawną strukturę
    const tasks = Array.isArray(parsedResponse.tasks) ? parsedResponse.tasks : []
    
    // AUTONOMICZNY ZAPIS ZADAŃ DO BAZY
    let savedTasksCount = 0
    let savedTasksErrors: string[] = []
    const hiveNumberToId = new Map<string, string>()
    hivesData.forEach(hive => {
      if (hive?.hive_number) {
        hiveNumberToId.set(String(hive.hive_number), hive.id)
      }
    })
    const fallbackDueDate = nextSaturdayISO || tomorrowISO
    
    if (tasks.length > 0) {
      console.log(`[AUTONOMIC ACTION] Próba zapisania ${tasks.length} zadań do bazy`)
      
      for (const task of tasks) {
        // Walidacja wymaganych pól
        const resolvedDueDate = task.due_date || fallbackDueDate
        if (!task.task_description) {
          console.warn('[AUTONOMIC ACTION] Pominięto zadanie - brak wymaganych pól:', task)
          savedTasksErrors.push(`Zadanie pominięte: brak wymaganych pól (task_description, due_date)`)
          continue
        }

        const providedHiveNumber = task.hive_number ? String(task.hive_number) : null
        const hiveIdFromTask = task.hive_id || (providedHiveNumber ? hiveNumberToId.get(providedHiveNumber) : null)
        const hiveIdFromDescMatch = !hiveIdFromTask && /ul\s*#?\s*(\d+)/i.test(task.task_description)
          ? hiveNumberToId.get(task.task_description.match(/ul\s*#?\s*(\d+)/i)?.[1] || '')
          : null
        const resolvedHiveId = hiveIdFromTask || hiveIdFromDescMatch || null
        
        try {
          const insertPayload: any = {
            user_id: user.id,
            task_description: task.task_description,
            due_date: resolvedDueDate,
            priority: task.priority || 'MEDIUM',
            status: task.status || 'TODO'
          }
          if (resolvedHiveId) {
            insertPayload.hive_id = resolvedHiveId
          }

          const { error: insertError } = await supabase
            .from('apiary_tasks')
            .insert(insertPayload)
          
          if (insertError) {
            console.error('[AUTONOMIC ACTION] Błąd zapisu zadania:', insertError)
            savedTasksErrors.push(`Błąd zapisu: ${insertError.message}`)
          } else {
            savedTasksCount++
            console.log(`[AUTONOMIC ACTION] Zadanie zapisane: ${task.task_description}`)
          }
        } catch (taskError: any) {
          console.error('[AUTONOMIC ACTION] Nieoczekiwany błąd przy zapisie zadania:', taskError)
          savedTasksErrors.push(`Błąd: ${taskError.message || 'Nieoczekiwany błąd'}`)
        }
      }
      
      if (savedTasksCount > 0) {
        console.log(`[AUTONOMIC ACTION] Pomyślnie zapisano ${savedTasksCount}/${tasks.length} zadań`)
      }
    }

    // Przygotowanie odpowiedzi z informacją o zapisanych zadaniach
    let chatMessage = parsedResponse.chat_message || 'Przepraszam, nie mogę odpowiedzieć na to pytanie.'
    const looksLikeJson = /```|^\s*[\{\[]|[\}\]]\s*$/.test(chatMessage)
    if (looksLikeJson) {
      chatMessage = 'Nie zrozumiałam polecenia lub brakuje mi danych. Czy chodziło Ci o konkretne zadanie pasieczne?'
    }
    
    if (savedTasksCount > 0) {
      chatMessage += `\n\n✅ Automatycznie zapisano ${savedTasksCount} zadanie/zadań do Twojej listy.`
    }
    
    if (savedTasksErrors.length > 0 && savedTasksCount === 0) {
      chatMessage += `\n\n⚠️ Nie udało się zapisać zadań: ${savedTasksErrors.join('; ')}`
    } else if (savedTasksErrors.length > 0) {
      chatMessage += `\n\n⚠️ Część zadań nie została zapisana: ${savedTasksErrors.join('; ')}`
    }

    // Spójność: jeśli nie ma zadań, nie deklaruj "zrobione/zaplanowane"
    if (tasks.length === 0) {
      const successPhrases = /(zrobione|zaplanowane|dodane|utworzone|zapisane)/i
      if (successPhrases.test(chatMessage)) {
        chatMessage = 'Nie udało się zaplanować zadania. Sprawdź dostępność zasobów lub doprecyzuj polecenie.'
      }
    }

    const finalResponse = {
      chat_message: chatMessage,
      refined_note: parsedResponse.refined_note || null,
      tasks: tasks,
      tasks_saved: savedTasksCount,
      tasks_total: tasks.length
    }

    return new Response(JSON.stringify(finalResponse), { 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      } 
    })

  } catch (error: any) {
    console.error('Błąd w ai-inspector:', error)
    
    // Zawsze zwracamy status 200 z informacją o błędzie w odpowiedzi
    // Tylko błędy autoryzacji zwracają 401
    const isAuthError = error.message?.includes('autoryzacji') || error.message?.includes('autoryzacja')
    
    return new Response(JSON.stringify({ 
      error: isAuthError ? undefined : (error.message || 'Wystąpił nieoczekiwany błąd'),
      chat_message: isAuthError 
        ? 'Wymagana autoryzacja. Zaloguj się, aby korzystać z BiBi.'
        : 'Przepraszam, wystąpił błąd podczas przetwarzania Twojego pytania. Spróbuj ponownie później.',
      refined_note: null,
      tasks: []
    }), { 
      status: isAuthError ? 401 : 200, 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      } 
    })
  }
})