import type { ToolDefinition } from "@/lib/tools/types";

export const meta: ToolDefinition = {
  id: "adv-project-planner",
  slug: "adv-project-planner",
  name: "Adv. Project Planner",
  description: "Build a layered plan, org chart or process map with levels you name yourself, and share it as a read-only link.",
  intro: [
    "Adv. Project Planner turns any idea into a clear map. You decide how many levels the plan has and what each one is called, from Goal, Phase and Task to Company, Department and Team. Every level gets its own colour and a light band with a heading, so the structure reads at a glance.",
    "Switch the same plan between top-down, left-to-right, radial and outline layouts. Add status, due dates, notes and your own tags to any box, then export the plan as an image, PDF or file, or send a read-only link. Everything runs in your browser and is saved on your device, so nothing is uploaded.",
  ],
  category: "productivity",
  icon: "briefcase",
  tags: ["planner", "org chart", "mind map", "project plan", "work breakdown structure", "process map"],
  keywords: ["project planner online", "org chart maker", "organization chart maker free", "work breakdown structure maker", "mind map maker", "process map maker", "project structure planner", "hierarchy chart maker", "project plan template"],
  status: "active",
  processingMode: "browser-local",
  privacyNote: "Your plan is built and saved in this browser. It is never uploaded. A shared link carries the plan inside the link itself, not on our servers.",
  seoTitle: "Project Planner and Org Chart Maker Online Free | Artify Tools",
  seoDescription: "Plan projects, org charts and processes with levels you name yourself. Top-down, left-to-right, radial and outline layouts, export, and read-only links. Free and private.",
  lastUpdated: "2026-11-05",
  howTo: [
    "Pick a starting point (blank, project plan, company structure or process map), or paste an indented outline.",
    "Select a box, then use Add child or Add sibling. Rename the levels and choose their colours under Levels and tags.",
    "Add status, due dates, notes and your own tags, and switch layouts to see the plan another way.",
    "Copy a read-only link to share it, or export it as PNG, SVG, PDF or a plan file.",
  ],
  examples: [
    { label: "Project plan", input: "Goal → Phase → Task", output: "A colour-banded map of the launch, phase by phase" },
    { label: "Company structure", input: "Company → Department → Team", output: "An org chart you can view top-down or as a radial map" },
  ],
  faqs: [
    { question: "Can I choose my own levels?", answer: "Yes. Levels are not fixed. Rename them, change their colours and add as many as you need under Levels and tags. Each level appears as a coloured band with its heading." },
    { question: "How do I share a plan?", answer: "Press Copy read-only link. Anyone who opens the link can view and expand the plan but cannot change it, and they can make their own editable copy. Very large plans make long links, so use the plan file for those." },
    { question: "Is my plan uploaded or stored on a server?", answer: "No. Plans are saved in your browser on your device. A read-only link carries the plan inside the link, so nothing is stored on a server." },
    { question: "Which layouts are available?", answer: "Top-down, left-to-right, radial and an outline list. You can switch between them at any time; the outline is the easiest on a phone." },
    { question: "Can I export my plan?", answer: "Yes, as a PNG or SVG image, a PDF, or a plan file you can open again later." },
  ],
  popularRank: 2.6,
  related: ["word-counter", "text-cleaner", "uuid-generator"],
};
