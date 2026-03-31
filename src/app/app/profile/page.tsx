"use client";

import { useState } from "react";
import type { Panel } from "./panels/_helpers";
import OverviewPanel from "./panels/OverviewPanel";
import PersonalPanel from "./panels/PersonalPanel";
import TrainingPanel from "./panels/TrainingPanel";
import HealthPanel from "./panels/HealthPanel";
import SessionPreferencesPanel from "./panels/SessionPreferencesPanel";
import LiftsPanel from "./panels/LiftsPanel";
import SubscriptionPanel from "./panels/SubscriptionPanel";
import SettingsPanel from "./panels/SettingsPanel";
import PrivacyPanel from "./panels/PrivacyPanel";

export default function ProfilePage() {
  const [panel, setPanel] = useState<Panel>("overview");

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-accent">Profile</h1>

      {panel === "overview" && <OverviewPanel onNavigate={setPanel} />}
      {panel === "personal" && <PersonalPanel onBack={() => setPanel("overview")} />}
      {panel === "training" && <TrainingPanel onBack={() => setPanel("overview")} />}
      {panel === "health" && <HealthPanel onBack={() => setPanel("overview")} />}
      {panel === "session" && <SessionPreferencesPanel onBack={() => setPanel("overview")} />}
      {panel === "lifts" && <LiftsPanel onBack={() => setPanel("overview")} />}
      {panel === "subscription" && <SubscriptionPanel onBack={() => setPanel("overview")} />}
      {panel === "settings" && <SettingsPanel onBack={() => setPanel("overview")} />}
      {panel === "privacy" && <PrivacyPanel onBack={() => setPanel("overview")} />}
    </div>
  );
}
