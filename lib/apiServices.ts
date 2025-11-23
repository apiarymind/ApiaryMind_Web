import { apiGet } from "./apiClient";
import { mockApiaries, mockInspections, mockWarehouse, mockReports, mockBetaScenarios } from "./mockData";

// W przyszłości można tu użyć zmiennej środowiskowej
const USE_MOCK = true; 

export async function getApiaries() {
  if (USE_MOCK) {
    // Simulate network delay
    // await new Promise(resolve => setTimeout(resolve, 500));
    return mockApiaries;
  }
  return apiGet('/apiaries');
}

export async function getInspections() {
  if (USE_MOCK) return mockInspections;
  return apiGet('/inspections');
}

export async function getWarehouse() {
  if (USE_MOCK) return mockWarehouse;
  return apiGet('/warehouse');
}

export async function getReports() {
  if (USE_MOCK) return mockReports;
  return apiGet('/reports');
}

export async function getBetaScenarios() {
  if (USE_MOCK) return mockBetaScenarios;
  return apiGet('/beta/scenarios');
}
