import express from "express";
import env from "../../config/env";
import { authenticateToken } from "../../middlewares/authentication";
import { asyncHandler } from "../../middlewares/error";
import * as TicketService from "../../services/tickets";

const router = express.Router();

router.post(
  "/tickets",
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const ticket = await TicketService.generateTicket(req.user.username);

    return res.status(201).json({
      type: "Ticket",
      ticket,
      subject: req.user.username,
      expires: env.security.ticket.expires,
    });
  })
);

export default router;
