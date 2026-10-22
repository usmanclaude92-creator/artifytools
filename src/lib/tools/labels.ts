import type { ProcessingMode, ToolStatus } from "./types";

export const processingLabels: Record<ProcessingMode, { label: string; short: string; description: string }> = {
  "browser-local": {
    label: "Processed in your browser",
    short: "Local",
    description:
      "Your input is processed on your device. It is not uploaded to an Artify server or shared with any third party.",
  },
  "server-side": {
    label: "Processed on an Artify server",
    short: "Server",
    description: "Your input is sent to an Artify server to be processed and is not kept after the response is returned.",
  },
  "external-provider": {
    label: "Sent to an external provider",
    short: "Provider",
    description:
      "Your input is sent through an Artify server to a third-party provider that performs the processing.",
  },
};

export const statusLabels: Record<ToolStatus, string> = {
  active: "Available",
  beta: "Beta",
  "coming-soon": "Coming soon",
};
