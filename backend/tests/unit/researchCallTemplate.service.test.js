"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const researchCallTemplate_service_1 = require("../../src/services/researchCallTemplate.service");
const fieldBlock = (key, locked) => ({
    id: `field:${key}`,
    type: "field",
    fieldKey: key,
    enabled: true,
    locked,
});
const newCallTemplate = {
    version: 1,
    blocks: [
        fieldBlock("recommendationHeading", false),
        fieldBlock("publishedAt", false),
        fieldBlock("instrument", true),
        fieldBlock("symbol", true),
        fieldBlock("exchange", false),
        fieldBlock("action", true),
        fieldBlock("callType", false),
        fieldBlock("entry", true),
        fieldBlock("target1", true),
        fieldBlock("target2", false),
        fieldBlock("target3", false),
        fieldBlock("stopLoss1", true),
        fieldBlock("stopLoss2", false),
        fieldBlock("stopLoss3", false),
        fieldBlock("expiry", false),
        fieldBlock("timeHorizon", true),
        fieldBlock("rationale", false),
        fieldBlock("underlyingStudy", false),
        fieldBlock("remarks", false),
        fieldBlock("raAttribution", true),
        fieldBlock("sebiRegistration", true),
        fieldBlock("contact", false),
        fieldBlock("email", false),
        fieldBlock("disclaimer", true),
    ],
};
const errataTemplate = {
    version: 1,
    blocks: [
        fieldBlock("errataHeading", true),
        fieldBlock("publishedAt", true),
        fieldBlock("instrument", true),
        fieldBlock("symbol", true),
        fieldBlock("exchange", false),
        fieldBlock("action", true),
        fieldBlock("callType", false),
        fieldBlock("entry", true),
        fieldBlock("target1", true),
        fieldBlock("target2", false),
        fieldBlock("target3", false),
        fieldBlock("stopLoss1", true),
        fieldBlock("stopLoss2", false),
        fieldBlock("stopLoss3", false),
        fieldBlock("expiry", false),
        fieldBlock("timeHorizon", true),
        fieldBlock("errataReason", true),
        fieldBlock("raAttribution", true),
        fieldBlock("sebiRegistration", true),
        fieldBlock("contact", false),
        fieldBlock("email", false),
        fieldBlock("disclaimer", true),
    ],
};
(0, vitest_1.describe)("research-call template validation", () => {
    (0, vitest_1.it)("recognizes only supported message types", () => {
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isResearchCallMessageType)("NEW_CALL")).toBe(true);
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isResearchCallMessageType)("ERRATA")).toBe(true);
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isResearchCallMessageType)("EXIT")).toBe(false);
    });
    (0, vitest_1.it)("accepts separate New Call and Errata templates", () => {
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isValidResearchCallTemplate)(newCallTemplate, "NEW_CALL")).toBe(true);
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isValidResearchCallTemplate)(errataTemplate, "ERRATA")).toBe(true);
    });
    (0, vitest_1.it)("does not allow a New Call template to replace Errata requirements", () => {
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isValidResearchCallTemplate)(newCallTemplate, "ERRATA")).toBe(false);
    });
    (0, vitest_1.it)("rejects disabled or altered required fields", () => {
        const corrupted = {
            ...errataTemplate,
            blocks: errataTemplate.blocks.map((block) => block.fieldKey === "errataReason"
                ? { ...block, enabled: false }
                : block),
        };
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isValidResearchCallTemplate)(corrupted, "ERRATA")).toBe(false);
    });
    (0, vitest_1.it)("rejects oversized custom text", () => {
        const corrupted = {
            ...newCallTemplate,
            blocks: [
                ...newCallTemplate.blocks,
                {
                    id: "text:oversized",
                    type: "text",
                    text: "x".repeat(501),
                    enabled: true,
                    locked: false,
                },
            ],
        };
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.isValidResearchCallTemplate)(corrupted, "NEW_CALL")).toBe(false);
    });
    (0, vitest_1.it)("parses only a valid snapshot for the matching message type", () => {
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.parseResearchCallTemplateSnapshot)(JSON.stringify(errataTemplate), "ERRATA")).toEqual(errataTemplate);
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.parseResearchCallTemplateSnapshot)(JSON.stringify(newCallTemplate), "ERRATA")).toBeNull();
        (0, vitest_1.expect)((0, researchCallTemplate_service_1.parseResearchCallTemplateSnapshot)("{invalid-json", "NEW_CALL")).toBeNull();
    });
});
