import type { ModelConfig } from "../../types";

export function getModelKey(model: ModelConfig): string {
    return `${model.providerId}:${model.id}`;
}
