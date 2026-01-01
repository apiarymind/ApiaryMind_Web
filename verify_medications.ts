
import { getMedications } from "./app/actions/get-medications";

async function verify() {
  try {
    const meds = await getMedications();
    console.log("Medications fetched successfully:", meds);
  } catch (error) {
    console.error("Error fetching medications:", error);
  }
}

verify();
