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

  const payments = await prisma.employeePayment.findMany({
    include: { employee: true },
    orderBy: { paidAt: "desc" },
  });

  const header = [
    "date",
    "employee_code",
    "employee_name",
    "method",
    "amount_bdt",
    "reference",
    "notes",
  ];

  const lines = [
    header.join(","),
    ...payments.map((p) =>
      [
        formatDate(p.paidAt),
        csv(p.employee.employeeCode),
        csv(p.employee.fullName),
        p.method,
        paisaToBdt(p.amountPaisa),
        csv(p.reference ?? ""),
        csv(p.notes ?? ""),
      ].join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments.csv"',
    },
  });
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
