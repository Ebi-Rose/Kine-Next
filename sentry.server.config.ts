import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5e3a01f49c7e5a177812bf0aeca8d43f@o4511127823056896.ingest.de.sentry.io/4511127826989136",
  tracesSampleRate: 0.1,
});
