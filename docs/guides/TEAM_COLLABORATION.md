# チーム分業ガイド

**対象**: ClaudeCode、Codex、その他のAIコーディングアシスタント、および人間開発者

---

## プロジェクト概要

Learning Trainer は、LangGraph ベースのマルチエージェント学習システムです。
本プロジェクトはBDD/TDDアプローチを採用し、チーム分業で効率的に開発します。

**リポジトリ**: https://github.com/SmocIng/learning-trainer

---

## チーム構成と担当モジュール

### 🎨 Team A: フロントエンド
**担当**: UI/UXコンポーネントの開発

**ディレクトリ**:
- `src/app/` - Next.js App Router
- `src/components/` - Reactコンポーネント

**主なタスク**:
1. 学習画面コンポーネント (`components/features/learning/`)
   - QuestionDisplay
   - AnswerInput
   - FeedbackPanel
   - ContentViewer

2. 設定画面コンポーネント (`components/features/settings/`)
   - LearningModeSelector
   - DifficultySettings
   - SchedulingSettings
   - PresetManager

3. ダッシュボード (`components/features/dashboard/`)
   - ProgressChart
   - StatsDisplay
   - LearningHistory

**依存関係**:
- tRPC型定義のみ（`src/types/api/`）
- バックエンドはモックで開発可能

**テストツール**:
- Vitest
- @testing-library/react
- @testing-library/user-event

**開始方法**:
```bash
# Issue取得
gh issue list --label "frontend"

# ブランチ作成
git checkout -b feature/frontend-learning-ui

# テスト実行
pnpm test:unit -- components
```

---

### ⚙️ Team B: バックエンドAPI
**担当**: tRPC API、ビジネスロジック

**ディレクトリ**:
- `src/lib/api/trpc/` - tRPCルーター
- `src/lib/services/` - ビジネスロジック

**主なタスク**:
1. tRPCルーター実装
   - `routers/learning.ts` - 学習セッション管理
   - `routers/user.ts` - ユーザー設定管理
   - `routers/content.ts` - コンテンツ管理

2. ビジネスロジックサービス
   - `services/learning/` - 学習サービス
   - `services/user/` - ユーザーサービス
   - `services/content/` - コンテンツサービス

3. バリデーション
   - Zodスキーマ定義
   - エラーハンドリング

**依存関係**:
- Repository（モック可能）
- Agent（モック可能）

**テストツール**:
- Vitest
- Supertest（API統合テスト）

**開始方法**:
```bash
gh issue list --label "backend"
git checkout -b feature/backend-trpc-learning
pnpm test:integration -- api
```

---

### 🤖 Team C: AIエージェント
**担当**: LangChainエージェント、LangGraphフロー

**ディレクトリ**:
- `src/lib/agents/` - 各種エージェント

**主なタスク**:
1. エージェント実装
   - `agents/content-analyzer/` - コンテンツ解析
   - `agents/learning-planner/` - 学習計画
   - `agents/question-generator/` - 問題生成
   - `agents/evaluator/` - 評価
   - `agents/memory-agent/` - 記憶定着

2. LangGraphフロー設計
   - StateGraph定義
   - エージェント間ルーティング
   - 条件分岐ロジック

3. プロンプトエンジニアリング
   - 各エージェントのプロンプト最適化
   - Few-shot examples作成

**依存関係**:
- LangChain.js 0.3.x
- OpenAI/Anthropic API
- LangSmith（Observability）

**テストツール**:
- Vitest
- LangSmith（評価）

**開始方法**:
```bash
gh issue list --label "ai-agent"
git checkout -b feature/agent-content-analyzer
pnpm test:unit -- agents
```

---

### 💾 Team D: データアクセス
**担当**: データベース、Repository

**ディレクトリ**:
- `prisma/` - Prismaスキーマ
- `src/lib/db/` - データベース関連

**主なタスク**:
1. Prismaスキーマ設計
   - エンティティ定義
   - リレーション設定
   - インデックス最適化

2. Repository実装
   - `repositories/user.ts`
   - `repositories/content.ts`
   - `repositories/learning-session.ts`
   - `repositories/preferences.ts`

3. マイグレーション管理
   - スキーマ変更のマイグレーション
   - シードデータ作成

**依存関係**:
- PostgreSQL
- Prisma

**テストツール**:
- Vitest
- Prisma Mock

**開始方法**:
```bash
gh issue list --label "database"
git checkout -b feature/db-prisma-schema
pnpm prisma studio
```

---

### 🚀 Team E: インフラ・DevOps
**担当**: CI/CD、デプロイ、モニタリング

**ディレクトリ**:
- `.github/workflows/` - GitHub Actions
- `docker/` - Docker設定（オプション）

**主なタスク**:
1. CI/CD設定
   - テスト自動化（GitHub Actions）
   - デプロイ自動化（Vercel）
   - コードカバレッジ（Codecov）

2. モニタリング・ロギング
   - LangSmith統合
   - Sentry設定
   - Vercel Analytics

3. E2Eテスト
   - Playwright設定
   - クリティカルパステスト

**依存関係**:
- 全モジュール

**テストツール**:
- Playwright
- GitHub Actions

**開始方法**:
```bash
gh issue list --label "infra"
git checkout -b feature/ci-github-actions
pnpm test:e2e
```

---

## 開発ワークフロー

### 1. Issue割り当て

各チームは自分のラベルのIssueを選択：

```bash
# 例: フロントエンドチーム
gh issue list --label "frontend" --state "open"

# Issueを自分にアサイン
gh issue develop 123 --checkout
```

### 2. TDDサイクル

**すべてのチームがTDDアプローチを採用**:

```bash
# 1. テストを書く（Red）
vim tests/unit/services/user-service.test.ts
pnpm test:unit  # 失敗することを確認

# 2. 実装（Green）
vim src/lib/services/user/user-service.ts
pnpm test:unit  # 成功することを確認

# 3. リファクタリング（Refactor）
# コード改善
pnpm test:unit  # 引き続き成功することを確認
```

### 3. コミット規約

Conventional Commits:

```bash
git commit -m "feat(frontend): add learning mode selector

- Implement LearningModeSelector component
- Add tests for mode selection
- Integrate with user preferences API

Closes #123"
```

Prefix:
- `feat` - 新機能
- `fix` - バグ修正
- `test` - テスト追加
- `docs` - ドキュメント
- `refactor` - リファクタリング
- `chore` - その他

Scope:
- `frontend` - フロントエンド
- `backend` - バックエンド
- `agent` - AIエージェント
- `db` - データベース
- `infra` - インフラ

### 4. Pull Request

```bash
git push origin feature/frontend-learning-ui
gh pr create --title "feat(frontend): add learning mode selector" \
  --body "Closes #123"
```

PRテンプレート:
```markdown
## 概要
- 何を実装したか

## 変更内容
- [ ] テスト追加
- [ ] 実装完了
- [ ] ドキュメント更新

## テスト結果
- [ ] 単体テスト: ✅
- [ ] 統合テスト: ✅
- [ ] E2Eテスト: ✅

## スクリーンショット（UIの場合）

## レビュー依頼事項
```

---

## インターフェース契約

### チーム間の依存関係管理

#### 型定義ファースト

**すべての型を先に定義** (`src/types/`)

```typescript
// src/types/entities/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

// src/types/api/learning.ts
export interface StartSessionInput {
  contentId: string;
  mode: LearningMode;
}

export interface StartSessionOutput {
  sessionId: string;
  firstQuestion: Question;
}
```

#### APIコントラクト

**tRPCスキーマを先に確定** (`src/lib/api/trpc/routers/`)

```typescript
// Team Bが先に定義
export const learningRouter = router({
  startSession: protectedProcedure
    .input(startSessionInputSchema)
    .output(startSessionOutputSchema)
    .mutation(async ({ input, ctx }) => {
      // 実装（モックで開始可能）
    }),
});
```

#### モックによる並行開発

依存モジュールが未完成でもモックで開発継続：

```typescript
// tests/mocks/trpc.ts
export const mockTrpc = {
  learning: {
    startSession: vi.fn().mockResolvedValue({
      sessionId: 'mock-session',
      firstQuestion: mockQuestion,
    }),
  },
};

// フロントエンドチームはこのモックで開発
```

---

## 統合ポイント

### 週次統合ミーティング

**毎週金曜日**: 各チームの成果物を統合

1. 各チームのPR確認
2. マージ競合の解決
3. 統合テスト実行
4. 来週のタスク調整

### 統合テスト

**E2Eテストで全体動作確認**:

```bash
# 全チームのコードをマージ後
pnpm test:e2e
```

### ドキュメント更新

**インターフェース変更時は必ず更新**:

```bash
# API変更時
vim docs/api/API_DESIGN.md

# アーキテクチャ変更時
vim docs/architecture/ARCHITECTURE.md
```

---

## トラブルシューティング

### マージ競合

```bash
# mainブランチを最新化
git checkout main
git pull origin main

# featureブランチにマージ
git checkout feature/your-branch
git merge main

# 競合解決
git add .
git commit -m "chore: resolve merge conflicts"
```

### テスト失敗

```bash
# 他チームの変更で自分のテストが失敗した場合
# 1. 最新のmainをpull
git checkout main && git pull

# 2. featureブランチでrebase
git checkout feature/your-branch
git rebase main

# 3. テスト修正
pnpm test
```

---

## コミュニケーション

### GitHub Discussions

- 技術的な質問
- 設計の相談
- アイデア共有

### Issue Comments

- 実装の進捗報告
- レビュー依頼
- 質問・相談

### Pull Request Reviews

- コードレビュー
- 改善提案
- 承認・マージ

---

## 便利なコマンド集

```bash
# 自分のチームのIssue一覧
gh issue list --assignee @me

# 自分のPR一覧
gh pr list --author @me

# PRのマージ
gh pr merge 123 --squash

# ブランチの掃除
git branch --merged | grep -v "main" | xargs git branch -d

# 全テスト実行（CI相当）
pnpm test:ci
```

---

## リソース

- [Architecture Document](../architecture/ARCHITECTURE.md)
- [API Design](../api/API_DESIGN.md)
- [Testing Strategy](../testing/TESTING_STRATEGY.md)
- [Development Guide](./DEVELOPMENT.md)

---

**Happy Team Coding! 🎉**
