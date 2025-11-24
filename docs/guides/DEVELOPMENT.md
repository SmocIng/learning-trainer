# 開発ガイド

**対象**: 開発者（ClaudeCode、Codex、その他のAIコーディングアシスタント含む）

---

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/YOUR_USERNAME/learning-trainer.git
cd learning-trainer
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/learning_trainer"

# OpenAI
OPENAI_API_KEY="sk-..."

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Redis (オプション)
REDIS_URL="redis://localhost:6379"
```

### 4. データベースのセットアップ

```bash
# Prisma migration
pnpm prisma migrate dev

# シードデータ投入
pnpm prisma db seed
```

### 5. 開発サーバー起動

```bash
pnpm dev
```

---

## 開発フロー（TDD）

### ステップ1: Issueを確認

GitHub Issueから作業するタスクを選択します。

### ステップ2: ブランチ作成

```bash
git checkout -b feature/issue-123-learning-mode-selection
```

命名規則:

- `feature/` - 新機能
- `fix/` - バグ修正
- `docs/` - ドキュメント
- `test/` - テスト追加
- `refactor/` - リファクタリング

### ステップ3: テストを先に書く（Red）

```bash
# テストファイル作成
touch tests/unit/services/user-service.test.ts
```

```typescript
// tests/unit/services/user-service.test.ts
import { describe, it, expect } from 'vitest';
import { UserService } from '@/lib/services/user';

describe('UserService', () => {
  it('should update learning mode', async () => {
    // テスト実装
    const service = new UserService();
    const result = await service.updateLearningMode('user123', 'intensive');

    expect(result.success).toBe(true);
  });
});
```

テスト実行（失敗することを確認）:

```bash
pnpm test:unit
```

### ステップ4: 最小限の実装（Green）

```typescript
// src/lib/services/user/user-service.ts
export class UserService {
  async updateLearningMode(userId: string, mode: string) {
    // 実装
    return { success: true };
  }
}
```

テスト実行（成功することを確認）:

```bash
pnpm test:unit
```

### ステップ5: リファクタリング（Refactor）

コードを改善し、テストが引き続きパスすることを確認します。

### ステップ6: コミット

```bash
git add .
git commit -m "feat: add learning mode selection

- Implement UserService.updateLearningMode
- Add validation for learning modes
- Update UserPreferences schema

Closes #123"
```

### ステップ7: Push & Pull Request

```bash
git push origin feature/issue-123-learning-mode-selection
```

GitHub上でPull Requestを作成します。

---

## コーディング規約

### TypeScript

- **型定義**: すべての関数に型を明示
- **strictモード**: 有効にする
- **any禁止**: 原則として `any` は使用しない

```typescript
// ✅ Good
function calculateScore(answers: Answer[]): number {
  return answers.reduce((sum, a) => sum + a.score, 0);
}

// ❌ Bad
function calculateScore(answers: any): any {
  return answers.reduce((sum: any, a: any) => sum + a.score, 0);
}
```

### React

- **関数コンポーネント**: クラスコンポーネントは使用しない
- **Hooks**: useEffect等は適切に使用
- **Props**: interfaceで定義

```typescript
// ✅ Good
interface QuestionDisplayProps {
  question: Question;
  onAnswer: (answer: Answer) => void;
}

export function QuestionDisplay({ question, onAnswer }: QuestionDisplayProps) {
  // 実装
}
```

### ファイル命名

- **コンポーネント**: PascalCase (`QuestionDisplay.tsx`)
- **ユーティリティ**: kebab-case (`difficulty-calculator.ts`)
- **テスト**: 元ファイル名 + `.test.ts` (`user-service.test.ts`)

---

## テストコマンド

```bash
# 単体テスト
pnpm test:unit

# 単体テスト（watch mode）
pnpm test:unit --watch

# 統合テスト
pnpm test:integration

# E2Eテスト
pnpm test:e2e

# 全テスト
pnpm test

# カバレッジ
pnpm test:coverage

# 特定のファイルのみ
pnpm test user-service
```

---

## デバッグ

### VS Code デバッグ設定

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### ログ出力

```typescript
// 開発環境のみ
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// プロダクション対応ログ
import { logger } from '@/lib/utils/logger';
logger.info('Session started', { sessionId });
```

---

## トラブルシューティング

### Prisma関連

```bash
# スキーマ変更後
pnpm prisma generate
pnpm prisma migrate dev

# DBリセット
pnpm prisma migrate reset

# Prisma Studio起動
pnpm prisma studio
```

### キャッシュクリア

```bash
# Next.jsキャッシュ
rm -rf .next

# node_modules再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## よくある質問

### Q: tRPCのエラー「Procedure not found」が出る

A: tRPCルーターの登録を確認してください。

```typescript
// src/lib/api/trpc/root.ts
export const appRouter = router({
  learning: learningRouter, // ここに追加されているか確認
  user: userRouter,
  content: contentRouter,
});
```

### Q: Prismaで型エラーが出る

A: `pnpm prisma generate` を実行してください。

### Q: テストがパスしない

A: モックが正しく設定されているか確認してください。

```typescript
// tests/setup.ts で全体的なモック設定
vi.mock('@/lib/db/client', () => ({
  prisma: prismaMock,
}));
```

---

## 便利なコマンド

```bash
# コードフォーマット
pnpm format

# リント
pnpm lint

# 型チェック
pnpm type-check

# ビルド
pnpm build

# 本番起動
pnpm start
```

---

## リソース

- [Next.js Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [LangChain.js Docs](https://js.langchain.com/)
- [Vitest Docs](https://vitest.dev/)

---

**Happy Coding! 🚀**
