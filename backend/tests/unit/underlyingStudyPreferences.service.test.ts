import express from "express";
import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../../src/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../../src/db";
import { getMyUnderlyingStudyPreferences } from "../../src/controllers/underlyingStudyPreferences.controller";
import {
  getUnderlyingStudyPersonalization,
  normalizeStudyValues,
  recordUnderlyingStudySelections,
  validateUnderlyingStudySubmission,
} from "../../src/services/underlyingStudyPreferences.service";

const queryMock = vi.mocked(pool.query);

describe("underlying-study preferences", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("normalizes, deduplicates, and rejects unknown studies", () => {
    expect(
      normalizeStudyValues(
        JSON.stringify([
          "RSI",
          "macd",
          "rsi",
          "unknown_study",
          "bad-value",
          123,
        ])
      )
    ).toEqual(["rsi", "macd"]);
  });

  it("validates canonical labels and values for publishing", () => {
    expect(
      validateUnderlyingStudySubmission({
        studyText:
          "Average Directional Index (ADX), Fibonacci Retracements & Extensions",
        studyValues: JSON.stringify(["adx", "fibonacci_retracements"]),
        required: true,
      })
    ).toEqual({
      valid: true,
      text:
        "Average Directional Index (ADX), Fibonacci Retracements & Extensions",
      values: ["adx", "fibonacci_retracements"],
    });
  });

  it("rejects missing, mismatched, unknown, and oversized studies", () => {
    expect(
      validateUnderlyingStudySubmission({
        studyText: "",
        studyValues: [],
        required: true,
      }).valid
    ).toBe(false);

    expect(
      validateUnderlyingStudySubmission({
        studyText: "MACD",
        studyValues: ["rsi"],
        required: true,
      }).valid
    ).toBe(false);

    expect(
      validateUnderlyingStudySubmission({
        studyText: "Unknown",
        studyValues: ["unknown"],
        required: true,
      }).valid
    ).toBe(false);

    expect(
      validateUnderlyingStudySubmission({
        studyText: "R".repeat(256),
        studyValues: ["rsi"],
        required: true,
      }).valid
    ).toBe(false);
  });

  it("allows an incomplete draft without an underlying study", () => {
    expect(
      validateUnderlyingStudySubmission({
        studyText: null,
        studyValues: undefined,
        required: false,
      })
    ).toEqual({ valid: true, text: null, values: [] });
  });

  it("records each known study once per successful call", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] } as any);

    await recordUnderlyingStudySelections({
      raUserId: "ra-1",
      studyValues: ["rsi", "rsi", "macd", "unknown"],
    });

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("ON CONFLICT"),
      ["ra-1", ["rsi", "macd"]]
    );
  });

  it("does not query the database when no known studies remain", async () => {
    await recordUnderlyingStudySelections({
      raUserId: "ra-1",
      studyValues: ["unknown"],
    });

    expect(queryMock).not.toHaveBeenCalled();
  });

  it("maps recent and frequent query results", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            study_value: "rsi",
            selection_count: "3",
            last_selected_at: "2026-08-07T08:00:00.000Z",
          },
        ],
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            study_value: "macd",
            selection_count: "9",
            last_selected_at: "2026-08-06T08:00:00.000Z",
          },
        ],
      } as any);

    const result =
      await getUnderlyingStudyPersonalization("ra-1");

    expect(result).toEqual({
      recent: [
        {
          value: "rsi",
          selectionCount: 3,
          lastSelectedAt: "2026-08-07T08:00:00.000Z",
        },
      ],
      frequent: [
        {
          value: "macd",
          selectionCount: 9,
          lastSelectedAt: "2026-08-06T08:00:00.000Z",
        },
      ],
    });
  });

  it("denies a non-RA using the current database role", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          role: "CLIENT",
          status: "active",
          is_active: true,
        },
      ],
    } as any);

    const app = express();
    app.get(
      "/preferences",
      (req, _res, next) => {
        (req as any).user = {
          id: "user-1",
          role: "RESEARCH_ANALYST",
        };
        next();
      },
      getMyUnderlyingStudyPreferences
    );

    const response = await request(app).get("/preferences");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ACTIVE_RA_REQUIRED");
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
