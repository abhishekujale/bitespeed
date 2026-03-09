"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contactService_1 = require("../services/contactService");
const router = (0, express_1.Router)();
router.post("/identify", async (req, res) => {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
        res.status(400).json({ error: "At least one of email or phoneNumber is required." });
        return;
    }
    try {
        const result = await (0, contactService_1.identifyContact)({
            email: email ?? null,
            phoneNumber: phoneNumber ? String(phoneNumber) : null,
        });
        res.status(200).json(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error." });
    }
});
exports.default = router;
