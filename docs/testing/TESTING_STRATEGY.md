# テスト戦略・BDD/TDD設計書

**バージョン**: 1.0
**更新日**: 2025-11-24

---

## 目次

1. [テスト方針](#1-テスト方針)
2. [BDD/TDDアプローチ](#2-bddtddアプローチ)
3. [テストピラミッド](#3-テストピラミッド)
4. [テストツール](#4-テストツール)
5. [テストケース設計](#5-テストケース設計)
6. [実装ガイド](#6-実装ガイド)

---

## 1. テスト方針

### 1.1 テスト駆動開発（TDD）の採用

本プロジェクトでは **Test-Driven Development (TDD)** を全面的に採用します。

**TDDサイクル（Red-Green-Refactor）**:

```
1. 🔴 Red    : テストを書く（失敗するテスト）
2. 🟢 Green  : テストをパスする最小限の実装
3. 🔵 Refactor : コードをリファクタリング
```

### 1.2 振る舞い駆動開発（BDD）の採用

ビジネスロジックやユーザーストーリーには **Behavior-Driven Development (BDD)** を適用します。

**BDDフォーマット（Given-When-Then）**:

```gherkin
Feature: 学習セッション開始

  Scenario: ユーザーが新しい学習セッションを開始する
    Given ユーザーがログイン済み
    And "TypeScript基礎" コンテンツが存在する
    When ユーザーが学習セッション開始をリクエスト
    Then 新しいセッションIDが返される
    And 最初の問題が生成される
    And セッション状態がRedisに保存される
```

### 1.3 テストカバレッジ目標

- **単体テスト**: 80%以上
- **統合テスト**: 主要フロー100%
- **E2Eテスト**: クリティカルパス100%

---

## 2. BDD/TDDアプローチ

### 2.1 開発フロー

#### ステップ1: ユーザーストーリー作成

```gherkin
As a learner
I want to customize my learning mode
So that I can learn at my own pace

Acceptance Criteria:
- ユーザーは4つの学習モード（クイック/標準/集中/カスタム）から選択できる
- 選択したモードは即座に適用される
- 設定はデータベースに永続化される
```

#### ステップ2: BDDシナリオ作成

```typescript
// tests/features/user-preferences.feature
Feature: ユーザー設定管理

  Scenario: 学習モードの変更
    Given ユーザー "user123" がログイン済み
    And 現在の学習モードが "standard"
    When ユーザーが学習モードを "intensive" に変更
    Then 設定が正常に保存される
    And 次回セッションから "intensive" モードが適用される
```

#### ステップ3: テストコード作成（Red）

```typescript
// tests/unit/services/user-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '@/lib/services/user';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('updateLearningMode', () => {
    it('should update user learning mode to intensive', async () => {
      // Arrange
      const userId = 'user123';
      const newMode = 'intensive';

      // Act
      const result = await userService.updateLearningMode(userId, newMode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.learningMode).toBe('intensive');
    });

    it('should throw error for invalid mode', async () => {
      // Arrange
      const userId = 'user123';
      const invalidMode = 'invalid-mode' as any;

      // Act & Assert
      await expect(userService.updateLearningMode(userId, invalidMode)).rejects.toThrow(
        'Invalid learning mode'
      );
    });
  });
});
```

#### ステップ4: 実装（Green）

```typescript
// src/lib/services/user/user-service.ts
import { z } from 'zod';
import { UserRepository } from '@/lib/db/repositories/user';

const learningModeSchema = z.enum(['quick', 'standard', 'intensive', 'custom']);

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async updateLearningMode(userId: string, mode: string) {
    // バリデーション
    const validatedMode = learningModeSchema.parse(mode);

    // 更新
    const user = await this.userRepo.updatePreferences(userId, {
      learningMode: validatedMode,
    });

    return {
      success: true,
      data: user.preferences,
    };
  }
}
```

#### ステップ5: リファクタリング（Refactor）

```typescript
// リファクタリング後
export class UserService {
  async updateLearningMode(
    userId: string,
    mode: LearningMode
  ): Promise<ServiceResult<UserPreferences>> {
    this.validateLearningMode(mode);

    const updatedPreferences = await this.userRepo.updatePreferences(userId, {
      learningMode: mode,
    });

    await this.invalidateUserCache(userId);

    return ServiceResult.success(updatedPreferences);
  }

  private validateLearningMode(mode: string): asserts mode is LearningMode {
    learningModeSchema.parse(mode);
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheService.delete(`user:${userId}:preferences`);
  }
}
```

---

## 3. テストピラミッド

```
       ┌─────────────┐
      /  E2E Tests   \     10% - ブラウザ自動化
     /   (Playwright) \
    /_________________\
   /                   \
  / Integration Tests  \   20% - API、DB、Agent連携
 /   (Vitest + MSW)     \
/_______________________\
/                         \
/      Unit Tests          \  70% - 関数、クラス、コンポーネント
/   (Vitest + Testing Library) \
/_____________________________\
```

### 3.1 単体テスト（Unit Tests）

**対象**:

- 純粋関数
- Reactコンポーネント
- ユーティリティ
- バリデーション

**例**:

```typescript
// tests/unit/utils/difficulty-calculator.test.ts
describe('DifficultyCalculator', () => {
  describe('calculateNextDifficulty', () => {
    it('should increase difficulty when accuracy >= 80%', () => {
      const result = calculateNextDifficulty({
        currentDifficulty: 5,
        accuracyRate: 0.85,
        consecutiveCorrect: 3,
      });

      expect(result).toBe(6);
    });

    it('should not exceed max difficulty', () => {
      const result = calculateNextDifficulty({
        currentDifficulty: 10,
        accuracyRate: 0.9,
        consecutiveCorrect: 5,
        maxDifficulty: 10,
      });

      expect(result).toBe(10);
    });
  });
});
```

### 3.2 統合テスト（Integration Tests）

**対象**:

- APIエンドポイント
- データベース操作
- エージェント協調
- 外部サービス連携

**例**:

```typescript
// tests/integration/api/learning-session.test.ts
import { createCaller } from '@/lib/api/trpc/test-utils';
import { prisma } from '@/lib/db/client';

describe('Learning Session API', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(async () => {
    caller = createCaller({ userId: 'test-user' });
    await prisma.user.create({ data: testUserData });
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should start a new learning session', async () => {
    // Arrange
    const contentId = 'content-123';

    // Act
    const result = await caller.learning.startSession({
      contentId,
      mode: 'standard',
    });

    // Assert
    expect(result.sessionId).toBeDefined();
    expect(result.firstQuestion).toBeDefined();

    // DBに保存されていることを確認
    const session = await prisma.learningSession.findUnique({
      where: { id: result.sessionId },
    });
    expect(session).not.toBeNull();
  });
});
```

### 3.3 E2Eテスト（End-to-End Tests）

**対象**:

- ユーザーフロー全体
- ブラウザ操作
- 画面遷移

**例**:

```typescript
// tests/e2e/learning-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Learning Flow', () => {
  test('complete a learning session from start to finish', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. コンテンツ選択
    await expect(page).toHaveURL('/dashboard');
    await page.click('text=TypeScript基礎');

    // 3. 学習セッション開始
    await page.click('button:has-text("学習開始")');
    await expect(page).toHaveURL(/\/learn\/.+/);

    // 4. 問題に回答
    await page.click('text=正解の選択肢');
    await page.click('button:has-text("回答")');

    // 5. フィードバック確認
    await expect(page.locator('.feedback-panel')).toBeVisible();
    await expect(page.locator('.feedback-correct')).toBeVisible();

    // 6. 次の問題へ
    await page.click('button:has-text("次へ")');
    await expect(page.locator('.question-display')).toBeVisible();
  });
});
```

---

## 4. テストツール

### 4.1 テストフレームワーク・ライブラリ

```json
{
  "devDependencies": {
    // テストフレームワーク
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",

    // React テスト
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",

    // E2E テスト
    "@playwright/test": "^1.40.0",

    // モック・スタブ
    "msw": "^2.0.0",
    "vitest-mock-extended": "^1.0.0",

    // カバレッジ
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### 4.2 テスト設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/dist/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 5. テストケース設計

### 5.1 ユーザーストーリーベースのテスト

各ユーザーストーリーに対して網羅的なテストケースを作成：

#### ストーリー: 学習モード選択

```typescript
// tests/features/learning-mode-selection.test.ts
import { describe, it } from 'vitest';

describe('Feature: Learning Mode Selection', () => {
  describe('Scenario: User selects quick mode', () => {
    it('Given user is on settings page', async () => {
      // テスト実装
    });

    it('When user selects quick mode', async () => {
      // テスト実装
    });

    it('Then quick mode settings are applied', async () => {
      // テスト実装
    });

    it('And session uses 5-10 questions', async () => {
      // テスト実装
    });

    it('And feedback is minimal', async () => {
      // テスト実装
    });
  });

  describe('Scenario: User selects custom mode', () => {
    // カスタムモードのテスト
  });
});
```

### 5.2 境界値テスト

```typescript
describe('Boundary Value Testing', () => {
  describe('Difficulty Level', () => {
    const testCases = [
      { input: 0, expected: 1, description: '最小値未満' },
      { input: 1, expected: 1, description: '最小値' },
      { input: 5, expected: 5, description: '中間値' },
      { input: 10, expected: 10, description: '最大値' },
      { input: 11, expected: 10, description: '最大値超過' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`should handle ${description}: ${input} -> ${expected}`, () => {
        const result = normalizeDifficulty(input);
        expect(result).toBe(expected);
      });
    });
  });
});
```

### 5.3 エラーケーステスト

```typescript
describe('Error Handling', () => {
  it('should throw ValidationError for invalid question type', async () => {
    await expect(generateQuestion({ type: 'invalid' })).rejects.toThrow(ValidationError);
  });

  it('should return error response when LLM API fails', async () => {
    // LLMAPIのモックを失敗させる
    mockLLM.mockRejectedValueOnce(new Error('API Error'));

    const result = await evaluateAnswer(question, answer);

    expect(result.success).toBe(false);
    expect(result.error).toContain('評価に失敗');
  });
});
```

---

## 6. 実装ガイド

### 6.1 モック・スタブ戦略

#### Prismaのモック

```typescript
// tests/mocks/prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});
```

#### LLM APIのモック

```typescript
// tests/mocks/llm.ts
import { vi } from 'vitest';

export const mockLLM = {
  call: vi.fn(),
  stream: vi.fn(),
};

export function setupLLMMock() {
  mockLLM.call.mockResolvedValue({
    content: 'モック応答',
    usage: { tokens: 100 },
  });
}
```

#### MSW（Mock Service Worker）

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/trpc/learning.startSession', () => {
    return HttpResponse.json({
      result: {
        data: {
          sessionId: 'mock-session-id',
          firstQuestion: {
            /* モックデータ */
          },
        },
      },
    });
  }),
];
```

### 6.2 テストヘルパー

```typescript
// tests/helpers/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

// カスタムレンダー関数
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// テストデータ生成
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
}
```

### 6.3 CI/CD統合

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 7. テスト実施チェックリスト

### 開発者チェックリスト

- [ ] 新機能実装前にテストを書いた
- [ ] すべてのテストがパスする
- [ ] カバレッジが基準を満たしている（80%以上）
- [ ] エッジケースをテストした
- [ ] エラーハンドリングをテストした
- [ ] リファクタリング後もテストがパスする

### コードレビューチェックリスト

- [ ] テストコードが読みやすい
- [ ] AAA（Arrange-Act-Assert）パターンに従っている
- [ ] テスト名が分かりやすい（what/when/then）
- [ ] モックが適切に使われている
- [ ] テストが独立している（他のテストに依存しない）

---

**次のステップ**: [開発ガイド](../guides/DEVELOPMENT.md) を参照して実装を開始してください。
