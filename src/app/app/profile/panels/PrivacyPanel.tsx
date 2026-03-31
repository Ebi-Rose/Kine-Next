"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import { formatDateWithYear } from "@/lib/format";
import { syncNow } from "@/lib/sync";
import { toast } from "@/components/Toast";
import { BackButton } from "./_helpers";

export default function PrivacyPanel({ onBack }: { onBack: () => void }) {
  const { consents, recordConsent, cycleLocalOnly, setCycleLocalOnly } = useKineStore();
  const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);

  const healthConsent = consents.find((c) => c.type === "health_data");
  const termsConsent = consents.find((c) => c.type === "terms");
  const privacyConsent = consents.find((c) => c.type === "privacy");
  const healthGranted = healthConsent?.granted === true;

  function handleToggleHealthConsent() {
    if (healthGranted) {
      setShowWithdrawWarning(true);
    } else {
      recordConsent("health_data", true);
      syncNow();
      toast("Health data consent granted", "success");
    }
  }

  function confirmWithdraw() {
    recordConsent("health_data", false);
    syncNow();
    setShowWithdrawWarning(false);
    toast("Health data consent withdrawn", "success");
  }

  function handleToggleCycleLocal() {
    setCycleLocalOnly(!cycleLocalOnly);
    syncNow();
    toast(cycleLocalOnly ? "Cycle data will sync to cloud" : "Cycle data will stay on this device", "success");
  }

  function formatConsentDate(timestamp?: string) {
    if (!timestamp) return "Not recorded";
    return formatDateWithYear(timestamp);
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Privacy</h2>

      <div className="mt-4 flex flex-col gap-4">
        {/* Consent status */}
        <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <h3 className="text-sm font-medium text-text mb-3">Consent status</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text">Health data</p>
                <p className="text-[10px] text-muted2">Cycle, conditions, injuries</p>
              </div>
              <div className="text-right">
                <span className={`text-xs ${healthGranted ? "text-green-400" : "text-red-400"}`}>
                  {healthGranted ? "Granted" : "Withdrawn"}
                </span>
                <p className="text-[10px] text-muted2">{formatConsentDate(healthConsent?.timestamp)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text">Terms of service</p>
              <div className="text-right">
                <span className={`text-xs ${termsConsent?.granted ? "text-green-400" : "text-muted2"}`}>
                  {termsConsent?.granted ? "Accepted" : "Not accepted"}
                </span>
                <p className="text-[10px] text-muted2">{formatConsentDate(termsConsent?.timestamp)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text">Privacy policy</p>
              <div className="text-right">
                <span className={`text-xs ${privacyConsent?.granted ? "text-green-400" : "text-muted2"}`}>
                  {privacyConsent?.granted ? "Accepted" : "Not accepted"}
                </span>
                <p className="text-[10px] text-muted2">{formatConsentDate(privacyConsent?.timestamp)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Health data consent toggle */}
        <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Health data processing</p>
              <p className="text-xs text-muted2 mt-1">
                Allows syncing cycle, conditions, and injury data to the cloud for backup and cross-device access.
              </p>
            </div>
            <button
              onClick={handleToggleHealthConsent}
              className={`ml-4 flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                healthGranted ? "bg-accent" : "bg-surface2"
              }`}
              role="switch"
              aria-checked={healthGranted}
              aria-label="Health data consent"
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
                healthGranted ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>

          {showWithdrawWarning && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-400 font-medium">Withdraw health data consent?</p>
              <p className="mt-1.5 text-[10px] text-muted2 leading-relaxed">
                Without health data consent, Kine will no longer be able to:
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                <li className="text-[10px] text-muted2 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong className="text-text">Adapt to your cycle</strong> — no phase-aware programming</span>
                </li>
                <li className="text-[10px] text-muted2 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong className="text-text">Filter for conditions</strong> — comfort flags won&apos;t apply</span>
                </li>
                <li className="text-[10px] text-muted2 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong className="text-text">Personalise warmups</strong> — injury-specific mods removed</span>
                </li>
              </ul>
              <p className="mt-1.5 text-[10px] text-muted2">
                Your programme will still work, but without these personalisation layers. Local data is not affected.
              </p>
              <div className="mt-2.5 flex gap-2">
                <button onClick={() => setShowWithdrawWarning(false)}
                  className="rounded-lg border border-[rgba(196,144,152,0.3)] bg-accent-dim px-3 py-1.5 text-xs font-medium text-accent hover:opacity-90 transition-colors">
                  Keep consent
                </button>
                <button onClick={confirmWithdraw}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted2 hover:text-text transition-colors">
                  Withdraw
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cycle data device-only */}
        {healthGranted && (
          <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Keep cycle data on this device only</p>
                <p className="text-xs text-muted2 mt-1">
                  Your cycle data will still personalise your programme, but won&apos;t be stored in the cloud.
                </p>
              </div>
              <button
                onClick={handleToggleCycleLocal}
                className={`ml-4 flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                  cycleLocalOnly ? "bg-accent" : "bg-surface2"
                }`}
                role="switch"
                aria-checked={cycleLocalOnly}
                aria-label="Cycle data local only"
              >
                <span className={`block w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
                  cycleLocalOnly ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
