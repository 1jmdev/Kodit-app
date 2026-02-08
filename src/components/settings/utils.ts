import type { ModelConfig } from "@/store/types";

export function getModelKey(model: ModelConfig): string {
    return `${model.providerId}:${model.id}`;
}

function fuzzyScore(needle: string, haystack: string): number {
    if (!needle) return 0;

    let score = 0;
    let haystackIndex = 0;
    let previousMatchIndex = -1;

    for (let i = 0; i < needle.length; i += 1) {
        const char = needle[i];
        const foundIndex = haystack.indexOf(char, haystackIndex);
        if (foundIndex === -1) return Number.NEGATIVE_INFINITY;

        score += 1;
        if (previousMatchIndex !== -1 && foundIndex === previousMatchIndex + 1) {
            score += 2;
        }
        if (
            foundIndex === 0 ||
            haystack[foundIndex - 1] === " " ||
            haystack[foundIndex - 1] === "/" ||
            haystack[foundIndex - 1] === "-"
        ) {
            score += 1;
        }

        previousMatchIndex = foundIndex;
        haystackIndex = foundIndex + 1;
    }

    return score;
}

export function filterModels(models: ModelConfig[], query: string): ModelConfig[] {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    const terms = value.split(/\s+/).filter(Boolean);

    return models
        .map((model) => {
            const searchable = `${model.name} ${model.id} ${model.provider}`.toLowerCase();
            let score = 0;

            for (const term of terms) {
                const termScore = fuzzyScore(term, searchable);
                if (!Number.isFinite(termScore)) {
                    return { model, score: Number.NEGATIVE_INFINITY };
                }
                score += termScore;
                if (searchable.includes(term)) score += 3;
            }

            return { model, score };
        })
        .filter((entry) => Number.isFinite(entry.score))
        .sort((a, b) => b.score - a.score || a.model.name.localeCompare(b.model.name))
        .map((entry) => entry.model)
        .slice(0, 20);
}
