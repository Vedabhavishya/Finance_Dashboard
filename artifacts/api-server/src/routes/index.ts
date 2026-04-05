import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(insightsRouter);

export default router;
