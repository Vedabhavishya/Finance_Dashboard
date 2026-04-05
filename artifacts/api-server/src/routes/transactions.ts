import { Router, type IRouter } from "express";
import { eq, and, ilike, desc, asc, sql } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  CreateTransactionBody,
  GetTransactionParams,
  GetTransactionResponse,
  UpdateTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionResponse,
  DeleteTransactionParams,
  ListTransactionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { category, type, search, sortBy, sortOrder } = query.data;

  let dbQuery = db.select().from(transactionsTable).$dynamic();

  const conditions = [];
  if (category) conditions.push(eq(transactionsTable.category, category));
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (search) conditions.push(ilike(transactionsTable.description, `%${search}%`));
  if (conditions.length > 0) dbQuery = dbQuery.where(and(...conditions));

  const order = sortOrder === "asc" ? asc : desc;
  if (sortBy === "amount") {
    dbQuery = dbQuery.orderBy(order(sql`${transactionsTable.amount}::numeric`));
  } else if (sortBy === "category") {
    dbQuery = dbQuery.orderBy(order(transactionsTable.category));
  } else {
    dbQuery = dbQuery.orderBy(order(transactionsTable.date));
  }

  const rows = await dbQuery;
  res.json(ListTransactionsResponse.parse(rows.map(r => ({
    ...r,
    amount: Number(r.amount),
  }))));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(transactionsTable).values(parsed.data).returning();
  res.status(201).json(GetTransactionResponse.parse({ ...row, amount: Number(row.amount) }));
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(GetTransactionResponse.parse({ ...row, amount: Number(row.amount) }));
});

router.put("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(transactionsTable).set(parsed.data).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(UpdateTransactionResponse.parse({ ...row, amount: Number(row.amount) }));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(transactionsTable).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
