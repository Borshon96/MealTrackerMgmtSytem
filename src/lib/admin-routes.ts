export function employeesPageHref(params?: { q?: string; id?: string }) {
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.id) sp.set("id", params.id);
  const query = sp.toString();
  return query ? `/admin/employees?${query}` : "/admin/employees";
}

export function usersPageHref(params?: { q?: string; id?: string }) {
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.id) sp.set("id", params.id);
  const query = sp.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}
