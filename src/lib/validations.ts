import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee ID is required").max(50),
  fullName: z.string().min(1, "Full name is required").max(120),
  department: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  joiningDate: z.string().min(1, "Joining date is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  employeeId: z.string().optional().or(z.literal("")),
  forcePasswordChange: z.boolean().optional(),
});

export const mealStatusSchema = z.enum(["MEAL_TAKEN", "NOT_TAKEN", "PENDING", "CANCELLED"]);

export const paymentSchema = z.object({
  employeeId: z.string().min(1),
  paidAt: z.string().min(1),
  amountBdt: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "BKASH", "NAGAD", "BANK_TRANSFER", "CARD", "OTHER"]),
  reference: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const settingsSchema = z
  .object({
    mealPriceBdt: z.coerce.number().positive(),
    employeeSharePct: z.coerce.number().int().min(0).max(100),
    officeSharePct: z.coerce.number().int().min(0).max(100),
    weekStartDay: z.coerce.number().int().min(0).max(6),
    companyName: z.string().min(1).max(120),
    holidayCountryCodes: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((d) => d.employeeSharePct + d.officeSharePct === 100, {
    message: "Employee and office shares must total 100%",
    path: ["officeSharePct"],
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const billingPeriodSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
