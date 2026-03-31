export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = (...args: unknown[]) => {
  // Dynamic import to avoid bundling Sentry when DSN is missing
  import("@sentry/nextjs").then((Sentry) => {
    if (typeof Sentry.captureRequestError === "function") {
      // @ts-expect-error — spread args to Sentry's handler
      Sentry.captureRequestError(...args);
    }
  });
};
