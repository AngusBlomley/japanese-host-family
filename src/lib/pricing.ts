export const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateMonthlyFromWeekly = (weeklyAmount: number) => {
  return Math.round(weeklyAmount * 4.345); // Average weeks in a month
};

export const calculateWeeklyFromMonthly = (monthlyAmount: number) => {
  return Math.round(monthlyAmount / 4.345);
};
