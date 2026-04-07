/**
 * LifeStageStep tests.
 *
 * Verifies the optional onboarding flow for the Progress page personalization
 * engine. The step must be:
 *   1. Skippable without setting a value (principle #20)
 *   2. Save-and-advance when an option is tapped
 *   3. Show the current selection if the user has already set one
 *   4. Lead with optional framing — never imply life stage is required
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import LifeStageStep from "../LifeStageStep";

// ── Store mock ────────────────────────────────────────────────────────────

let mockLifeStage: string | undefined = undefined;
const setLifeStage = jest.fn();

jest.mock("@/store/useKineStore", () => ({
  useKineStore: () => ({
    personalProfile: { lifeStage: mockLifeStage },
    setLifeStage,
  }),
}));

beforeEach(() => {
  mockLifeStage = undefined;
  setLifeStage.mockClear();
});

// ── Tests ────────────────────────────────────────────────────────────────

describe("LifeStageStep", () => {
  it("renders the optional framing copy", () => {
    render(<LifeStageStep onNext={jest.fn()} />);
    expect(screen.getByText(/Optional/)).toBeInTheDocument();
    expect(screen.getByText(/shapes how Kinē shows your progress/)).toBeInTheDocument();
    expect(screen.getByText(/never how it talks to you/)).toBeInTheDocument();
  });

  it("renders all 5 life stage options", () => {
    render(<LifeStageStep onNext={jest.fn()} />);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Postpartum")).toBeInTheDocument();
    expect(screen.getByText("Perimenopause")).toBeInTheDocument();
    expect(screen.getByText("Post-menopause")).toBeInTheDocument();
  });

  it("offers a 'Prefer not to say' skip path", () => {
    render(<LifeStageStep onNext={jest.fn()} />);
    expect(screen.getByText(/Prefer not to say/)).toBeInTheDocument();
  });

  it("skipping calls onNext without setting a life stage", () => {
    const onNext = jest.fn();
    render(<LifeStageStep onNext={onNext} />);

    fireEvent.click(screen.getByText(/Prefer not to say/));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(setLifeStage).not.toHaveBeenCalled();
  });

  it("selecting a stage saves it AND advances in one tap", () => {
    const onNext = jest.fn();
    render(<LifeStageStep onNext={onNext} />);

    fireEvent.click(screen.getByText("Postpartum"));

    expect(setLifeStage).toHaveBeenCalledWith("postpartum");
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("selecting perimenopause saves the perimenopause value", () => {
    render(<LifeStageStep onNext={jest.fn()} />);
    fireEvent.click(screen.getByText("Perimenopause"));
    expect(setLifeStage).toHaveBeenCalledWith("perimenopause");
  });

  it("highlights the currently selected stage with aria-pressed", () => {
    mockLifeStage = "perimenopause";
    render(<LifeStageStep onNext={jest.fn()} />);

    const button = screen.getByText("Perimenopause").closest("button")!;
    expect(button).toHaveAttribute("aria-pressed", "true");

    const general = screen.getByText("General").closest("button")!;
    expect(general).toHaveAttribute("aria-pressed", "false");
  });

  it("shows option descriptions to help users choose", () => {
    render(<LifeStageStep onNext={jest.fn()} />);
    // The constants file gives each option a one-line description.
    // Just verify a couple are rendered, not the exact wording.
    expect(screen.getByText(/Sessions tracked as showing-up/)).toBeInTheDocument();
    expect(screen.getByText(/12-week trend window/)).toBeInTheDocument();
  });
});
