export const SETTING_KEYS = {
  mealPriceBdt: "meal_price_bdt",
  employeeSharePct: "employee_share_pct",
  officeSharePct: "office_share_pct",
  weekStartDay: "week_start_day",
  companyName: "company_name",
} as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.mealPriceBdt]: "100",
  [SETTING_KEYS.employeeSharePct]: "50",
  [SETTING_KEYS.officeSharePct]: "50",
  [SETTING_KEYS.weekStartDay]: "0",
  [SETTING_KEYS.companyName]: "Office Meal Tracker",
};
