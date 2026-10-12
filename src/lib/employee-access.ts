import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export async function requireLinkedEmployeeId() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "EMPLOYEE") redirect("/admin");
  if (!user.employeeId) {
    return null;
  }
  return user.employeeId;
}
