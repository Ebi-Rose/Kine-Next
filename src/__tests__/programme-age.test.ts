jest.mock("@/store/useKineStore", () => ({
  useKineStore: {
    getState: jest.fn(),
  },
}));

import { useKineStore } from "@/store/useKineStore";
import { getProgrammeMaturity } from "@/lib/programme-age";

const mockGetState = useKineStore.getState as jest.Mock;

function mockStore(totalSessions: number, currentWeek: number) {
  mockGetState.mockReturnValue({
    progressDB: {
      sessions: Array.from({ length: totalSessions }, (_, i) => ({ date: "2025-01-01" })),
      currentWeek,
      lifts: {},
    },
  });
}

beforeEach(() => jest.clearAllMocks());

describe("getProgrammeMaturity", () => {
  it("returns 'early' for brand new users", () => {
    mockStore(0, 1);
    expect(getProgrammeMaturity()).toBe("early");
  });

  it("returns 'early' when sessions are high but weeks are low (power user)", () => {
    mockStore(40, 2);
    expect(getProgrammeMaturity()).toBe("early");
  });

  it("returns 'early' when weeks are high but sessions are low (infrequent user)", () => {
    mockStore(3, 10);
    expect(getProgrammeMaturity()).toBe("early");
  });

  it("returns 'developing' when both signals agree", () => {
    mockStore(10, 4);
    expect(getProgrammeMaturity()).toBe("developing");
  });

  it("returns 'developing' not 'established' when sessions qualify but weeks don't", () => {
    mockStore(30, 5);
    expect(getProgrammeMaturity()).toBe("developing");
  });

  it("returns 'established' when both signals agree", () => {
    mockStore(30, 10);
    expect(getProgrammeMaturity()).toBe("established");
  });

  it("returns 'mature' only when both signals qualify", () => {
    mockStore(50, 14);
    expect(getProgrammeMaturity()).toBe("mature");
  });

  it("returns 'established' not 'mature' when weeks qualify but sessions don't", () => {
    mockStore(35, 14);
    expect(getProgrammeMaturity()).toBe("established");
  });

  it("uses the more conservative of the two signals", () => {
    // 100 sessions but only week 5 → capped at "developing" by weeks
    mockStore(100, 5);
    expect(getProgrammeMaturity()).toBe("developing");
  });
});
