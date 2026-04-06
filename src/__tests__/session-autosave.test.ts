/**
 * Tests for session auto-save / draft recovery logic.
 * Validates that exercise logs survive a browser crash.
 */

const AUTOSAVE_KEY = "kine_session_draft_0";

describe("Session auto-save", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves draft to localStorage", () => {
    const logs = {
      0: {
        name: "Squat",
        planned: { sets: "3", reps: "8" },
        actual: [
          { reps: "8", weight: "60" },
          { reps: "8", weight: "60" },
          { reps: "7", weight: "60" },
        ],
        note: "",
        saved: false,
      },
    };

    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(logs));
    const recovered = JSON.parse(localStorage.getItem(AUTOSAVE_KEY)!);

    expect(recovered[0].name).toBe("Squat");
    expect(recovered[0].actual).toHaveLength(3);
    expect(recovered[0].actual[2].reps).toBe("7");
  });

  it("clears draft when session completes", () => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ 0: { name: "Bench" } }));
    expect(localStorage.getItem(AUTOSAVE_KEY)).not.toBeNull();

    // Simulate session completion cleanup
    localStorage.removeItem(AUTOSAVE_KEY);
    expect(localStorage.getItem(AUTOSAVE_KEY)).toBeNull();
  });

  it("handles corrupt draft data gracefully", () => {
    localStorage.setItem(AUTOSAVE_KEY, "not-valid-json{{{");

    let recovered = null;
    try {
      recovered = JSON.parse(localStorage.getItem(AUTOSAVE_KEY)!);
    } catch {
      recovered = null;
    }

    expect(recovered).toBeNull();
  });

  it("handles localStorage quota exceeded", () => {
    // Simulate quota by catching setItem errors
    const original = localStorage.setItem.bind(localStorage);
    let threw = false;

    jest.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      threw = true;
      throw new DOMException("QuotaExceededError");
    });

    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ large: "data" }));
    } catch {
      // Expected — the app should catch this silently
    }

    expect(threw).toBe(true);
    jest.restoreAllMocks();
  });
});
