import { getSessionUid } from "@/app/actions/auth-session";
import { redirect } from "next/navigation";
import PassportsClient from "./PassportsClient";

export default async function PassportsPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect("/login");
  }

  return <PassportsClient />;
}
