"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyContact = identifyContact;
const prisma_1 = __importDefault(require("../db/prisma"));
async function identifyContact(input) {
    const { email, phoneNumber } = input;
    // Build OR conditions — at least one must be present
    const orConditions = [];
    if (email)
        orConditions.push({ email });
    if (phoneNumber)
        orConditions.push({ phoneNumber });
    // Step 1: Find all contacts that match email OR phoneNumber
    const matchedContacts = await prisma_1.default.contact.findMany({
        where: {
            OR: orConditions,
            deletedAt: null,
        },
    });
    // Step 2: No match → create new primary contact
    if (matchedContacts.length === 0) {
        const newContact = await prisma_1.default.contact.create({
            data: {
                email: email ?? null,
                phoneNumber: phoneNumber ?? null,
                linkPrecedence: "primary",
                linkedId: null,
            },
        });
        return buildResponse(newContact, []);
    }
    // Step 3: Collect all linked contacts (primaries + their clusters)
    // Find all primary IDs from matched contacts
    const primaryIds = new Set();
    for (const c of matchedContacts) {
        if (c.linkPrecedence === "primary") {
            primaryIds.add(c.id);
        }
        else if (c.linkedId !== null) {
            primaryIds.add(c.linkedId);
        }
    }
    // Fetch all contacts in all matched clusters
    const allClusterContacts = await prisma_1.default.contact.findMany({
        where: {
            OR: [
                { id: { in: Array.from(primaryIds) } },
                { linkedId: { in: Array.from(primaryIds) } },
            ],
            deletedAt: null,
        },
    });
    // Step 4: Determine the true primary (oldest createdAt among primaries)
    const primaries = allClusterContacts.filter((c) => c.linkPrecedence === "primary");
    primaries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const truePrimary = primaries[0];
    // Step 5: If multiple primaries, demote newer ones to secondary
    const demotion = [];
    for (const p of primaries.slice(1)) {
        demotion.push(prisma_1.default.contact.update({
            where: { id: p.id },
            data: {
                linkPrecedence: "secondary",
                linkedId: truePrimary.id,
                updatedAt: new Date(),
            },
        }));
    }
    const demotedContacts = await Promise.all(demotion);
    // Also re-point secondaries of demoted primaries to truePrimary
    const demotedIds = primaries.slice(1).map((p) => p.id);
    if (demotedIds.length > 0) {
        await prisma_1.default.contact.updateMany({
            where: {
                linkedId: { in: demotedIds },
                deletedAt: null,
            },
            data: {
                linkedId: truePrimary.id,
                updatedAt: new Date(),
            },
        });
    }
    // Step 6: Check if the incoming request has new information
    // Rebuild full cluster after demotions
    const updatedCluster = await prisma_1.default.contact.findMany({
        where: {
            OR: [{ id: truePrimary.id }, { linkedId: truePrimary.id }],
            deletedAt: null,
        },
    });
    const existingEmails = new Set(updatedCluster.map((c) => c.email).filter(Boolean));
    const existingPhones = new Set(updatedCluster.map((c) => c.phoneNumber).filter(Boolean));
    const isNewEmail = email && !existingEmails.has(email);
    const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);
    // Create secondary only if there is genuinely new info
    let finalCluster = updatedCluster;
    if (isNewEmail || isNewPhone) {
        const newSecondary = await prisma_1.default.contact.create({
            data: {
                email: email ?? null,
                phoneNumber: phoneNumber ?? null,
                linkedId: truePrimary.id,
                linkPrecedence: "secondary",
            },
        });
        finalCluster = [...updatedCluster, newSecondary];
    }
    const secondaries = finalCluster.filter((c) => c.linkPrecedence === "secondary");
    return buildResponse(truePrimary, secondaries);
}
function buildResponse(primary, secondaries) {
    // Deduplicate, primary values first
    const emails = [];
    const phones = [];
    const secondaryIds = [];
    if (primary.email)
        emails.push(primary.email);
    if (primary.phoneNumber)
        phones.push(primary.phoneNumber);
    for (const s of secondaries) {
        secondaryIds.push(s.id);
        if (s.email && !emails.includes(s.email))
            emails.push(s.email);
        if (s.phoneNumber && !phones.includes(s.phoneNumber))
            phones.push(s.phoneNumber);
    }
    return {
        contact: {
            primaryContatctId: primary.id,
            emails,
            phoneNumbers: phones,
            secondaryContactIds: secondaryIds,
        },
    };
}
