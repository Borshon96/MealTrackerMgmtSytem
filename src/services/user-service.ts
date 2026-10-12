import { prisma } from "@/lib/prisma";
import { hashPassword, invalidateUserSessions } from "@/lib/auth";
import type { AccountStatus, Role } from "@/lib/types";

export async function listUsers(search?: string) {
  return prisma.user.findMany({
    where: search
      ? {
          OR: [
            { username: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      employeeId: true,
      lastLoginAt: true,
      forcePasswordChange: true,
      createdAt: true,
      employee: { select: { id: true, fullName: true, employeeCode: true } },
    },
    orderBy: { username: "asc" },
  });
}

async function assertNotLastActiveAdmin(userId: string, nextStatus?: AccountStatus, nextRole?: Role) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const wouldLoseAdmin =
    user.role === "ADMIN" &&
    user.status === "ACTIVE" &&
    ((nextStatus && nextStatus !== "ACTIVE") || (nextRole && nextRole !== "ADMIN"));

  if (!wouldLoseAdmin) return;

  const otherAdmins = await prisma.user.count({
    where: { role: "ADMIN", status: "ACTIVE", id: { not: userId } },
  });
  if (otherAdmins === 0) {
    throw new Error("Cannot deactivate or demote the last active administrator");
  }
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role: Role;
  status: AccountStatus;
  employeeId?: string | null;
  forcePasswordChange?: boolean;
}) {
  if (!data.password || data.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (data.role === "EMPLOYEE" && !data.employeeId) {
    throw new Error("Employee accounts must be linked to an employee record");
  }
  if (data.employeeId) {
    const linked = await prisma.user.findFirst({ where: { employeeId: data.employeeId } });
    if (linked) throw new Error("This employee is already linked to another user");
  }

  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash,
      role: data.role,
      status: data.status,
      employeeId: data.employeeId || null,
      forcePasswordChange: data.forcePasswordChange ?? false,
    },
  });
}

export async function updateUser(
  id: string,
  data: {
    username: string;
    email: string;
    password?: string;
    role: Role;
    status: AccountStatus;
    employeeId?: string | null;
    forcePasswordChange?: boolean;
  }
) {
  await assertNotLastActiveAdmin(id, data.status, data.role);

  if (data.role === "EMPLOYEE" && !data.employeeId) {
    throw new Error("Employee accounts must be linked to an employee record");
  }
  if (data.employeeId) {
    const linked = await prisma.user.findFirst({
      where: { employeeId: data.employeeId, id: { not: id } },
    });
    if (linked) throw new Error("This employee is already linked to another user");
  }

  const updateData: {
    username: string;
    email: string;
    role: Role;
    status: AccountStatus;
    employeeId: string | null;
    forcePasswordChange?: boolean;
    passwordHash?: string;
  } = {
    username: data.username.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    status: data.status,
    employeeId: data.employeeId || null,
    forcePasswordChange: data.forcePasswordChange,
  };

  if (data.password && data.password.length >= 8) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });

  if (data.status !== "ACTIVE" || data.password) {
    await invalidateUserSessions(id);
  }

  return user;
}

export async function resetUserPassword(id: string, password: string) {
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, forcePasswordChange: true },
  });
  await invalidateUserSessions(id);
}
