export const mockWarehouse = [
  { id: 1, name: "Ramka Wielkopolska", category: "FRAMES", quantity: 150, unit: "szt" },
  { id: 2, name: "Węza pszczela", category: "FOUNDATION", quantity: 5, unit: "kg" },
  { id: 3, name: "Korpus Langstroth", category: "HIVE_BODY", quantity: 12, unit: "szt" },
  { id: 4, name: "Daszek ocieplany", category: "ROOF", quantity: 8, unit: "szt" },
  { id: 5, name: "Podkurzacz", category: "TOOLS", quantity: 2, unit: "szt" }
];

export const mockApiaries = [
  { id: 1, name: "Pasieka Leśna", type: "STATIONARY", hives: 25, location: "Las Kabacki" },
  { id: 2, name: "Pasieka Wędrowna 1", type: "MIGRATORY", hives: 40, location: "Rzepak - Pole A" },
];

export const mockInspections = [
  { id: 1, apiaryId: 1, date: "2023-05-12", notes: "Przegląd wiosenny, stan dobry." },
  { id: 2, apiaryId: 1, date: "2023-05-20", notes: "Dodano nadstawki." },
];

export const mockReports = [
  { id: 1, title: "Raport roczny 2022", date: "2022-12-31", type: "ANNUAL" },
  { id: 2, title: "Straty zimowe", date: "2023-03-15", type: "LOSS" },
];

export const mockBetaScenarios = [
  { id: 1, title: "Scenariusz A", description: "Testowanie dodawania pasiek" },
  { id: 2, title: "Scenariusz B", description: "Testowanie raportów" }
];
