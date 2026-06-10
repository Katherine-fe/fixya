import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import servicesRouter from "./services";
import techniciansRouter from "./technicians";
import requestsRouter from "./requests";
import paymentsRouter from "./payments";
import reviewsRouter from "./reviews";
import dashboardRouter from "./dashboard";
import seedRouter from "./seed";

const router = Router();

router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/seed", seedRouter);
router.use("/users", usersRouter);
router.use("/services", servicesRouter);
router.use("/technicians", techniciansRouter);
router.use("/requests", requestsRouter);
router.use("/payments", paymentsRouter);
router.use("/reviews", reviewsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
