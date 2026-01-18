/**
 * Shared Artifact Store Instance
 * 全てのAPIエンドポイントで共有されるグローバルストアインスタンス
 */

import { InMemoryArtifactStore } from "@liqueur/artifact-store/src/stores/InMemoryArtifactStore";

/**
 * グローバルArtifactストアインスタンス
 * （本番環境ではDatabase Storeを使用）
 */
export const artifactStore = new InMemoryArtifactStore();
