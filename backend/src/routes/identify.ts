import { Router, Request, Response } from "express";
import { identifyContact } from "../services/contactService";

const router = Router();

router.post("/identify", async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    res.status(400).json({ error: "At least one of email or phoneNumber is required." });
    return;
  }

  try {
    const result = await identifyContact({
      email: email ?? null,
      phoneNumber: phoneNumber ? String(phoneNumber) : null,
    });
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
