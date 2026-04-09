import { scanForRedFlags } from "@/lib/red-flag-scan";

// ── scanForRedFlags ────────────────────────────────────────────────
//
// Deterministic pre-LLM red-flag scanner. Case-insensitive
// word-boundary match of curated keywords against exercise notes.
// Never calls the LLM and never derives safety output from model
// text — this test file is the source of truth for its behaviour.

describe("scanForRedFlags", () => {
  const PELVIC_INDEX = [
    {
      phrase: "Heaviness or bulging in the pelvic floor",
      keywords: ["heaviness", "bulge", "bulging"],
    },
    {
      phrase: "Leaking during or after training",
      keywords: ["leak", "leaking"],
    },
  ];

  it("returns undefined when scan index is empty", () => {
    expect(
      scanForRedFlags(
        [{ name: "Squat", note: "felt heavy and leaking everywhere" }],
        [],
      ),
    ).toBeUndefined();
  });

  it("returns undefined when no notes are provided", () => {
    expect(scanForRedFlags([], PELVIC_INDEX)).toBeUndefined();
  });

  it("returns undefined when no keyword matches", () => {
    expect(
      scanForRedFlags(
        [{ name: "Squat", note: "felt strong, hit all my reps" }],
        PELVIC_INDEX,
      ),
    ).toBeUndefined();
  });

  it("matches a single keyword and surfaces the phrase + source", () => {
    const alert = scanForRedFlags(
      [{ name: "Deadlift", note: "noticed some bulging after set 3" }],
      PELVIC_INDEX,
    );
    expect(alert).toBeDefined();
    expect(alert?.triggered).toEqual([
      "Heaviness or bulging in the pelvic floor",
    ]);
    expect(alert?.sources).toEqual(["Deadlift"]);
    expect(alert?.severity).toBe("warn");
    expect(alert?.cta).toMatch(/physio|doctor/i);
  });

  it("is case insensitive", () => {
    const alert = scanForRedFlags(
      [{ name: "Row", note: "LEAKING during the set" }],
      PELVIC_INDEX,
    );
    expect(alert?.triggered).toContain("Leaking during or after training");
  });

  it("matches word-boundary aware — 'leak' hits 'leaking'", () => {
    const alert = scanForRedFlags(
      [{ name: "Bridge", note: "a bit of leaking" }],
      PELVIC_INDEX,
    );
    expect(alert?.triggered).toContain("Leaking during or after training");
  });

  it("does NOT match when the keyword appears mid-word", () => {
    // "bleaker" should not match "leak"
    const alert = scanForRedFlags(
      [{ name: "Squat", note: "mood was bleaker than usual" }],
      PELVIC_INDEX,
    );
    expect(alert).toBeUndefined();
  });

  it("collects sources across multiple matching exercises", () => {
    const alert = scanForRedFlags(
      [
        { name: "Squat", note: "some bulging" },
        { name: "Deadlift", note: "light leaking" },
        { name: "Press", note: "felt great" },
      ],
      PELVIC_INDEX,
    );
    expect(alert?.sources.sort()).toEqual(["Deadlift", "Squat"]);
    expect(alert?.triggered.length).toBe(2);
  });

  it("dedupes triggered phrases across notes", () => {
    const alert = scanForRedFlags(
      [
        { name: "Squat", note: "bulging" },
        { name: "Deadlift", note: "more bulging here too" },
      ],
      PELVIC_INDEX,
    );
    expect(alert?.triggered).toEqual([
      "Heaviness or bulging in the pelvic floor",
    ]);
  });

  it("skips exercises with empty notes", () => {
    const alert = scanForRedFlags(
      [
        { name: "Squat", note: "" },
        { name: "Deadlift", note: "bulging" },
      ],
      PELVIC_INDEX,
    );
    expect(alert?.sources).toEqual(["Deadlift"]);
  });

  it("escapes regex metacharacters in keywords", () => {
    // Contrived: a keyword containing a regex metachar should match
    // literally, not as a regex.
    const alert = scanForRedFlags(
      [{ name: "Row", note: "felt C.R.P.S. symptoms again" }],
      [{ phrase: "CRPS flare", keywords: ["C.R.P.S."] }],
    );
    expect(alert?.triggered).toContain("CRPS flare");
    // And the dot should not match arbitrary characters:
    const noAlert = scanForRedFlags(
      [{ name: "Row", note: "CxRxPxSx random" }],
      [{ phrase: "CRPS flare", keywords: ["C.R.P.S."] }],
    );
    expect(noAlert).toBeUndefined();
  });

  it("uses fixed cta and warn severity — never varies", () => {
    const a = scanForRedFlags(
      [{ name: "Squat", note: "bulging" }],
      PELVIC_INDEX,
    );
    const b = scanForRedFlags(
      [{ name: "Press", note: "leaking" }],
      PELVIC_INDEX,
    );
    expect(a?.cta).toBe(b?.cta);
    expect(a?.severity).toBe("warn");
    expect(b?.severity).toBe("warn");
  });
});
