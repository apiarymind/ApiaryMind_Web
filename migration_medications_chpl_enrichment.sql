-- Migration: Enrichment of medications_global with ChPL-compliant veterinary information
-- Adds columns if missing and populates data for Polish bee medications
-- Based on Charakterystyka Produktu Leczniczego (ChPL) guidelines 2024/2025

-- Step 1: Ensure required columns exist
ALTER TABLE medications_global 
ADD COLUMN IF NOT EXISTS dosage TEXT,
ADD COLUMN IF NOT EXISTS composition TEXT,
ADD COLUMN IF NOT EXISTS contraindications TEXT,
ADD COLUMN IF NOT EXISTS side_effects TEXT;

-- Step 2: Update medications with ChPL-compliant information

-- Apiwarol (Amitraz tablets)
UPDATE medications_global 
SET 
    description = 'Tabletki fumigacyjne zawierające amitrazy, przeznaczone do diagnostyki i zwalczania warrozy pszczół wywołanej przez Varroa destructor. Preparat działa poprzez odymianie pszczół w ulu.',
    dosage = 'Odymić rodzinę pszczelą jedną tabletką przy temperaturze powyżej 10°C. Zabieg wykonać wieczorem, po powrocie pszczół do ula. Wylotki ula powinny być zamknięte na 15-20 minut. W razie potrzeby powtórzyć zabieg po 7 dniach. Maksymalnie 4 zabiegi w sezonie.',
    composition = 'Amitraza 12,5 mg na tabletkę. Substancja pomocnicza: celuloza mikrokrystaliczna.',
    contraindications = 'Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku). Nie odymiać pszczół przy temperaturze poniżej 10°C lub powyżej 35°C. Nie stosować u rodzin słabych (poniżej 3 ramek). Nie stosować w okresie lotów godowych matek. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie.',
    side_effects = 'W rzadkich przypadkach może wystąpić zwiększona agresywność pszczół bezpośrednio po zabiegu. Nadmierne stężenie może prowadzić do osłabienia rodziny lub upadku pszczół. Mogą wystąpić zaburzenia w czerwieniu matek po zabiegu.'
WHERE name = 'Apiwarol';

-- Biowar 500 (Amitraz strips)
UPDATE medications_global 
SET 
    description = 'Paski lecznicze zawierające amitrazy, przeznaczone do zwalczania warrozy pszczół przez zawieszenie w ulu. Preparat działa poprzez parowanie substancji aktywnej i kontakt z pasożytami.',
    dosage = 'Zawiesić 2 paski na rodzinę pszczelą między ramkami z czerwiem w gnieździe. Paski umieścić w odległości 2-3 ramki od siebie. Czas ekspozycji: 6 tygodni. Po tym czasie paski usunąć. Stosować tylko w okresie jesiennym (po zakończeniu pożytku) lub wiosennym (przed rozpoczęciem pożytku).',
    composition = 'Amitraza 500 mg na pasek. Nośnik: tektura impregnowana.',
    contraindications = 'Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku). Nie stosować u rodzin słabych (poniżej 5 ramek). Nie stosować w okresie lotów godowych matek. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie. Nie stosować w temperaturach powyżej 25°C ze względu na zbyt szybkie uwalnianie substancji aktywnej.',
    side_effects = 'Przy zbyt wysokiej temperaturze może dojść do nadmiernego uwalniania substancji aktywnej, co może osłabić rodzinę. Możliwe jest lekkie zwiększenie agresywności pszczół w pierwszych dniach po założeniu pasków. Rzadko mogą wystąpić zaburzenia w czerwieniu matek.'
WHERE name = 'Biowar 500';

-- Bayvarol (Flumethrin strips)
UPDATE medications_global 
SET 
    description = 'Paski lecznicze zawierające flumetrynę, przeznaczone do zwalczania warrozy pszczół poprzez kontakt z pasożytami. Preparat należy zawiesić między ramkami w ulu.',
    dosage = 'Zawiesić 4 paski na rodzinę pszczelą między ramkami z czerwiem w gnieździe. Paski rozłożyć równomiernie w gnieździe. Czas ekspozycji: 6-8 tygodni. Po zakończeniu leczenia paski usunąć i zutylizować. Stosować w okresie jesiennym (po zakończeniu pożytku) lub wczesną wiosną (przed rozpoczęciem pożytku).',
    composition = 'Flumetryna 3,6 mg na pasek. Substancje pomocnicze: wosk pszczeli, olej mineralny.',
    contraindications = 'Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku). Nie stosować u rodzin słabych (poniżej 5 ramek). Nie stosować w okresie lotów godowych matek. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie. Nie stosować w temperaturach powyżej 25°C. Preparat nie powinien mieć kontaktu z miodem przeznaczonym do spożycia.',
    side_effects = 'W rzadkich przypadkach może wystąpić zwiększona agresywność pszczół w pierwszych dniach po założeniu pasków. Przy nieprawidłowym stosowaniu (zbyt duża dawka) może dojść do osłabienia rodziny. Możliwe są zaburzenia w czerwieniu matek po zabiegu. Resztki preparatu mogą przedostać się do miodu przy nieprawidłowym stosowaniu.'
WHERE name = 'Bayvarol';

-- Polyvar Yellow (Flumethrin entrance strips)
UPDATE medications_global 
SET 
    description = 'Paski lecznicze zawierające flumetrynę, przeznaczone do umieszczenia w wylotku ula w celu zwalczania warrozy pszczół. Preparat działa poprzez kontakt z pasożytami podczas przechodzenia pszczół przez wylotek.',
    dosage = 'Umieścić 2 paski w wylotku ula (po jednym na każdą stronę) na okres 9 tygodni. Paski powinny być ułożone tak, aby pszczoły musiały przejść po nich. Po zakończeniu leczenia paski usunąć. Stosować w okresie jesiennym (po zakończeniu pożytku) lub wczesną wiosną (przed rozpoczęciem pożytku).',
    composition = 'Flumetryna 275 mg na pasek. Nośnik: tektura impregnowana, żółty barwnik.',
    contraindications = 'Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku). Nie stosować u rodzin słabych (poniżej 5 ramek). Nie stosować w okresie lotów godowych matek. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie. Nie stosować w temperaturach powyżej 25°C. Nie blokować wylotka całkowicie – zapewnić swobodny przepływ pszczół.',
    side_effects = 'Przy nieprawidłowym ułożeniu pasków może dojść do blokady wylotka, co utrudni pszczołom wyloty. W rzadkich przypadkach może wystąpić zwiększona agresywność pszczół. Możliwe są zaburzenia w czerwieniu matek. Paski mogą ulegać rozmiękczeniu przy wysokiej wilgotności.'
WHERE name = 'Polyvar Yellow';

-- VarroMed (Oxalic acid solution)
UPDATE medications_global 
SET 
    description = 'Roztwór do kapania zawierający kwas szczawiowy dwuwodny, przeznaczony do zwalczania warrozy pszczół. Preparat działa poprzez bezpośredni kontakt z pasożytami. Stosowany w metodzie kapania na pszczoły.',
    dosage = 'Stosować 5 ml roztworu na uliczkę pszczół (przestrzeń między ramkami). Zabieg wykonać poprzez kapanie roztworu między ramkami z pszczołami. Stosować tylko w rodzinach bez czerwiu (podczas przerwy w czerwieniu). Temperatura podczas zabiegu powinna wynosić 10-20°C. Zabieg wykonać 2-3 razy w odstępach 7-10 dni. Maksymalnie 3 zabiegi w sezonie.',
    composition = 'Kwas szczawiowy dwuwodny 62,0 mg/ml. Substancja pomocnicza: woda destylowana, glicerol.',
    contraindications = 'Stosować TYLKO w rodzinach bez czerwiu (w okresie przerwy w czerwieniu). Nie stosować w okresie pożytku. Nie stosować przy temperaturze powyżej 20°C (zwiększa się ryzyko uszkodzenia pszczół). Nie stosować u rodzin słabych (poniżej 3 ramek). Nie stosować w okresie lotów godowych matek. Nie stosować podczas mrozu lub przy temperaturze poniżej 5°C. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie.',
    side_effects = 'Przy nieprawidłowym dawkowaniu lub zbyt wysokiej temperaturze może dojść do zatrucia pszczół i ich upadku. Nadmierna dawka może prowadzić do osłabienia rodziny. Możliwe są oparzenia skóry przy bezpośrednim kontakcie z koncentratem. Kwas szczawiowy może powodować podrażnienia dróg oddechowych u osoby wykonującej zabieg. Przy zbyt częstym stosowaniu może dojść do uodpornienia się warrozy na preparat.'
WHERE name = 'VarroMed';

-- Oxybee (Oxalic acid solution)
UPDATE medications_global 
SET 
    description = 'Roztwór do kapania zawierający kwas szczawiowy dwuwodny, stosowany w leczeniu warrozy pszczół metodą kapania na pszczoły. Preparat działa przez bezpośredni kontakt z pasożytami.',
    dosage = 'Stosować 5 ml roztworu na uliczkę pszczół (przestrzeń między ramkami). Zabieg wykonać poprzez kapanie roztworu między ramkami z pszczołami, unikając kapania bezpośrednio na pszczoły. Stosować TYLKO w rodzinach bez czerwiu (podczas przerwy w czerwieniu). Temperatura podczas zabiegu: 10-18°C. Zabieg wykonać 2-3 razy w odstępach 7-10 dni. Maksymalnie 3 zabiegi w sezonie. Nie stosować podczas mrozu.',
    composition = 'Kwas szczawiowy dwuwodny 62,0 mg/ml. Substancje pomocnicze: woda destylowana, glicerol, stabilizator pH.',
    contraindications = 'Stosować TYLKO w rodzinach bez czerwiu (w okresie przerwy w czerwieniu). Nie stosować w okresie pożytku. Nie stosować przy temperaturze powyżej 18°C (zwiększa się toksyczność dla pszczół). Nie stosować u rodzin słabych (poniżej 3 ramek). Nie stosować w okresie lotów godowych matek. Nie stosować podczas mrozu lub przy temperaturze poniżej 5°C. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie. Nie stosować w ulach z otwartym czerwiem.',
    side_effects = 'Przy nieprawidłowym dawkowaniu może dojść do masowego upadku pszczół. Zbyt wysoka temperatura podczas zabiegu zwiększa ryzyko zatrucia. Możliwe są oparzenia skóry i podrażnienia dróg oddechowych przy bezpośrednim kontakcie z preparatem. Przy zbyt częstym stosowaniu może dojść do uodpornienia się warrozy. Nadmierna dawka może prowadzić do osłabienia i upadku rodziny. Kwas szczawiowy może krystalizować się na ramkach przy zbyt niskiej temperaturze.'
WHERE name = 'Oxybee';

-- Api-Bioxal (Oxalic acid solution)
UPDATE medications_global 
SET 
    description = 'Roztwór do kapania zawierający kwas szczawiowy dwuwodny, przeznaczony do zwalczania warrozy pszczół metodą kapania. Preparat działa poprzez bezpośredni kontakt z pasożytami Varroa destructor na ciele pszczół.',
    dosage = 'Stosować 5 ml roztworu na uliczkę pszczół (przestrzeń między ramkami). Zabieg wykonać poprzez kapanie roztworu między ramkami z pszczołami w ulu. Stosować TYLKO w rodzinach bez czerwiu (podczas przerwy w czerwieniu matki). Optymalna temperatura: 10-16°C. Zabieg wykonać 2-3 razy w odstępach 7-10 dni. Maksymalnie 3 zabiegi w sezonie. Zabieg najlepiej wykonywać późną jesienią lub wczesną wiosną.',
    composition = 'Kwas szczawiowy dwuwodny 62,0 mg/ml. Substancje pomocnicze: woda destylowana, glicerol (stabilizator), regulator pH.',
    contraindications = 'Stosować TYLKO w rodzinach bez czerwiu (w okresie przerwy w czerwieniu). Nie stosować w okresie pożytku (produkcji miodu konsumpcyjnego). Nie stosować przy temperaturze powyżej 16°C (zwiększa się toksyczność). Nie stosować u rodzin słabych (poniżej 3 ramek). Nie stosować w okresie lotów godowych matek. Nie stosować podczas mrozu lub przy temperaturze poniżej 5°C. Nie łączyć z innymi preparatami przeciwko warrozie. Nie stosować w ulach z otwartym lub zamkniętym czerwiem. Nie kapać bezpośrednio na pszczoły lub matkę.',
    side_effects = 'Przy nieprawidłowym dawkowaniu lub zbyt wysokiej temperaturze może dojść do masowego upadku pszczół i osłabienia rodziny. Możliwe są oparzenia skóry i podrażnienia błon śluzowych przy bezpośrednim kontakcie z koncentratem. Kwas szczawiowy może powodować podrażnienia dróg oddechowych u osoby wykonującej zabieg. Przy zbyt częstym stosowaniu może dojść do uodpornienia się warrozy na preparat. Kwas może krystalizować się na ramkach i w ulu przy zbyt niskiej temperaturze. Nieprawidłowe aplikowanie może prowadzić do zatrucia całej rodziny.'
WHERE name = 'Api-Bioxal';

-- Apiguard (Thymol gel)
UPDATE medications_global 
SET 
    description = 'Żel zawierający tymol, przeznaczony do zwalczania warrozy pszczół poprzez odparowanie substancji aktywnej. Preparat działa jako fumigant w zamkniętej przestrzeni ula. Stosowany w postaci tacki żelu umieszczanej na górnych beleczkach ramek.',
    dosage = 'Umieścić jedną tackę żelu (25 g) na górnych beleczkach ramek w gnieździe, najlepiej nad czerwiem. Tackę ułożyć płasko, aby zapewnić maksymalną powierzchnię odparowania. Po 14 dniach wymienić na nową tackę. Całkowity czas leczenia: 28 dni (2 t tacki). Temperatura podczas leczenia powinna wynosić 15-30°C. Stosować w okresie jesiennym (po zakończeniu pożytku) lub wiosennym (przed rozpoczęciem pożytku). Po zakończeniu leczenia t tacki usunąć.',
    composition = 'Tymol 12,5 g na 50 g żelu (25 g na tackę). Substancje pomocnicze: żel celulozowy, woda, emulgator.',
    contraindications = 'Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku). Nie stosować przy temperaturze poniżej 15°C (zmniejsza się skuteczność) lub powyżej 30°C (zbyt szybkie odparowanie). Nie stosować u rodzin słabych (poniżej 5 ramek). Nie stosować w okresie lotów godowych matek. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie. Nie stosować w ulach z otwartymi wylotkami (należy zapewnić dobrą wentylację, ale ograniczoną). Nie stosować podczas deszczu lub przy wysokiej wilgotności powietrza.',
    side_effects = 'W pierwszych dniach po założeniu tacki może wystąpić zwiększona agresywność pszczół lub niepokój rodziny. Przy zbyt wysokiej temperaturze może dojść do zbyt szybkiego odparowania tymolu, co może osłabić rodzinę. Możliwe są zaburzenia w czerwieniu matek w okresie leczenia. Resztki żelu mogą przedostać się do miodu przy nieprawidłowym stosowaniu. Zapach tymolu może utrzymywać się w ulu przez kilka dni po usunięciu tacki. Przy zbyt niskiej temperaturze skuteczność leczenia może być zmniejszona.'
WHERE name = 'Apiguard';

-- Thymovar (Thymol strips)
UPDATE medications_global 
SET 
    description = 'Paski lecznicze zawierające tymol, przeznaczone do zwalczania warrozy pszczół poprzez odparowanie substancji aktywnej. Preparat działa jako fumigant w zamkniętej przestrzeni ula. Paski należy umieścić na górnych beleczkach ramek.',
    dosage = 'Umieścić 2 paski na górnych beleczkach ramek w gnieździe, najlepiej nad czerwiem. Paski rozłożyć równomiernie w gnieździe. Czas ekspozycji: 3-4 tygodnie. Po zakończeniu leczenia paski usunąć. Temperatura podczas leczenia powinna wynosić 15-25°C. Stosować w okresie jesiennym (po zakończeniu pożytku) lub wiosennym (przed rozpoczęciem pożytku). Optymalna temperatura działania: 18-22°C.',
    composition = 'Tymol 15 g na pasek. Nośnik: tektura impregnowana, wosk pszczeli.',
    contraindications = 'Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku). Nie stosować przy temperaturze poniżej 15°C (zmniejsza się skuteczność) lub powyżej 25°C (zbyt szybkie odparowanie, możliwe zatrucie pszczół). Nie stosować u rodzin słabych (poniżej 5 ramek). Nie stosować w okresie lotów godowych matek. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie. Nie stosować podczas deszczu lub przy wysokiej wilgotności powietrza. Nie blokować wentylacji ula całkowicie.',
    side_effects = 'W pierwszych dniach po założeniu pasków może wystąpić zwiększona agresywność pszczół lub niepokój rodziny. Przy zbyt wysokiej temperaturze może dojść do zbyt szybkiego odparowania tymolu i możliwego zatrucia pszczół. Możliwe są zaburzenia w czerwieniu matek podczas leczenia. Resztki tymolu mogą przedostać się do miodu przy nieprawidłowym stosowaniu lub przedłużonym okresie ekspozycji. Zapach tymolu może utrzymywać się w ulu przez kilka dni po usunięciu pasków. Przy zbyt niskiej temperaturze skuteczność leczenia może być znacznie zmniejszona. Paski mogą ulegać rozmiękczeniu przy wysokiej wilgotności.'
WHERE name = 'Thymovar';

-- Formicpro (Formic acid strips)
UPDATE medications_global 
SET 
    description = 'Paski lecznicze zawierające kwas mrówkowy, przeznaczone do zwalczania warrozy pszczół poprzez odparowanie substancji aktywnej. Preparat działa jako fumigant i działa zarówno na dorosłe pasożyty, jak i na czerw. Kwas mrówkowy jest naturalnym produktem występującym w miodzie.',
    dosage = 'Umieścić 2 paski na górnych beleczkach ramek w gnieździe, najlepiej nad czerwiem. Paski rozłożyć równomiernie. Czas ekspozycji: 7 dni (1 tydzień). Po zakończeniu leczenia paski bezwzględnie usunąć. Temperatura podczas leczenia powinna wynosić 12-25°C. Optymalna temperatura: 15-20°C. Stosować w okresie jesiennym (po zakończeniu pożytku) lub wiosennym (przed rozpoczęciem pożytku). Nie przedłużać czasu ekspozycji powyżej 7 dni.',
    composition = 'Kwas mrówkowy 68,2 g na pasek (w sumie 136,4 g w opakowaniu). Substancja pomocnicza: tektura impregnowana, regulator odparowania.',
    contraindications = 'Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku). Nie stosować przy temperaturze poniżej 12°C (zmniejsza się skuteczność) lub powyżej 25°C (zbyt szybkie i niebezpieczne odparowanie, ryzyko zatrucia pszczół i matki). Nie stosować u rodzin słabych (poniżej 5 ramek). Nie stosować w okresie lotów godowych matek. Nie łączyć z innymi preparatami przeciwko warrozie w tym samym czasie. Nie stosować podczas deszczu, mgły lub przy wysokiej wilgotności powietrza (powyżej 85%). Nie przedłużać czasu ekspozycji powyżej 7 dni. Nie stosować w ulach bez wentylacji. Nie stosować w upalne dni (temperatura powyżej 25°C).',
    side_effects = 'Przy zbyt wysokiej temperaturze (powyżej 25°C) może dojść do masowego upadku pszczół, śmierci matki i upadku całej rodziny. Kwas mrówkowy jest żrący – może powodować oparzenia skóry i dróg oddechowych u osoby wykonującej zabieg (należy używać rękawic i maski). W pierwszych dniach po założeniu pasków może wystąpić zwiększona agresywność pszczół lub niepokój rodziny. Możliwe są zaburzenia w czerwieniu matek, a w skrajnych przypadkach śmierć matki. Przy nieprawidłowym stosowaniu (zbyt długa ekspozycja, zbyt wysoka temperatura) może dojść do całkowitego upadku rodziny. Kwas mrówkowy może powodować korozję elementów metalowych w ulu. Przy zbyt niskiej temperaturze skuteczność leczenia może być zmniejszona. Resztki kwasu mogą przedostać się do miodu przy przedłużonym okresie ekspozycji.'
WHERE name = 'Formicpro';

-- Verification: Check updated records
-- SELECT name, description, dosage, composition, contraindications, side_effects 
-- FROM medications_global 
-- WHERE name IN ('Apiwarol', 'Biowar 500', 'Bayvarol', 'Polyvar Yellow', 'VarroMed', 'Oxybee', 'Api-Bioxal', 'Apiguard', 'Thymovar', 'Formicpro')
-- ORDER BY name;
