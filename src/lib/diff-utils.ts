import type { DiffRecord } from "@/lib/tauri-storage";
import type { DiffLine, FileChange } from "@/store/types";

const HUNK_CONTEXT_LINES = 3;

interface AggregatedFileSnapshot {
    filePath: string;
    oldContent: string | null;
    newContent: string | null;
}

interface DiffStats {
    fileChanges: FileChange[];
    totalAdditions: number;
    totalDeletions: number;
    unstagedCount: number;
    stagedCount: number;
}

interface LineOp {
    type: "context" | "addition" | "deletion";
    content: string;
}

function splitLines(content: string | null): string[] {
    if (!content) {
        return [];
    }
    return content.split("\n");
}

function computeLineOps(oldLines: string[], newLines: string[]): LineOp[] {
    const m = oldLines.length;
    const n = newLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        Array<number>(n + 1).fill(0),
    );

    for (let i = m - 1; i >= 0; i -= 1) {
        for (let j = n - 1; j >= 0; j -= 1) {
            if (oldLines[i] === newLines[j]) {
                dp[i][j] = dp[i + 1][j + 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    const ops: LineOp[] = [];
    let i = 0;
    let j = 0;

    while (i < m && j < n) {
        if (oldLines[i] === newLines[j]) {
            ops.push({ type: "context", content: oldLines[i] });
            i += 1;
            j += 1;
            continue;
        }

        if (dp[i + 1][j] >= dp[i][j + 1]) {
            ops.push({ type: "deletion", content: oldLines[i] });
            i += 1;
        } else {
            ops.push({ type: "addition", content: newLines[j] });
            j += 1;
        }
    }

    while (i < m) {
        ops.push({ type: "deletion", content: oldLines[i] });
        i += 1;
    }
    while (j < n) {
        ops.push({ type: "addition", content: newLines[j] });
        j += 1;
    }

    return ops;
}

function toDiffLines(
    oldContent: string | null,
    newContent: string | null,
): {
    hunks: Array<{ oldStart: number; newStart: number; lines: DiffLine[] }>;
    additions: number;
    deletions: number;
} {
    const oldLines = splitLines(oldContent);
    const newLines = splitLines(newContent);
    const ops = computeLineOps(oldLines, newLines);
    const additions = ops.filter((line) => line.type === "addition").length;
    const deletions = ops.filter((line) => line.type === "deletion").length;

    const changedIndexes: number[] = [];
    for (let index = 0; index < ops.length; index += 1) {
        if (ops[index].type !== "context") {
            changedIndexes.push(index);
        }
    }

    if (changedIndexes.length === 0) {
        return { hunks: [], additions, deletions };
    }

    const ranges: Array<{ start: number; end: number }> = [];
    for (const changedIndex of changedIndexes) {
        const start = Math.max(0, changedIndex - HUNK_CONTEXT_LINES);
        const end = Math.min(ops.length - 1, changedIndex + HUNK_CONTEXT_LINES);
        const last = ranges[ranges.length - 1];

        if (!last || start > last.end + 1) {
            ranges.push({ start, end });
        } else {
            last.end = Math.max(last.end, end);
        }
    }

    const hunks = ranges.map(({ start, end }) => {
        let oldStart = 1;
        let newStart = 1;

        for (let i = 0; i < start; i += 1) {
            if (ops[i].type !== "addition") {
                oldStart += 1;
            }
            if (ops[i].type !== "deletion") {
                newStart += 1;
            }
        }

        let oldLineNumber = oldStart;
        let newLineNumber = newStart;
        const lines: DiffLine[] = [];
        let oldLength = 0;
        let newLength = 0;

        for (let i = start; i <= end; i += 1) {
            const op = ops[i];
            if (op.type !== "addition") {
                oldLength += 1;
            }
            if (op.type !== "deletion") {
                newLength += 1;
            }

            if (op.type === "context") {
                lines.push({
                    type: "context",
                    content: ` ${op.content}`,
                    oldLineNumber,
                    newLineNumber,
                });
                oldLineNumber += 1;
                newLineNumber += 1;
                continue;
            }

            if (op.type === "deletion") {
                lines.push({
                    type: "deletion",
                    content: `-${op.content}`,
                    oldLineNumber,
                });
                oldLineNumber += 1;
                continue;
            }

            lines.push({
                type: "addition",
                content: `+${op.content}`,
                newLineNumber,
            });
            newLineNumber += 1;
        }

        return { oldStart, newStart, lines };
    });

    return { hunks, additions, deletions };
}

export function aggregateDiffSnapshots(
    diffs: DiffRecord[],
): AggregatedFileSnapshot[] {
    const byFile = new Map<string, AggregatedFileSnapshot>();
    const sortedDiffs = [...diffs].sort((a, b) => a.createdAt - b.createdAt);

    for (const diff of sortedDiffs) {
        for (const file of diff.files) {
            const existing = byFile.get(file.filePath);
            if (!existing) {
                byFile.set(file.filePath, {
                    filePath: file.filePath,
                    oldContent: file.oldContent ?? null,
                    newContent: file.newContent ?? null,
                });
                continue;
            }

            byFile.set(file.filePath, {
                filePath: file.filePath,
                oldContent: existing.oldContent,
                newContent: file.newContent ?? null,
            });
        }
    }

    return Array.from(byFile.values()).sort((a, b) =>
        a.filePath.localeCompare(b.filePath),
    );
}

export function buildThreadDiffStats(diffs: DiffRecord[]): DiffStats {
    const snapshots = aggregateDiffSnapshots(diffs);
    const fileChanges: FileChange[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const snapshot of snapshots) {
        if ((snapshot.oldContent ?? "") === (snapshot.newContent ?? "")) {
            continue;
        }

        const hunk = toDiffLines(snapshot.oldContent, snapshot.newContent);
        totalAdditions += hunk.additions;
        totalDeletions += hunk.deletions;

        fileChanges.push({
            filePath: snapshot.filePath,
            additions: hunk.additions,
            deletions: hunk.deletions,
            hunks: hunk.hunks.map((entry) => ({
                filePath: snapshot.filePath,
                oldStart: entry.oldStart,
                newStart: entry.newStart,
                lines: entry.lines,
            })),
        });
    }

    return {
        fileChanges,
        totalAdditions,
        totalDeletions,
        unstagedCount: fileChanges.length,
        stagedCount: 0,
    };
}
