export const mockApiaries = [
  { id: 1, name: "Pasieka Leśna", location: "Las Kabacki", hives: 12 },
  { id: 2, name: "Pasieka Przydomowa", location: "Ogród", hives: 4 },
  { id: 3, name: "Wrzosowisko", location: "Poligon", hives: 20 },
];

export const mockInspections = [
  { id: 101, date: "2024-05-12", apiary: "Pasieka Leśna", type: "Przegląd wiosenny", notes: "Rodziny silne, dużo czerwiu." },
  { id: 102, date: "2024-05-14", apiary: "Pasieka Przydomowa", type: "Miodobranie", notes: "Rzepak, 20kg." },
  { id: 103, date: "2024-05-20", apiary: "Wrzosowisko", type: "Kontrola nastroju rojowego", notes: "Znaleziono mateczniki w ulu #5." },
];

export const mockWarehouse = {
  equipment: [
    { id: 1, name: "Korpus Wielkopolski", quantity: 15, unit: "szt" },
    { id: 2, name: "Dennica wysoka", quantity: 5, unit: "szt" },
    { id: 3, name: "Ramka gniazdowa (zadrutowana)", quantity: 100, unit: "szt" },
  ],
  products: [
    { id: 1, name: "Miód Rzepakowy 2024", quantity: 50, unit: "kg" },
    { id: 2, name: "Wosk", quantity: 5, unit: "kg" },
    { id: 3, name: "Propolis", quantity: 0.5, unit: "kg" },
  ],
  packaging: [
    { id: 1, name: "Słoik 0.9l", quantity: 200, unit: "szt" },
    { id: 2, name: "Zakrętka złota", quantity: 250, unit: "szt" },
  ]
};

export const mockReports = [
  { id: 1, title: "Raport sprzedaży RHD 2023", date: "2023-12-31", url: "#" },
  { id: 2, title: "Raport miodobrania Wiosna 2024", date: "2024-06-01", url: "#" },
];

export const mockBetaScenarios = [
  { id: 1, title: "Test dodawania przeglądu głosowego", status: "OPEN" },
  { id: 2, title: "Weryfikacja stanów magazynowych po synchronizacji", status: "DONE" },
  { id: 3, title: "Test modułu mapy pasiek", status: "OPEN" },
];
