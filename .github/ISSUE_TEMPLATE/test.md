---
name: Test Implementation
about: テスト実装タスク
title: '[TEST] '
labels: ['test']
assignees: ''
---

## 🧪 テスト情報

**Phase**: Phase X.X
**テスト種別**: Unit / Integration / E2E
**担当チーム**: Team A / Team B / Team C / Team D / Team E
**所要時間**: X人日

## 📝 概要

<!-- テスト対象の機能・モジュールの説明 -->

## 🎯 テスト目的

<!-- このテストで何を検証するか -->

## 📦 テスト対象

**ファイル**: `src/...`
**モジュール/関数**: `...`

## 🧪 テストケース

### 正常系

- [ ] ケース1: ...
- [ ] ケース2: ...

### 異常系

- [ ] ケース1: エラーハンドリング
- [ ] ケース2: バリデーション失敗

### 境界値

- [ ] ケース1: 最小値
- [ ] ケース2: 最大値

## 💻 実装例

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should return expected value when given valid input', () => {
      // Arrange
      const input = ...;

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should throw error when given invalid input', () => {
      // Arrange
      const input = ...;

      // Act & Assert
      expect(() => functionName(input)).toThrow('Error message');
    });
  });
});
```

## 📊 カバレッジ目標

- **行カバレッジ**: 80%以上
- **分岐カバレッジ**: 75%以上
- **関数カバレッジ**: 100%

## 📚 依存関係

**前提タスク**:

- #issue_number - 実装タスク

## ✅ 完了条件

- [ ] テストコード実装完了
- [ ] 全テストケースパス
- [ ] カバレッジ目標達成
- [ ] コードレビュー完了
- [ ] CI/CDで自動実行確認

## 📖 参考資料

- [TESTING_STRATEGY.md](../../docs/testing/TESTING_STRATEGY.md)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

## 💬 備考

<!-- その他の注意事項 -->
