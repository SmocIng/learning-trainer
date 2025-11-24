# システムアーキテクチャ設計書

**バージョン**: 1.0
**更新日**: 2025-11-24

---

## 目次

1. [アーキテクチャ概要](#1-アーキテクチャ概要)
2. [システム構成](#2-システム構成)
3. [モジュール設計](#3-モジュール設計)
4. [データフロー](#4-データフロー)
5. [インターフェース定義](#5-インターフェース定義)
6. [分業指針](#6-分業指針)

---

## 1. アーキテクチャ概要

### 1.1 アーキテクチャパターン

本システムは以下のアーキテクチャパターンを採用：

- **レイヤードアーキテクチャ**: プレゼンテーション層、ビジネスロジック層、データアクセス層の分離
- **マイクロフロントエンド**: Next.js App Router による機能別モジュール分割
- **エージェント指向**: LangGraph によるマルチエージェント協調
- **イベント駆動**: Redis Pub/Sub によるリアルタイム通知

### 1.2 設計原則

- **SOLID原則**: 単一責任、開放閉鎖、リスコフ置換、インターフェース分離、依存性逆転
- **DRY (Don't Repeat Yourself)**: コードの重複を避ける
- **KISS (Keep It Simple, Stupid)**: シンプルさを保つ
- **YAGNI (You Aren't Gonna Need It)**: 必要になるまで実装しない

---

## 2. システム構成

### 2.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    クライアント層                          │
│  - ブラウザ (React 19 + Next.js 15)                       │
│  - モバイルアプリ (将来拡張)                               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  プレゼンテーション層                       │
│  - Next.js App Router                                   │
│  - Server Components / Client Components                │
│  - Server Actions                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    API Gateway層                         │
│  - tRPC Router                                          │
│  - 認証・認可 (NextAuth.js / Clerk)                      │
│  - バリデーション (Zod)                                  │
│  - Rate Limiting                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
┌───────▼───┐  ┌──────▼────┐  ┌─────▼────┐  ┌─────▼────┐
│ビジネス  │  │エージェント│  │ユーザー  │  │コンテンツ│
│ロジック層│  │協調層     │  │管理層    │  │処理層    │
│          │  │(LangGraph)│  │          │  │          │
└───────┬───┘  └──────┬────┘  └─────┬────┘  └─────┬────┘
        │              │              │              │
        └──────────────┼──────────────┴──────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  データアクセス層                          │
│  - Prisma ORM                                           │
│  - Repository パターン                                   │
│  - キャッシング戦略                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
┌───────▼───┐  ┌──────▼────┐  ┌─────▼────┐  ┌─────▼────┐
│PostgreSQL │  │ pgvector  │  │  Redis   │  │Cloudflare│
│           │  │(埋め込み) │  │(キャッシュ)│  │R2(Storage)│
└───────────┘  └───────────┘  └──────────┘  └──────────┘
```

### 2.2 ディレクトリ構造

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ページ
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # ダッシュボード
│   │   ├── learn/                # 学習画面
│   │   ├── progress/             # 進捗管理
│   │   └── settings/             # 設定画面
│   ├── api/                      # API Routes
│   │   ├── trpc/[trpc]/         # tRPC
│   │   └── webhook/              # Webhook
│   └── layout.tsx                # ルートレイアウト
│
├── components/                   # Reactコンポーネント
│   ├── ui/                       # shadcn/ui基本コンポーネント
│   ├── features/                 # 機能別コンポーネント
│   │   ├── learning/             # 学習関連
│   │   ├── question/             # 問題表示
│   │   ├── feedback/             # フィードバック
│   │   └── settings/             # 設定
│   └── layouts/                  # レイアウトコンポーネント
│
├── lib/                          # ライブラリ・ユーティリティ
│   ├── agents/                   # LangChainエージェント
│   │   ├── content-analyzer/    # コンテンツ解析
│   │   ├── learning-planner/    # 学習計画
│   │   ├── question-generator/  # 問題生成
│   │   ├── evaluator/           # 評価
│   │   └── memory-agent/        # 記憶定着
│   │
│   ├── db/                       # データベース関連
│   │   ├── client.ts             # Prismaクライアント
│   │   ├── repositories/         # Repository
│   │   └── seeds/                # シードデータ
│   │
│   ├── api/                      # API関連
│   │   ├── trpc/                 # tRPC設定
│   │   │   ├── routers/          # tRPCルーター
│   │   │   └── context.ts        # コンテキスト
│   │   └── rest/                 # REST API（必要に応じて）
│   │
│   ├── services/                 # ビジネスロジック
│   │   ├── auth/                 # 認証サービス
│   │   ├── learning/             # 学習サービス
│   │   ├── content/              # コンテンツサービス
│   │   └── user/                 # ユーザーサービス
│   │
│   ├── utils/                    # ユーティリティ
│   │   ├── validation/           # バリデーション
│   │   ├── formatting/           # フォーマット
│   │   └── constants/            # 定数
│   │
│   └── hooks/                    # カスタムフック
│       ├── use-learning-session.ts
│       ├── use-user-preferences.ts
│       └── use-progress.ts
│
├── types/                        # TypeScript型定義
│   ├── entities/                 # エンティティ型
│   ├── dtos/                     # DTO型
│   └── api/                      # API型
│
└── styles/                       # スタイル
    └── globals.css
```

---

## 3. モジュール設計

### 3.1 フロントエンドモジュール

#### 3.1.1 学習画面モジュール (`components/features/learning`)

**責務**:

- コンテンツ表示
- 問題表示
- 回答入力
- リアルタイムフィードバック

**主要コンポーネント**:

```typescript
// ContentViewer.tsx - コンテンツ表示
interface ContentViewerProps {
  content: Content;
  mode: 'preview' | 'learn';
}

// QuestionDisplay.tsx - 問題表示
interface QuestionDisplayProps {
  question: Question;
  onAnswer: (answer: Answer) => void;
  settings: UserPreferences;
}

// AnswerInput.tsx - 回答入力（タイプ別）
interface AnswerInputProps {
  questionType: QuestionType;
  onChange: (value: any) => void;
}

// FeedbackPanel.tsx - フィードバック表示
interface FeedbackPanelProps {
  feedback: Feedback;
  level: 'minimal' | 'standard' | 'detailed';
}
```

#### 3.1.2 設定画面モジュール (`components/features/settings`)

**責務**:

- ユーザー設定の表示・編集
- プリセット管理
- 設定の保存・ロード

**主要コンポーネント**:

```typescript
// SettingsPanel.tsx
// LearningModeSelector.tsx
// DifficultySettings.tsx
// SchedulingSettings.tsx
// PresetManager.tsx
```

### 3.2 バックエンドモジュール

#### 3.2.1 エージェントモジュール (`lib/agents`)

各エージェントは独立したモジュールとして設計：

```typescript
// BaseAgent クラス
abstract class BaseAgent {
  protected llm: ChatOpenAI;
  protected tools: Tool[];

  abstract execute(input: AgentInput): Promise<AgentOutput>;

  protected async callLLM(prompt: string): Promise<string>;
  protected logExecution(metadata: any): void;
}

// ContentAnalyzerAgent
class ContentAnalyzerAgent extends BaseAgent {
  async execute(input: { filePath: string }): Promise<{
    content: ParsedContent;
    metadata: ContentMetadata;
  }>;
}

// LearningPlannerAgent
class LearningPlannerAgent extends BaseAgent {
  async execute(input: { userId: string; contentId: string; currentProgress: Progress }): Promise<{
    nextAction: 'continue' | 'review' | 'advance';
    difficulty: number;
    questionTypes: QuestionType[];
  }>;
}

// QuestionGeneratorAgent
class QuestionGeneratorAgent extends BaseAgent {
  async execute(input: {
    content: Content;
    difficulty: number;
    questionType: QuestionType;
    count: number;
  }): Promise<{
    questions: Question[];
  }>;
}

// EvaluatorAgent
class EvaluatorAgent extends BaseAgent {
  async execute(input: { question: Question; userAnswer: Answer }): Promise<{
    isCorrect: boolean;
    score: number;
    feedback: Feedback;
  }>;
}

// MemoryAgent
class MemoryAgent extends BaseAgent {
  async execute(input: { userId: string; contentId: string }): Promise<{
    reviewSchedule: ReviewSchedule;
    flashcards: Flashcard[];
  }>;
}
```

#### 3.2.2 サービスモジュール (`lib/services`)

ビジネスロジックを担当：

```typescript
// LearningService
class LearningService {
  async startSession(userId: string, contentId: string): Promise<SessionId>;
  async submitAnswer(sessionId: string, answer: Answer): Promise<Feedback>;
  async endSession(sessionId: string): Promise<SessionSummary>;
}

// ContentService
class ContentService {
  async scanDirectory(path: string): Promise<Content[]>;
  async parseContent(fileId: string): Promise<ParsedContent>;
  async generateEmbedding(content: Content): Promise<Vector>;
}

// UserService
class UserService {
  async getPreferences(userId: string): Promise<UserPreferences>;
  async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void>;
  async getProgress(userId: string): Promise<Progress>;
}
```

#### 3.2.3 リポジトリモジュール (`lib/db/repositories`)

データアクセスを抽象化：

```typescript
// UserRepository
class UserRepository {
  async findById(id: string): Promise<User | null>;
  async create(data: CreateUserDto): Promise<User>;
  async update(id: string, data: UpdateUserDto): Promise<User>;
  async delete(id: string): Promise<void>;
}

// ContentRepository
class ContentRepository {
  async findById(id: string): Promise<Content | null>;
  async findByTags(tags: string[]): Promise<Content[]>;
  async findSimilar(embedding: Vector, limit: number): Promise<Content[]>;
  async create(data: CreateContentDto): Promise<Content>;
}

// PreferencesRepository
class PreferencesRepository {
  async findByUserId(userId: string): Promise<UserPreferences | null>;
  async upsert(data: UserPreferences): Promise<UserPreferences>;
}
```

---

## 4. データフロー

### 4.1 学習セッション開始フロー

```
User → UI → Server Action → tRPC
  ↓
UserService.startSession()
  ↓
  ├─ UserRepository.findById()
  ├─ ContentRepository.findById()
  └─ PreferencesRepository.findByUserId()
  ↓
LangGraph Orchestrator
  ↓
ContentAnalyzerAgent → LearningPlannerAgent
  ↓
QuestionGeneratorAgent
  ↓
SessionData → Redis Cache
  ↓
Response → UI
```

### 4.2 問題回答フロー

```
User Answer → UI → Server Action → tRPC
  ↓
LearningService.submitAnswer()
  ↓
EvaluatorAgent.execute()
  ↓
  ├─ LLM評価 (記述問題の場合)
  ├─ 自動採点 (選択問題の場合)
  └─ コード実行 (コーディング問題の場合)
  ↓
Feedback生成
  ↓
  ├─ UserResponseRepository.create()
  ├─ ProgressRepository.update()
  └─ Cache更新
  ↓
LearningPlannerAgent (次の問題決定)
  ↓
Response → UI (Feedback + Next Question)
```

---

## 5. インターフェース定義

### 5.1 tRPC API インターフェース

```typescript
// src/lib/api/trpc/routers/learning.ts
export const learningRouter = router({
  // セッション開始
  startSession: protectedProcedure
    .input(
      z.object({
        contentId: z.string().uuid(),
        mode: z.enum(['quick', 'standard', 'intensive', 'custom']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 実装
    }),

  // 問題取得
  getQuestion: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      // 実装
    }),

  // 回答送信
  submitAnswer: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        questionId: z.string().uuid(),
        answer: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 実装
    }),

  // セッション終了
  endSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 実装
    }),
});

// src/lib/api/trpc/routers/user.ts
export const userRouter = router({
  // 設定取得
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    // 実装
  }),

  // 設定更新
  updatePreferences: protectedProcedure
    .input(userPreferencesSchema)
    .mutation(async ({ input, ctx }) => {
      // 実装
    }),

  // 進捗取得
  getProgress: protectedProcedure
    .input(
      z.object({
        contentId: z.string().uuid().optional(),
        timeRange: z.enum(['week', 'month', 'all']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // 実装
    }),
});

// src/lib/api/trpc/routers/content.ts
export const contentRouter = router({
  // コンテンツ一覧
  list: protectedProcedure
    .input(
      z.object({
        tags: z.array(z.string()).optional(),
        difficulty: z.number().min(1).max(10).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // 実装
    }),

  // コンテンツ詳細
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      // 実装
    }),
});
```

### 5.2 エージェント間インターフェース

```typescript
// src/types/agents.ts

// エージェント入出力の基本型
interface AgentInput {
  userId: string;
  metadata?: Record<string, any>;
}

interface AgentOutput {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// LangGraph State
interface LearningSessionState {
  userId: string;
  sessionId: string;
  contentId: string;
  currentQuestionIndex: number;
  understandingScore: number; // 0-100
  questionHistory: Question[];
  responseHistory: UserResponse[];
  nextAction: 'continue' | 'review' | 'advance' | 'assess';
  difficulty: number; // 1-10
  metadata: Record<string, any>;
}
```

---

## 6. 分業指針

### 6.1 モジュール分担

本プロジェクトは以下のように分業可能：

#### **チームA: フロントエンド**

- **担当**: UI/UXコンポーネント
- **ディレクトリ**: `src/app/`, `src/components/`
- **依存関係**: tRPC型定義のみ
- **テスト**: Vitest + Testing Library

**タスク**:

1. 学習画面コンポーネント開発
2. 設定画面コンポーネント開発
3. ダッシュボードコンポーネント開発
4. レスポンシブデザイン実装

#### **チームB: バックエンドAPI**

- **担当**: tRPC API、ビジネスロジック
- **ディレクトリ**: `src/lib/api/`, `src/lib/services/`
- **依存関係**: Repository、Agent
- **テスト**: Vitest + Supertest

**タスク**:

1. tRPCルーター実装
2. ビジネスロジックサービス実装
3. バリデーションスキーマ定義
4. エラーハンドリング実装

#### **チームC: AIエージェント**

- **担当**: LangChainエージェント
- **ディレクトリ**: `src/lib/agents/`
- **依存関係**: LangChain、LLM API
- **テスト**: Vitest + LangSmith

**タスク**:

1. 各エージェントの実装
2. LangGraphフロー設計・実装
3. プロンプトエンジニアリング
4. エージェント評価・改善

#### **チームD: データアクセス**

- **担当**: データベース、Repository
- **ディレクトリ**: `src/lib/db/`, `prisma/`
- **依存関係**: Prisma
- **テスト**: Vitest + Prisma Mock

**タスク**:

1. Prismaスキーマ設計
2. Repository実装
3. マイグレーション管理
4. シードデータ作成

#### **チームE: インフラ・DevOps**

- **担当**: CI/CD、デプロイ、モニタリング
- **ディレクトリ**: `.github/`, `docker/`
- **依存関係**: 全体
- **テスト**: E2Eテスト

**タスク**:

1. GitHub Actions CI/CD設定
2. Docker化
3. Vercelデプロイ設定
4. モニタリング・ロギング設定

### 6.2 インターフェース契約

各チームは以下のインターフェース契約に従って開発：

1. **型定義ファーストアプローチ**: `src/types/` の型定義を最初に確定
2. **APIコントラクト**: tRPCスキーマを先に定義
3. **モック実装**: 依存モジュールが未完成でもモックで開発継続

### 6.3 統合ポイント

**週次統合ミーティング**: 各チームの成果物を統合
**統合テスト**: E2Eテストで全体動作確認
**ドキュメント更新**: インターフェース変更時は必ず更新

---

## 7. 非機能要件への対応

### 7.1 パフォーマンス

- **React Server Components**: サーバー側レンダリングで初期表示高速化
- **Suspense**: 並列データフェッチでウォーターフォール防止
- **React Query**: クライアントキャッシング
- **Redis**: サーバーキャッシング

### 7.2 セキュリティ

- **認証**: NextAuth.js / Clerk
- **認可**: RBAC（Role-Based Access Control）
- **入力バリデーション**: Zod
- **XSS対策**: React自動エスケープ
- **CSRF対策**: Next.js標準機能

### 7.3 スケーラビリティ

- **ステートレス設計**: セッションはRedisに保存
- **水平スケーリング**: Vercel Serverless Functions
- **データベース**: Connection Pooling (Prisma Accelerate)

---

## 8. 今後の拡張性

- **プラグインシステム**: カスタムエージェント追加可能
- **マルチテナント**: 組織単位での利用
- **API公開**: REST API / GraphQL
- **モバイルアプリ**: React Native

---

**文書管理**:

- 作成者: Development Team
- レビュー: Architecture Review Board
- 承認: Technical Lead
