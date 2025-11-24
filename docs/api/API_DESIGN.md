# API設計書

**バージョン**: 1.0
**更新日**: 2025-11-24

---

## API仕様

### Base URL

```
開発環境: http://localhost:3000/api/trpc
本番環境: https://your-domain.com/api/trpc
```

### 認証

全てのAPIは認証が必要です（一部のpublicエンドポイントを除く）。

```typescript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

---

## tRPC API Endpoints

### 1. Learning Router (`learning.*`)

#### 1.1 `learning.startSession`

学習セッションを開始します。

**Input**:

```typescript
{
  contentId: string; // UUID
  mode: 'quick' | 'standard' | 'intensive' | 'custom';
}
```

**Output**:

```typescript
{
  sessionId: string;
  firstQuestion: Question;
  settings: SessionSettings;
}
```

**Example**:

```typescript
const result = await trpc.learning.startSession.mutate({
  contentId: '123e4567-e89b-12d3-a456-426614174000',
  mode: 'standard',
});
```

---

#### 1.2 `learning.getQuestion`

現在の問題を取得します。

**Input**:

```typescript
{
  sessionId: string;
}
```

**Output**:

```typescript
{
  question: Question;
  progress: {
    current: number;
    total: number;
  }
}
```

---

#### 1.3 `learning.submitAnswer`

回答を送信し、評価を受けます。

**Input**:

```typescript
{
  sessionId: string;
  questionId: string;
  answer: any; // 問題タイプによって異なる
}
```

**Output**:

```typescript
{
  isCorrect: boolean;
  score: number;
  feedback: Feedback;
  nextQuestion?: Question;
}
```

---

### 2. User Router (`user.*`)

#### 2.1 `user.getPreferences`

ユーザー設定を取得します。

**Output**:

```typescript
UserPreferences;
```

---

#### 2.2 `user.updatePreferences`

ユーザー設定を更新します。

**Input**:

```typescript
Partial<UserPreferences>;
```

**Output**:

```typescript
UserPreferences;
```

---

### 3. Content Router (`content.*`)

#### 3.1 `content.list`

コンテンツ一覧を取得します。

**Input**:

```typescript
{
  tags?: string[];
  difficulty?: number; // 1-10
  page?: number;
  limit?: number;
}
```

**Output**:

```typescript
{
  items: Content[];
  total: number;
  page: number;
  limit: number;
}
```

---

## データモデル

### Question

```typescript
interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[]; // 選択問題の場合
  correctAnswer: string;
  difficulty: number; // 1-10
  hints?: string[];
  metadata: Record<string, any>;
}

type QuestionType =
  | 'multiple-choice'
  | 'multiple-select'
  | 'free-text'
  | 'fill-in-blank'
  | 'coding'
  | 'matching';
```

### Feedback

```typescript
interface Feedback {
  level: 'minimal' | 'standard' | 'detailed';
  message: string;
  explanation?: string;
  relatedTopics?: string[];
  nextSteps?: string[];
}
```

### UserPreferences

```typescript
interface UserPreferences {
  learningMode: 'quick' | 'standard' | 'intensive' | 'custom';
  customSettings?: CustomModeSettings;
  scheduling: SchedulingSettings;
  feedback: FeedbackSettings;
  gamification: GamificationSettings;
  accessibility: AccessibilitySettings;
}
```

---

## エラーハンドリング

### エラーコード

```typescript
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  LLM_ERROR = 'LLM_ERROR',
}
```

### エラーレスポンス

```typescript
{
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  }
}
```

---

## Rate Limiting

- **認証済みユーザー**: 100 requests/分
- **未認証**: 10 requests/分

---

**詳細仕様**: 各エンドポイントの詳細は [tRPC Router実装](../../src/lib/api/trpc/routers/) を参照してください。
