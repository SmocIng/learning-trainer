# Phase 1: Foundation - 詳細TODO

**期間**: 1.5週間 (7.5人日)
**目標**: プロジェクトの基盤を構築し、認証・DB・API基盤を整備

---

## 最新確認 (2025-11-24)
- `pnpm format:check` : 成功
- `pnpm lint` : 成功 (eslint.config.mjs で flat config 化・Next.js/TypeScript/Prettier 連携済み)
- `pnpm dev --hostname 127.0.0.1 --port 3000` : 起動確認 (Next.js 16.0.3 Turbopack、Ready 表示を確認)
- `pnpm build` : 成功 (Next.js 16.0.3、`--webpack` フラグでビルド)
- `pnpm test:unit` / `pnpm test:integration` : 成功 (Vitest, jsdom)
- `pnpm test:e2e --project=chromium` : 成功 (Playwright)

---

## 1.1 プロジェクト初期化 (P0) - 2人日

### Task 1.1.1: Next.js 15プロジェクトセットアップ

**担当**: Team E (Infrastructure)
**優先度**: P0
**依存**: なし
**所要時間**: 0.5人日

**実装ステップ**:

```bash
# 1. プロジェクト初期化
pnpm create next-app@latest . --typescript --tailwind --app --src-dir

# 2. 依存パッケージインストール
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next
pnpm add @tanstack/react-query
pnpm add zod
pnpm add -D @types/node

# 3. ディレクトリ構造作成
mkdir -p src/lib/{api,agents,db,services}
mkdir -p src/components/{ui,features,layouts}
mkdir -p src/types/{entities,api}
mkdir -p tests/{unit,integration,e2e}
```

**テスト要件** (TDD):

- [ ] `tests/integration/next-app.test.ts` - Next.jsアプリが正常起動するか
- [ ] ルートパス `/` にアクセスして200レスポンス確認
- [ ] TypeScript strict mode が有効か確認

**完了条件**:

- [x] Next.js 15プロジェクトが起動する
- [x] ディレクトリ構造が整っている
- [x] package.jsonに必要な依存関係が記載されている
- [x] pnpm dev で開発サーバーが起動する

---

### Task 1.1.2: ESLint/Prettier設定

**担当**: Team E
**優先度**: P0
**依存**: 1.1.1
**所要時間**: 0.3人日

**実装ステップ**:

```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
pnpm add -D @testing-library/jest-dom @testing-library/react
```

**設定ファイル作成**:

- [x] `.eslintrc.json` - TypeScript strict rules
- [x] `.prettierrc` - Code formatting
- [x] `.vscode/settings.json` - VS Code統合

**テスト要件**:

- [x] `pnpm lint` がエラーなく実行される (eslint.config.mjs で成功)
- [x] `pnpm format` で全ファイルがフォーマットされる

**完了条件**:

- [x] ESLint設定完了
- [x] Prettier設定完了
- [x] VS Code統合確認
- [x] lint/formatコマンドが動作

---

### Task 1.1.3: Vitest設定

**担当**: Team E
**優先度**: P0
**依存**: 1.1.1
**所要時間**: 0.5人日

**実装ステップ**:

```bash
pnpm add -D vitest @vitest/ui
pnpm add -D @testing-library/react @testing-library/user-event
pnpm add -D @testing-library/jest-dom jsdom
pnpm add -D c8 # カバレッジ
```

**設定ファイル**:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**package.json スクリプト追加**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage"
  }
}
```

**テスト要件**:

- [x] `tests/setup.ts` - テストセットアップファイル作成
- [x] サンプルテスト作成して動作確認

**完了条件**:

- [x] Vitest設定完了
- [x] テストが実行できる
- [x] カバレッジレポートが生成される
- [x] CI対応のスクリプトが動作

---

### Task 1.1.4: Playwright E2Eテスト設定

**担当**: Team E
**優先度**: P1
**依存**: 1.1.1
**所要時間**: 0.5人日

**実装ステップ**:

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

**設定ファイル**:

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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**テスト要件**:

- [x] `tests/e2e/basic.test.ts` - トップページアクセステスト

**完了条件**:

- [x] Playwright設定完了
- [x] E2Eテストが実行できる
- [x] CI統合準備完了

---

### Task 1.1.5: GitHub Actions CI設定

**担当**: Team E
**優先度**: P0
**依存**: 1.1.2, 1.1.3
**所要時間**: 0.7人日

**実装ステップ**:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: learning_trainer_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Unit tests
        run: pnpm test:unit

      - name: Integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/learning_trainer_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

**完了条件**:

- [x] GitHub Actions設定完了
- [x] PRでCIが自動実行される
- [x] テスト失敗時にPRがブロックされる

---

## 1.2 データベース設計 (P0) - 2.5人日

### Task 1.2.1: Prismaセットアップ

**担当**: Team D (Database)
**優先度**: P0
**依存**: 1.1.1
**所要時間**: 0.5人日

**実装ステップ**:

```bash
pnpm add @prisma/client
pnpm add -D prisma

# 初期化
pnpm prisma init

# PostgreSQL接続設定
echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/learning_trainer\"" > .env
```

**テスト要件**:

- [ ] PostgreSQLコンテナが起動するか確認
- [ ] Prisma接続テスト

**完了条件**:

- [ ] Prismaがインストールされている
- [ ] prisma/schema.prisma が存在する
- [ ] .env に DATABASE_URL が設定されている

---

### Task 1.2.2: Prismaスキーマ設計

**担当**: Team D
**優先度**: P0
**依存**: 1.2.1
**所要時間**: 1.5人日

**実装ステップ**:

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

// ユーザー
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  preferences   UserPreferences?
  sessions      LearningSession[]
  progress      LearningProgress[]

  @@map("users")
}

// ユーザー設定
model UserPreferences {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 学習モード
  learningMode      String   @default("standard") // quick, standard, intensive, custom

  // カスタム設定 (JSONB)
  customSettings    Json?

  // スケジューリング
  schedulingEnabled Boolean  @default(false)
  schedulingConfig  Json?

  // フィードバック設定
  feedbackSettings  Json?

  // ゲーミフィケーション
  gamificationSettings Json?

  // アクセシビリティ
  accessibilitySettings Json?

  // データ・プライバシー
  dataPrivacy       Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("user_preferences")
}

// コンテンツ
model Content {
  id              String   @id @default(cuid())
  title           String
  description     String?
  filePath        String
  fileType        String // pdf, md, txt, etc.

  // 解析結果
  analyzedAt      DateTime?
  topics          String[]
  difficulty      Int? // 1-10

  // ベクトル埋め込み
  embedding       Unsupported("vector(1536)")?

  sessions        LearningSession[]
  questions       Question[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("contents")
}

// 学習セッション
model LearningSession {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  contentId       String
  content         Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)

  mode            String // quick, standard, intensive, custom
  status          String @default("active") // active, completed, paused

  startedAt       DateTime @default(now())
  completedAt     DateTime?

  // 進捗
  totalQuestions  Int @default(0)
  answeredQuestions Int @default(0)
  correctAnswers  Int @default(0)

  interactions    Interaction[]

  @@map("learning_sessions")
}

// 問題
model Question {
  id              String   @id @default(cuid())
  contentId       String
  content         Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)

  type            String // multiple-choice, free-text, fill-blank, etc.
  questionText    String

  // 選択肢 (multiple-choice, multiple-select用)
  options         Json?

  // 正解
  correctAnswer   Json

  // 解説
  explanation     String?

  // 難易度
  difficulty      Int @default(5) // 1-10

  interactions    Interaction[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("questions")
}

// ユーザーと問題のインタラクション
model Interaction {
  id              String   @id @default(cuid())
  sessionId       String
  session         LearningSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  questionId      String
  question        Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  userAnswer      Json
  isCorrect       Boolean
  timeSpent       Int // 秒

  // フィードバック
  feedback        String?
  hints           String[]

  // スペースドリピティション
  nextReviewAt    DateTime?
  repetitionCount Int @default(0)
  easeFactor      Float @default(2.5)
  interval        Int @default(0) // 日数

  createdAt       DateTime @default(now())

  @@map("interactions")
}

// 学習進捗
model LearningProgress {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 統計
  totalSessions   Int @default(0)
  totalQuestions  Int @default(0)
  correctAnswers  Int @default(0)
  totalTimeSpent  Int @default(0) // 秒

  // レベル
  level           Int @default(1)
  experiencePoints Int @default(0)

  // ストリーク
  currentStreak   Int @default(0)
  longestStreak   Int @default(0)
  lastStudyDate   DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId])
  @@map("learning_progress")
}
```

**テスト要件** (TDD):

```typescript
// tests/unit/db/schema.test.ts
describe('Prisma Schema', () => {
  it('should create user with preferences', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        preferences: {
          create: {
            learningMode: 'standard',
          },
        },
      },
      include: { preferences: true },
    });

    expect(user.preferences).toBeDefined();
    expect(user.preferences?.learningMode).toBe('standard');
  });
});
```

**完了条件**:

- [ ] スキーマ定義完了
- [ ] リレーション設定完了
- [ ] インデックス最適化完了
- [ ] テストが全てパス

---

### Task 1.2.3: マイグレーション実行

**担当**: Team D
**優先度**: P0
**依存**: 1.2.2
**所要時間**: 0.3人日

**実装ステップ**:

```bash
# pgvector拡張インストール
CREATE EXTENSION IF NOT EXISTS vector;

# マイグレーション生成
pnpm prisma migrate dev --name init

# Prisma Client生成
pnpm prisma generate
```

**完了条件**:

- [ ] マイグレーション成功
- [ ] Prisma Client生成完了
- [ ] Prisma Studio で確認可能

---

### Task 1.2.4: シードデータ作成

**担当**: Team D
**優先度**: P2
**依存**: 1.2.3
**所要時間**: 0.2人日

**実装ステップ**:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // テストユーザー作成
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: await bcrypt.hash('password', 10),
      preferences: {
        create: {
          learningMode: 'standard',
          schedulingEnabled: false,
        },
      },
    },
  });

  console.log('✅ Seed data created:', testUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**完了条件**:

- [ ] シードスクリプト作成
- [ ] `pnpm prisma db seed` で実行可能
- [ ] テストデータが投入される

---

## 1.3 認証システム (P0) - 2人日

### Task 1.3.1: NextAuth.js設定

**担当**: Team B (Backend)
**優先度**: P0
**依存**: 1.2.3
**所要時間**: 1人日

**実装ステップ**:

```bash
pnpm add next-auth@beta @auth/prisma-adapter
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

```typescript
// src/lib/auth/config.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
});
```

```typescript
// src/app/api/auth/[...nextauth]/route.ts
export { handlers as GET, handlers as POST } from '@/lib/auth/config';
```

**テスト要件** (TDD):

```typescript
// tests/integration/auth.test.ts
describe('Authentication', () => {
  it('should authenticate user with valid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'password',
      redirect: false,
    });

    expect(result.error).toBeNull();
  });

  it('should reject invalid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'wrong',
      redirect: false,
    });

    expect(result.error).toBe('CredentialsSignin');
  });
});
```

**完了条件**:

- [ ] NextAuth.js設定完了
- [ ] ログイン/ログアウト動作確認
- [ ] セッション管理動作確認
- [ ] テストが全てパス

---

### Task 1.3.2: 認証ミドルウェア

**担当**: Team B
**優先度**: P0
**依存**: 1.3.1
**所要時間**: 0.5人日

**実装ステップ**:

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isApiRoute) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**テスト要件**:

```typescript
// tests/integration/middleware.test.ts
describe('Auth Middleware', () => {
  it('should redirect unauthenticated users to signin', async () => {
    const response = await fetch('http://localhost:3000/dashboard');
    expect(response.redirected).toBe(true);
    expect(response.url).toContain('/auth/signin');
  });

  it('should allow authenticated users to access protected pages', async () => {
    // テスト実装
  });
});
```

**完了条件**:

- [ ] ミドルウェア実装完了
- [ ] 未認証ユーザーのリダイレクト確認
- [ ] テストが全てパス

---

### Task 1.3.3: ユーザー登録API

**担当**: Team B
**優先度**: P0
**依存**: 1.3.1
**所要時間**: 0.5人日

**実装ステップ**:

```typescript
// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = signupSchema.parse(body);

    // ユーザーの存在チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        preferences: {
          create: {
            learningMode: 'standard',
            schedulingEnabled: false,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**テスト要件** (TDD):

```typescript
// tests/integration/auth-signup.test.ts
describe('POST /api/auth/signup', () => {
  it('should create new user', async () => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.email).toBe('newuser@example.com');
  });

  it('should reject duplicate email', async () => {
    // テスト実装
  });

  it('should reject invalid password', async () => {
    // テスト実装
  });
});
```

**完了条件**:

- [ ] サインアップAPI実装完了
- [ ] バリデーション動作確認
- [ ] テストが全てパス

---

## 1.4 tRPC基盤 (P0) - 1人日

### Task 1.4.1: tRPCセットアップ

**担当**: Team B
**優先度**: P0
**依存**: 1.1.1
**所要時間**: 0.5人日

**実装ステップ**:

```typescript
// src/lib/api/trpc/init.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/lib/auth/config';
import superjson from 'superjson';

export const createTRPCContext = async () => {
  const session = await auth();

  return {
    session,
    userId: session?.user?.id,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: ctx.session,
      userId: ctx.userId,
    },
  });
});
```

```typescript
// src/lib/api/trpc/routers/_app.ts
import { router } from '../init';
import { userRouter } from './user';

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/api/trpc/routers/_app';
import { createTRPCContext } from '@/lib/api/trpc/init';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

**完了条件**:

- [ ] tRPCセットアップ完了
- [ ] protectedProcedure動作確認
- [ ] クライアント接続確認

---

### Task 1.4.2: tRPCクライアント設定

**担当**: Team B
**優先度**: P0
**依存**: 1.4.1
**所要時間**: 0.5人日

**実装ステップ**:

```typescript
// src/lib/api/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// src/components/providers/trpc-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/api/trpc/client';
import superjson from 'superjson';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

```typescript
// src/app/layout.tsx
import { TRPCProvider } from '@/components/providers/trpc-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

**テスト要件**:

```typescript
// tests/integration/trpc-client.test.ts
describe('tRPC Client', () => {
  it('should call server procedure', async () => {
    const { result } = renderHook(() => trpc.user.getProfile.useQuery(), {
      wrapper: TRPCProvider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

**完了条件**:

- [ ] クライアント設定完了
- [ ] React Queryラッパー動作確認
- [ ] テストが全てパス

---

## Phase 1 完了チェックリスト

### 必須項目 (P0)

- [x] Next.js 15プロジェクト起動
- [x] ESLint/Prettier設定
- [x] Vitest動作確認
- [x] GitHub Actions CI動作
- [ ] Prismaスキーマ完成
- [ ] マイグレーション実行
- [ ] NextAuth.js認証動作
- [ ] tRPC基盤動作

### 推奨項目 (P1)

- [x] Playwright E2E設定
- [ ] Codecovカバレッジ連携

### オプション項目 (P2)

- [ ] シードデータ投入
- [ ] Prisma Studio動作確認

---

## 次のステップ

✅ Phase 1完了後 → **Phase 2: Content Analysis Agent** へ

Phase 2では以下を実装:

- LangChain.js基盤
- Content Analyzerエージェント
- ファイルアップロード機能
- ベクトル埋め込み生成
