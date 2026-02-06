import type { Thread, Project, ModelConfig, FileChange } from "./types";

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "photobooth",
    path: "/Users/dev/projects/photobooth",
    branch: "main",
  },
  {
    id: "proj-2",
    name: "wanderlust",
    path: "/Users/dev/projects/wanderlust",
    branch: "main",
  },
  {
    id: "proj-3",
    name: "recipe-app",
    path: "/Users/dev/projects/recipe-app",
    branch: "develop",
  },
  {
    id: "proj-4",
    name: "game-experiment",
    path: "/Users/dev/projects/game-experiment",
    branch: "feature/physics",
  },
  {
    id: "proj-5",
    name: "openai-apps-sdk-examples",
    path: "/Users/dev/projects/openai-apps-sdk-examples",
    branch: "main",
  },
];

export const mockModels: ModelConfig[] = [
  { id: "gpt-5.2-codex", name: "GPT-5.2-Codex", provider: "OpenAI", qualityLevel: "Extra High" },
  { id: "gpt-5-nano", name: "GPT-5-Nano", provider: "OpenAI", qualityLevel: "Low" },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI", qualityLevel: "High" },
  { id: "claude-opus", name: "Claude Opus", provider: "Anthropic", qualityLevel: "Extra High" },
  { id: "claude-sonnet", name: "Claude Sonnet", provider: "Anthropic", qualityLevel: "High" },
];

const mockFileChanges: FileChange[] = [
  {
    filePath: "app/api/generate/route.ts",
    additions: 1,
    deletions: 1,
    hunks: [
      {
        filePath: "app/api/generate/route.ts",
        oldStart: 100,
        newStart: 100,
        lines: [
          { type: "context", content: "", oldLineNumber: 100, newLineNumber: 100 },
          { type: "context", content: "  const captionPromise = client.responses", oldLineNumber: 101, newLineNumber: 101 },
          { type: "context", content: "    .create({", oldLineNumber: 102, newLineNumber: 102 },
          { type: "deletion", content: '      model: "gpt-5-nano",', oldLineNumber: 103 },
          { type: "addition", content: '      model: "gpt-5.2",', newLineNumber: 103 },
          { type: "context", content: "", oldLineNumber: 104, newLineNumber: 104 },
          { type: "context", content: '      instructions:', oldLineNumber: 105, newLineNumber: 105 },
          { type: "context", content: '        "Write a short polaroid caption as if someone labeled it with a sha', oldLineNumber: 106, newLineNumber: 106 },
        ],
      },
    ],
  },
  {
    filePath: "app/components/BackgroundEffects.tsx",
    additions: 12,
    deletions: 0,
    hunks: [
      {
        filePath: "app/components/BackgroundEffects.tsx",
        oldStart: 1,
        newStart: 1,
        lines: [
          { type: "addition", content: "export function BackgroundEffects() {", newLineNumber: 1 },
          { type: "addition", content: "  return (", newLineNumber: 2 },
          { type: "addition", content: '    <div className="pointer-events-none absolute inset-0">', newLineNumber: 3 },
          { type: "addition", content: '      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,', newLineNumber: 4 },
          { type: "addition", content: '      <div className="absolute inset-0 opacity-[0.16] mix-blend-soft-light an', newLineNumber: 5 },
          { type: "addition", content: '      <div className="absolute inset-0 opacity-[0.32] mix-blend-overlay [back', newLineNumber: 6 },
          { type: "addition", content: '      <div className="absolute inset-0 opacity-[0.32] [background-image:radia', newLineNumber: 7 },
          { type: "addition", content: '      <div className="absolute inset-0 bg-[radial-gradient(140%_90%_at_50%_12', newLineNumber: 8 },
          { type: "addition", content: '      <div className="absolute -top-56 left-1/2 h-[420px] w-[760px] -translat', newLineNumber: 9 },
          { type: "addition", content: "    </div>", newLineNumber: 10 },
          { type: "addition", content: "  );", newLineNumber: 11 },
          { type: "addition", content: "}", newLineNumber: 12 },
        ],
      },
    ],
  },
  {
    filePath: "app/components/BoothTopPanel.tsx",
    additions: 35,
    deletions: 0,
    hunks: [
      {
        filePath: "app/components/BoothTopPanel.tsx",
        oldStart: 1,
        newStart: 1,
        lines: [
          { type: "addition", content: "type BoothTopPanelProps = {", newLineNumber: 1 },
          { type: "addition", content: "  isGenerating: boolean;", newLineNumber: 2 },
          { type: "addition", content: "  hasPhotos: boolean;", newLineNumber: 3 },
          { type: "addition", content: "};", newLineNumber: 4 },
          { type: "addition", content: "", newLineNumber: 5 },
          { type: "addition", content: "export function BoothTopPanel({ isGenerating, hasPhotos }: BoothTopPanelProps", newLineNumber: 6 },
          { type: "addition", content: "  return (", newLineNumber: 7 },
          { type: "addition", content: '    <div className="mb-7 mt-10 flex items-center justify-between rounded-[30p', newLineNumber: 8 },
          { type: "addition", content: '      <div className="flex items-center gap-2.5">', newLineNumber: 9 },
          { type: "addition", content: "        <span", newLineNumber: 10 },
          { type: "addition", content: '          className={"h-3 w-3 rounded-full border border-black/50 shadow-[0_0', newLineNumber: 11 },
          { type: "addition", content: '            isGenerating ? "bg-red-400" : hasPhotos ? "bg-emerald-300" : "bg-', newLineNumber: 12 },
          { type: "addition", content: '          }"}', newLineNumber: 13 },
          { type: "addition", content: "        />", newLineNumber: 14 },
          { type: "addition", content: '        <span className="h-3 w-3 rounded-full border border-black/50 bg-amber', newLineNumber: 15 },
          { type: "addition", content: '        <span className="h-3 w-3 rounded-full border border-black/50 bg-white', newLineNumber: 16 },
        ],
      },
    ],
  },
];

export const mockThreads: Thread[] = [
  {
    id: "thread-1",
    title: "Polish app for launch prep",
    projectName: "photobooth",
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 2,
    isActive: true,
    totalAdditions: 863,
    totalDeletions: 332,
    unstagedCount: 33,
    stagedCount: 1,
    fileChanges: mockFileChanges,
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Polish the UI with new launch-ready typography, metadata, and clearer guidance across the booth, prompt dialog, and archive so the experience feels intentional and production-ready.",
        timestamp: Date.now() - 1000 * 60 * 25,
      },
      {
        id: "msg-2",
        role: "assistant",
        content: `Polished the UI with new launch-ready typography, metadata, and clearer guidance across the booth, prompt dialog, and archive so the experience feels intentional and production-ready.

**Changes:**

- **layout.tsx** set launch metadata and swapped to Bebas Neue + Sora for a stronger visual system.
- **globals.css** aligned base colors/selection, added \`.font-display\`, and reduced-motion safeguards.
- **page.tsx** upgraded the hero with a clear value prop + feature chips and added a Snap helper line.
- **PhotoStrip.tsx** added a "Session Archive" header, shot count badge, and a clearer empty state.
- **PromptDialog.tsx** added a prompt tip + character limit indicator and made errors \`role="alert"\`.
- **ShutterStatusOverlay.tsx** and **PreviewPolaroid.tsx** now guide first-time users.
- **CaptionCard.tsx** got a label for readability.
- **SnapButton.tsx** now returns only the button so the page controls surrounding copy.

Tests not run (per instructions).

I noticed pre-existing changes/untracked items I didn't make in \`route.ts\`, \`package.json\`, \`package-lock.json\`, \`environment.toml\`, \`public/patterns/\`, \`output/\`, \`test-results/\`, and the \`app/components/\` directory is currently untracked. I only edited files inside \`app/components/\` for this task. How do you want to handle the other changes?

**Next steps (optional):**

1. \`npm run dev\` to review the polish in browser.
2. I can add a share/download action or an OG image if you want extra launch touches.`,
        timestamp: Date.now() - 1000 * 60 * 10,
        fileEdits: [
          { id: "fe-1", filePath: "app/components/CaptionCard.tsx", additions: 5, deletions: 2, status: "edited" },
          { id: "fe-2", filePath: "app/components/PhotoStrip.tsx", additions: 22, deletions: 2, status: "edited" },
          { id: "fe-3", filePath: "app/components/PreviewPolaroid.tsx", additions: 5, deletions: 2, status: "edited" },
          { id: "fe-4", filePath: "app/components/PromptDialog.tsx", additions: 12, deletions: 1, status: "edited" },
          { id: "fe-5", filePath: "app/components/ShutterStatusOverlay.tsx", additions: 7, deletions: 1, status: "edited" },
          { id: "fe-6", filePath: "app/components/SnapButton.tsx", additions: 17, deletions: 19, status: "edited" },
          { id: "fe-7", filePath: "app/globals.css", additions: 32, deletions: 12, status: "edited" },
          { id: "fe-8", filePath: "app/layout.tsx", additions: 26, deletions: 8, status: "edited" },
          { id: "fe-9", filePath: "app/page.tsx", additions: 30, deletions: 7, status: "edited" },
        ],
        toolCalls: [
          { id: "tc-1", name: "Edited SnapButton.tsx", args: "+17 -19", status: "completed" },
          { id: "tc-2", name: "Edited PhotoStrip.tsx", args: "+22 -2", status: "completed" },
          { id: "tc-3", name: "Edited PreviewPolaroid.tsx", args: "+5 -2", status: "completed" },
          { id: "tc-4", name: "Edited PromptDialog.tsx", args: "+4 -1", status: "completed" },
          { id: "tc-5", name: "Ran git status -sb", args: "", status: "completed" },
          { id: "tc-6", name: "Explored 1 list", args: "", status: "completed" },
        ],
      },
    ],
  },
  {
    id: "thread-2",
    title: "Add drag and drop to gallery phot...",
    projectName: "photobooth",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    isActive: false,
    totalAdditions: 0,
    totalDeletions: 0,
    unstagedCount: 0,
    stagedCount: 0,
    fileChanges: [],
    messages: [],
  },
  {
    id: "thread-3",
    title: "Create new app",
    projectName: "recipe-app",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    isActive: false,
    totalAdditions: 0,
    totalDeletions: 0,
    unstagedCount: 0,
    stagedCount: 0,
    fileChanges: [],
    messages: [],
  },
  {
    id: "thread-4",
    title: "Localize iOS app",
    projectName: "wanderlust",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    isActive: false,
    totalAdditions: 0,
    totalDeletions: 0,
    unstagedCount: 0,
    stagedCount: 0,
    fileChanges: [],
    messages: [],
  },
];

export const defaultModel: ModelConfig = mockModels[0];
