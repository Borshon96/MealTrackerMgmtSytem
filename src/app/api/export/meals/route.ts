import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { paisaToBdt } from "@/lib/money";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meals = await prisma.mealRecord.findMany({
    include: { employee: true },
    orderBy: [{ mealDate: "desc" }, { employee: { fullName: "asc" } }],
  });

  const header = [
    "date",
    "employee_code",
    "employee_name",
    "status",
    "unit_price_bdt",
    "employee_share_pct",
    "office_share_pct",
    "employee_charge_bdt",
    "office_subsidy_bdt",
  ];

  const lines = [
    header.join(","),
    ...meals.map((m) =>
      [
        formatDate(m.mealDate),
        csv(m.employee.employeeCode),
        csv(m.employee.fullName),
        m.status,
        paisaToBdt(m.unitPricePaisa),
        m.employeeSharePct,
        m.officeSharePct,
        paisaToBdt(m.employeeChargePaisa),
        paisaToBdt(m.officeSubsidyPaisa),
      ].join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="meals.csv"',
    },
  });
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
