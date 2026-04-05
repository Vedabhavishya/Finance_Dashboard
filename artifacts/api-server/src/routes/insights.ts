import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  GetSummaryResponse,
  GetSpendingByCategoryResponse,
  GetBalanceTrendResponse,
  GetMonthlyComparisonResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/insights/summary", async (req, res): Promise<void> => {
  const rows = await db.select().from(transactionsTable);

  const totalIncome = rows
    .filter(r => r.type === "income")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = rows
    .filter(r => r.type === "expense")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const totalBalance = totalIncome - totalExpenses;

  const categoryTotals: Record<string, number> = {};
  for (const r of rows.filter(r => r.type === "expense")) {
    categoryTotals[r.category] = (categoryTotals[r.category] ?? 0) + Number(r.amount);
  }
  const highestSpendingCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  res.json(GetSummaryResponse.parse({
    totalBalance,
    totalIncome,
    totalExpenses,
    transactionCount: rows.length,
    highestSpendingCategory,
    savingsRate,
  }));
});

router.get("/insights/spending-by-category", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      category: transactionsTable.category,
      amount: sql<number>`SUM(${transactionsTable.amount}::numeric)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "expense"))
    .groupBy(transactionsTable.category)
    .orderBy(sql`SUM(${transactionsTable.amount}::numeric) DESC`);

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const result = rows.map(r => ({
    category: r.category,
    amount: Number(r.amount),
    percentage: total > 0 ? Math.round((Number(r.amount) / total) * 100) : 0,
    count: Number(r.count),
  }));

  res.json(GetSpendingByCategoryResponse.parse(result));
});

router.get("/insights/balance-trend", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: sql<string>`TO_CHAR(${transactionsTable.date}, 'YYYY-MM')`,
      income: sql<number>`SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount}::numeric ELSE 0 END)`,
      expenses: sql<number>`SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount}::numeric ELSE 0 END)`,
    })
    .from(transactionsTable)
    .groupBy(sql`TO_CHAR(${transactionsTable.date}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactionsTable.date}, 'YYYY-MM') ASC`);

  let runningBalance = 0;
  const result = rows.map(r => {
    const income = Number(r.income);
    const expenses = Number(r.expenses);
    runningBalance += income - expenses;
    return {
      date: r.date,
      balance: runningBalance,
      income,
      expenses,
    };
  });

  res.json(GetBalanceTrendResponse.parse(result));
});

router.get("/insights/monthly-comparison", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`TO_CHAR(${transactionsTable.date}, 'YYYY-MM')`,
      income: sql<number>`SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount}::numeric ELSE 0 END)`,
      expenses: sql<number>`SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount}::numeric ELSE 0 END)`,
    })
    .from(transactionsTable)
    .groupBy(sql`TO_CHAR(${transactionsTable.date}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactionsTable.date}, 'YYYY-MM') ASC`);

  const result = rows.map(r => ({
    month: r.month,
    income: Number(r.income),
    expenses: Number(r.expenses),
    net: Number(r.income) - Number(r.expenses),
  }));

  res.json(GetMonthlyComparisonResponse.parse(result));
});

export default router;
