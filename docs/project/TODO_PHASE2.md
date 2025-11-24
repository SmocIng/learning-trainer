# Phase 2: Content Analysis Agent - 詳細TODO

**期間**: 2週間 (10人日)
**目標**: コンテンツ解析エージェントを実装し、アップロードされたファイルを解析・知識抽出

---

## 2.1 LangChain.js基盤 (P0) - 2人日

### Task 2.1.1: LangChain.js & OpenAI設定
**担当**: Team C (AI Agents)
**優先度**: P0
**依存**: Phase 1完了
**所要時間**: 0.5人日

**実装ステップ**:
```bash
pnpm add langchain @langchain/openai @langchain/anthropic @langchain/core
pnpm add @langchain/community
pnpm add zod-to-json-schema
```

```typescript
// src/lib/agents/config.ts
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';

export const llmConfig = {
  openai: {
    modelName: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096,
  },
  anthropic: {
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 4096,
  },
};

export function createLLM(provider: 'openai' | 'anthropic' = 'openai') {
  if (provider === 'anthropic') {
    return new ChatAnthropic({
      ...llmConfig.anthropic,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return new ChatOpenAI({
    ...llmConfig.openai,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
```

**テスト要件** (TDD):
```typescript
// tests/unit/agents/config.test.ts
describe('LLM Configuration', () => {
  it('should create OpenAI LLM instance', () => {
    const llm = createLLM('openai');
    expect(llm).toBeInstanceOf(ChatOpenAI);
  });

  it('should create Anthropic LLM instance', () => {
    const llm = createLLM('anthropic');
    expect(llm).toBeInstanceOf(ChatAnthropic);
  });
});
```

**完了条件**:
- [x] LangChain.jsインストール完了
- [x] LLM設定完了
- [x] APIキー動作確認
- [x] テストが全てパス

---

### Task 2.1.2: BaseAgent抽象クラス
**担当**: Team C
**優先度**: P0
**依存**: 2.1.1
**所要時間**: 0.8人日

**実装ステップ**:
```typescript
// src/lib/agents/base/base-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from 'langchain/output_parsers';

export interface AgentInput<T = any> {
  data: T;
  context?: Record<string, any>;
}

export interface AgentOutput<T = any> {
  result: T;
  metadata: {
    executionTime: number;
    tokensUsed?: number;
    model: string;
  };
}

export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected llm: ChatOpenAI;
  protected systemPrompt: string;

  constructor(llm: ChatOpenAI, systemPrompt: string) {
    this.llm = llm;
    this.systemPrompt = systemPrompt;
  }

  /**
   * エージェントのメイン実行メソッド
   */
  abstract execute(input: AgentInput<TInput>): Promise<AgentOutput<TOutput>>;

  /**
   * LLMを呼び出す共通メソッド
   */
  protected async callLLM(
    userMessage: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const startTime = Date.now();

    const messages = [
      new SystemMessage(this.systemPrompt),
      new HumanMessage(userMessage),
    ];

    const response = await this.llm.invoke(messages, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    this.logExecution({
      duration: Date.now() - startTime,
      inputLength: userMessage.length,
      outputLength: response.content.toString().length,
    });

    return response.content.toString();
  }

  /**
   * 構造化出力でLLMを呼び出す
   */
  protected async callLLMStructured<T>(
    userMessage: string,
    parser: StructuredOutputParser<T>
  ): Promise<T> {
    const formatInstructions = parser.getFormatInstructions();
    const prompt = `${userMessage}\n\n${formatInstructions}`;

    const response = await this.callLLM(prompt);
    return parser.parse(response);
  }

  /**
   * 実行ログを記録
   */
  protected logExecution(metadata: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.constructor.name}]`, metadata);
    }
    // TODO: LangSmithやHeliconeへの送信
  }

  /**
   * エラーハンドリング
   */
  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw new Error(`[${this.constructor.name}] ${error.message}`);
    }
    throw error;
  }
}
```

**テスト要件** (TDD):
```typescript
// tests/unit/agents/base-agent.test.ts
class TestAgent extends BaseAgent<string, string> {
  async execute(input: AgentInput<string>): Promise<AgentOutput<string>> {
    const result = await this.callLLM(input.data);
    return {
      result,
      metadata: {
        executionTime: 100,
        model: 'gpt-4o',
      },
    };
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;

  beforeEach(() => {
    const llm = createLLM('openai');
    agent = new TestAgent(llm, 'You are a test agent.');
  });

  it('should execute agent with input', async () => {
    const input: AgentInput<string> = {
      data: 'Test input',
    };

    const output = await agent.execute(input);

    expect(output.result).toBeDefined();
    expect(output.metadata.executionTime).toBeGreaterThan(0);
  });

  it('should call LLM and return response', async () => {
    const response = await agent['callLLM']('Hello');
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });
});
```

**完了条件**:
- [x] BaseAgentクラス実装完了
- [x] callLLMメソッド動作確認
- [x] エラーハンドリング確認
- [x] テストが全てパス

---

### Task 2.1.3: LangSmith統合
**担当**: Team C
**優先度**: P1
**依存**: 2.1.1
**所要時間**: 0.7人日

**実装ステップ**:
```bash
pnpm add langsmith
```

```typescript
// src/lib/agents/observability/langsmith.ts
import { Client } from 'langsmith';

const langsmithClient = process.env.LANGCHAIN_API_KEY
  ? new Client({
      apiKey: process.env.LANGCHAIN_API_KEY,
    })
  : null;

export interface TraceData {
  name: string;
  runType: 'llm' | 'chain' | 'tool' | 'agent';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  startTime: number;
  endTime?: number;
}

export async function traceExecution(data: TraceData): Promise<void> {
  if (!langsmithClient) return;

  try {
    // LangSmithへトレース送信
    // TODO: 実装
  } catch (error) {
    console.error('Failed to send trace to LangSmith:', error);
  }
}
```

**環境変数追加**:
```bash
# .env
LANGCHAIN_TRACING_V2="true"
LANGCHAIN_API_KEY="..."
LANGCHAIN_PROJECT="learning-trainer"
```

**完了条件**:
- [x] LangSmith設定完了
- [x] トレース送信確認
- [x] LangSmith UIでトレース確認

---

## 2.2 ファイルアップロード (P0) - 1.5人日

### Task 2.2.1: ファイルアップロードAPI
**担当**: Team B (Backend)
**優先度**: P0
**依存**: Phase 1完了
**所要時間**: 1人日

**実装ステップ**:
```bash
pnpm add @vercel/blob
pnpm add pdf-parse mammoth # PDF, DOCX解析
```

```typescript
// src/lib/api/trpc/routers/content.ts
import { router, protectedProcedure } from '../init';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/db/prisma';

const uploadContentSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  base64Data: z.string(),
});

export const contentRouter = router({
  upload: protectedProcedure
    .input(uploadContentSchema)
    .mutation(async ({ input, ctx }) => {
      const { fileName, fileType, fileSize, base64Data } = input;

      // ファイルサイズ制限 (10MB)
      if (fileSize > 10 * 1024 * 1024) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size exceeds 10MB limit',
        });
      }

      // サポートされているファイル形式
      const supportedTypes = ['application/pdf', 'text/markdown', 'text/plain'];
      if (!supportedTypes.includes(fileType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unsupported file type',
        });
      }

      try {
        // Vercel Blobにアップロード
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = await put(fileName, buffer, {
          access: 'public',
        });

        // DBに保存
        const content = await prisma.content.create({
          data: {
            title: fileName,
            filePath: blob.url,
            fileType,
          },
        });

        return {
          success: true,
          contentId: content.id,
          url: blob.url,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload file',
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const content = await prisma.content.findUnique({
        where: { id: input.id },
      });

      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      return content;
    }),

  list: protectedProcedure
    .query(async () => {
      const contents = await prisma.content.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return contents;
    }),
});
```

**テスト要件** (TDD):
```typescript
// tests/integration/content-upload.test.ts
describe('Content Upload API', () => {
  it('should upload PDF file', async () => {
    const base64Data = Buffer.from('test pdf content').toString('base64');

    const result = await trpc.content.upload.mutate({
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      base64Data,
    });

    expect(result.success).toBe(true);
    expect(result.contentId).toBeDefined();
  });

  it('should reject large files', async () => {
    const base64Data = 'x'.repeat(11 * 1024 * 1024); // 11MB

    await expect(
      trpc.content.upload.mutate({
        fileName: 'large.pdf',
        fileType: 'application/pdf',
        fileSize: 11 * 1024 * 1024,
        base64Data,
      })
    ).rejects.toThrow('File size exceeds');
  });

  it('should reject unsupported file types', async () => {
    await expect(
      trpc.content.upload.mutate({
        fileName: 'test.exe',
        fileType: 'application/exe',
        fileSize: 1024,
        base64Data: 'test',
      })
    ).rejects.toThrow('Unsupported file type');
  });
});
```

**完了条件**:
- [x] アップロードAPI実装完了
- [x] ファイルサイズ制限動作確認
- [x] サポート形式チェック動作確認
- [x] テストが全てパス

---

### Task 2.2.2: ファイルアップロードUI
**担当**: Team A (Frontend)
**優先度**: P0
**依存**: 2.2.1
**所要時間**: 0.5人日

**実装ステップ**:
```typescript
// src/components/features/content/file-upload.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/trpc/client';
import { Button } from '@/components/ui/button';

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.content.upload.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // ファイルをBase64に変換
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(',')[1] || '';

        const result = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          base64Data,
        });

        if (result.success) {
          alert('アップロード成功！');
          setFile(null);
        }
      };
    } catch (error) {
      alert('アップロード失敗');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".pdf,.md,.txt"
        onChange={handleFileChange}
        className="block w-full"
      />

      {file && (
        <div className="text-sm text-gray-600">
          選択: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'アップロード中...' : 'アップロード'}
      </Button>
    </div>
  );
}
```

**テスト要件**:
```typescript
// tests/unit/components/file-upload.test.tsx
describe('FileUpload Component', () => {
  it('should render file input', () => {
    render(<FileUpload />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    render(<FileUpload />);
    const input = screen.getByRole('input') as HTMLInputElement;

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/test.pdf/)).toBeInTheDocument();
  });
});
```

**完了条件**:
- [x] UI実装完了
- [x] ファイル選択動作確認
- [x] アップロード動作確認
- [x] テストが全てパス

---

## 2.3 Content Analyzer Agent (P0) - 4人日

### Task 2.3.1: テキスト抽出サービス
**担当**: Team C
**優先度**: P0
**依存**: 2.2.1
**所要時間**: 1人日

**実装ステップ**:
```typescript
// src/lib/services/content/text-extractor.ts
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { readFile } from 'fs/promises';

export interface ExtractedText {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
  };
}

export class TextExtractor {
  /**
   * PDFからテキスト抽出
   */
  async extractFromPDF(filePath: string): Promise<ExtractedText> {
    const dataBuffer = await readFile(filePath);
    const data = await pdf(dataBuffer);

    return {
      content: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        characterCount: data.text.length,
      },
    };
  }

  /**
   * Markdownからテキスト抽出
   */
  async extractFromMarkdown(filePath: string): Promise<ExtractedText> {
    const content = await readFile(filePath, 'utf-8');

    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
      },
    };
  }

  /**
   * DOCXからテキスト抽出
   */
  async extractFromDOCX(filePath: string): Promise<ExtractedText> {
    const result = await mammoth.extractRawText({ path: filePath });

    return {
      content: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        characterCount: result.value.length,
      },
    };
  }

  /**
   * ファイル形式に応じて適切な抽出メソッドを呼び出す
   */
  async extract(filePath: string, fileType: string): Promise<ExtractedText> {
    if (fileType === 'application/pdf') {
      return this.extractFromPDF(filePath);
    } else if (fileType === 'text/markdown') {
      return this.extractFromMarkdown(filePath);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.extractFromDOCX(filePath);
    } else {
      // Plain text
      return this.extractFromMarkdown(filePath);
    }
  }
}
```

**テスト要件** (TDD):
```typescript
// tests/unit/services/text-extractor.test.ts
describe('TextExtractor', () => {
  let extractor: TextExtractor;

  beforeEach(() => {
    extractor = new TextExtractor();
  });

  it('should extract text from PDF', async () => {
    const result = await extractor.extractFromPDF('tests/fixtures/sample.pdf');

    expect(result.content).toBeDefined();
    expect(result.metadata.pageCount).toBeGreaterThan(0);
    expect(result.metadata.wordCount).toBeGreaterThan(0);
  });

  it('should extract text from Markdown', async () => {
    const result = await extractor.extractFromMarkdown('tests/fixtures/sample.md');

    expect(result.content).toBeDefined();
    expect(result.metadata.wordCount).toBeGreaterThan(0);
  });
});
```

**完了条件**:
- [x] PDF抽出動作確認
- [x] Markdown抽出動作確認
- [x] メタデータ取得確認
- [x] テストが全てパス

---

### Task 2.3.2: Content Analyzerエージェント実装
**担当**: Team C
**優先度**: P0
**依存**: 2.1.2, 2.3.1
**所要時間**: 2人日

**実装ステップ**:
```typescript
// src/lib/agents/content-analyzer/types.ts
import { z } from 'zod';

export const contentAnalysisOutputSchema = z.object({
  topics: z.array(z.string()).describe('Main topics covered in the content'),
  keyPoints: z.array(z.string()).describe('Key points and concepts'),
  difficulty: z.number().min(1).max(10).describe('Difficulty level (1-10)'),
  suggestedQuestionTypes: z.array(z.string()).describe('Recommended question types'),
  prerequisites: z.array(z.string()).describe('Prerequisites knowledge'),
  learningObjectives: z.array(z.string()).describe('Learning objectives'),
});

export type ContentAnalysisOutput = z.infer<typeof contentAnalysisOutputSchema>;
```

```typescript
// src/lib/agents/content-analyzer/content-analyzer.agent.ts
import { BaseAgent, AgentInput, AgentOutput } from '../base/base-agent';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { contentAnalysisOutputSchema, ContentAnalysisOutput } from './types';

const SYSTEM_PROMPT = `You are an expert educational content analyzer.

Your task is to analyze educational content and extract:
1. Main topics and themes
2. Key points and concepts
3. Difficulty level (1-10)
4. Recommended question types for learning
5. Prerequisites knowledge
6. Learning objectives

Be thorough and precise in your analysis.`;

export interface ContentAnalyzerInput {
  content: string;
  metadata?: {
    title?: string;
    fileType?: string;
  };
}

export class ContentAnalyzerAgent extends BaseAgent<
  ContentAnalyzerInput,
  ContentAnalysisOutput
> {
  private parser: StructuredOutputParser<ContentAnalysisOutput>;

  constructor(llm: any) {
    super(llm, SYSTEM_PROMPT);
    this.parser = StructuredOutputParser.fromZodSchema(contentAnalysisOutputSchema);
  }

  async execute(
    input: AgentInput<ContentAnalyzerInput>
  ): Promise<AgentOutput<ContentAnalysisOutput>> {
    const startTime = Date.now();

    try {
      const { content, metadata } = input.data;

      // コンテンツが長すぎる場合は要約
      const truncatedContent =
        content.length > 10000 ? content.slice(0, 10000) + '...' : content;

      const userMessage = `Analyze the following educational content:

Title: ${metadata?.title || 'Unknown'}
Content:
${truncatedContent}

Provide a comprehensive analysis.`;

      const result = await this.callLLMStructured(userMessage, this.parser);

      return {
        result,
        metadata: {
          executionTime: Date.now() - startTime,
          model: this.llm.modelName,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

**テスト要件** (TDD):
```typescript
// tests/unit/agents/content-analyzer.test.ts
describe('ContentAnalyzerAgent', () => {
  let agent: ContentAnalyzerAgent;

  beforeEach(() => {
    const llm = createLLM('openai');
    agent = new ContentAnalyzerAgent(llm);
  });

  it('should analyze content and return structured output', async () => {
    const input: AgentInput<ContentAnalyzerInput> = {
      data: {
        content: `
          # Introduction to React

          React is a JavaScript library for building user interfaces.
          It uses a component-based architecture and virtual DOM.

          ## Key Concepts
          - Components
          - Props
          - State
          - Hooks
        `,
        metadata: {
          title: 'Introduction to React',
          fileType: 'markdown',
        },
      },
    };

    const output = await agent.execute(input);

    expect(output.result.topics).toContain('React');
    expect(output.result.difficulty).toBeGreaterThanOrEqual(1);
    expect(output.result.difficulty).toBeLessThanOrEqual(10);
    expect(output.result.keyPoints.length).toBeGreaterThan(0);
  });

  it('should handle long content by truncating', async () => {
    const longContent = 'x'.repeat(15000);

    const input: AgentInput<ContentAnalyzerInput> = {
      data: { content: longContent },
    };

    const output = await agent.execute(input);
    expect(output.result).toBeDefined();
  });
});
```

**完了条件**:
- [x] エージェント実装完了
- [x] 構造化出力動作確認
- [x] 長文コンテンツ対応確認
- [x] テストが全てパス

---

### Task 2.3.3: コンテンツ解析サービス統合
**担当**: Team B
**優先度**: P0
**依存**: 2.3.1, 2.3.2
**所要時間**: 1人日

**実装ステップ**:
```typescript
// src/lib/services/content/content-analysis.service.ts
import { TextExtractor } from './text-extractor';
import { ContentAnalyzerAgent } from '@/lib/agents/content-analyzer/content-analyzer.agent';
import { createLLM } from '@/lib/agents/config';
import { prisma } from '@/lib/db/prisma';

export class ContentAnalysisService {
  private textExtractor: TextExtractor;
  private analyzerAgent: ContentAnalyzerAgent;

  constructor() {
    this.textExtractor = new TextExtractor();
    const llm = createLLM('openai');
    this.analyzerAgent = new ContentAnalyzerAgent(llm);
  }

  /**
   * コンテンツを解析してDBに保存
   */
  async analyzeContent(contentId: string): Promise<void> {
    // 1. DBからコンテンツ取得
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // 2. テキスト抽出
    const extractedText = await this.textExtractor.extract(
      content.filePath,
      content.fileType
    );

    // 3. エージェントで解析
    const analysis = await this.analyzerAgent.execute({
      data: {
        content: extractedText.content,
        metadata: {
          title: content.title,
          fileType: content.fileType,
        },
      },
    });

    // 4. 解析結果をDBに保存
    await prisma.content.update({
      where: { id: contentId },
      data: {
        analyzedAt: new Date(),
        topics: analysis.result.topics,
        difficulty: analysis.result.difficulty,
      },
    });
  }
}
```

**tRPC API追加**:
```typescript
// src/lib/api/trpc/routers/content.ts (追加)
import { ContentAnalysisService } from '@/lib/services/content/content-analysis.service';

export const contentRouter = router({
  // ... 既存のルーター

  analyze: protectedProcedure
    .input(z.object({ contentId: z.string() }))
    .mutation(async ({ input }) => {
      const service = new ContentAnalysisService();
      await service.analyzeContent(input.contentId);

      return { success: true };
    }),
});
```

**テスト要件**:
```typescript
// tests/integration/content-analysis-service.test.ts
describe('ContentAnalysisService', () => {
  it('should analyze uploaded content', async () => {
    // 1. コンテンツアップロード
    const uploadResult = await trpc.content.upload.mutate({
      fileName: 'test.md',
      fileType: 'text/markdown',
      fileSize: 1024,
      base64Data: Buffer.from('# Test Content').toString('base64'),
    });

    // 2. 解析実行
    await trpc.content.analyze.mutate({
      contentId: uploadResult.contentId,
    });

    // 3. 解析結果確認
    const content = await trpc.content.getById.query({
      id: uploadResult.contentId,
    });

    expect(content.analyzedAt).toBeDefined();
    expect(content.topics.length).toBeGreaterThan(0);
    expect(content.difficulty).toBeGreaterThanOrEqual(1);
  });
});
```

**完了条件**:
- [x] サービス統合完了
- [x] tRPC API動作確認
- [x] DB保存確認
- [x] テストが全てパス

---

## 2.4 ベクトル埋め込み生成 (P1) - 2.5人日

### Task 2.4.1: OpenAI Embeddings設定
**担当**: Team C
**優先度**: P1
**依存**: 2.3.1
**所要時間**: 0.5人日

**実装ステップ**:
```bash
pnpm add @langchain/openai
```

```typescript
// src/lib/services/embeddings/embedding.service.ts
import { OpenAIEmbeddings } from '@langchain/openai';

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * テキストをベクトル埋め込みに変換
   */
  async embed(text: string): Promise<number[]> {
    const embedding = await this.embeddings.embedQuery(text);
    return embedding;
  }

  /**
   * 複数のテキストを一括変換
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings = await this.embeddings.embedDocuments(texts);
    return embeddings;
  }
}
```

**テスト要件**:
```typescript
// tests/unit/services/embedding.test.ts
describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService();
  });

  it('should generate embedding for text', async () => {
    const embedding = await service.embed('Test text');

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536); // text-embedding-3-small dimension
  });

  it('should generate embeddings in batch', async () => {
    const embeddings = await service.embedBatch(['Text 1', 'Text 2']);

    expect(embeddings.length).toBe(2);
    expect(embeddings[0].length).toBe(1536);
  });
});
```

**完了条件**:
- [x] Embeddings設定完了
- [x] 単一テキスト変換確認
- [x] バッチ変換確認
- [x] テストが全てパス

---

### Task 2.4.2: pgvectorストレージ実装
**担当**: Team D
**優先度**: P1
**依存**: 2.4.1, 1.2.3
**所要時間**: 1人日

**実装ステップ**:
```sql
-- PostgreSQLでvector拡張有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- Contentテーブルのembeddingカラム確認
ALTER TABLE contents ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ベクトル類似度検索用インデックス
CREATE INDEX IF NOT EXISTS content_embedding_idx
ON contents USING ivfflat (embedding vector_cosine_ops);
```

```typescript
// src/lib/db/repositories/content.repository.ts
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export class ContentRepository {
  /**
   * ベクトル埋め込みを保存
   */
  async updateEmbedding(contentId: string, embedding: number[]): Promise<void> {
    await prisma.$executeRaw`
      UPDATE contents
      SET embedding = ${embedding}::vector
      WHERE id = ${contentId}
    `;
  }

  /**
   * ベクトル類似度検索
   */
  async findSimilar(embedding: number[], limit: number = 5) {
    const results = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
      SELECT id, 1 - (embedding <=> ${embedding}::vector) as similarity
      FROM contents
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${limit}
    `;

    return results;
  }
}
```

**テスト要件**:
```typescript
// tests/integration/content-repository.test.ts
describe('ContentRepository', () => {
  let repo: ContentRepository;

  beforeEach(() => {
    repo = new ContentRepository();
  });

  it('should save embedding', async () => {
    const embedding = new Array(1536).fill(0.1);

    await repo.updateEmbedding('content-id', embedding);

    // 保存確認
    const content = await prisma.content.findUnique({
      where: { id: 'content-id' },
    });

    expect(content?.embedding).toBeDefined();
  });

  it('should find similar content', async () => {
    const queryEmbedding = new Array(1536).fill(0.1);

    const results = await repo.findSimilar(queryEmbedding, 5);

    expect(results.length).toBeLessThanOrEqual(5);
    expect(results[0].similarity).toBeGreaterThanOrEqual(0);
  });
});
```

**完了条件**:
- [x] pgvector設定完了
- [x] 埋め込み保存確認
- [x] 類似度検索動作確認
- [x] テストが全てパス

---

### Task 2.4.3: 埋め込み生成統合
**担当**: Team B
**優先度**: P1
**依存**: 2.4.1, 2.4.2, 2.3.3
**所要時間**: 1人日

**実装ステップ**:
```typescript
// src/lib/services/content/content-analysis.service.ts (更新)
import { EmbeddingService } from '../embeddings/embedding.service';
import { ContentRepository } from '@/lib/db/repositories/content.repository';

export class ContentAnalysisService {
  private textExtractor: TextExtractor;
  private analyzerAgent: ContentAnalyzerAgent;
  private embeddingService: EmbeddingService;
  private contentRepo: ContentRepository;

  constructor() {
    this.textExtractor = new TextExtractor();
    const llm = createLLM('openai');
    this.analyzerAgent = new ContentAnalyzerAgent(llm);
    this.embeddingService = new EmbeddingService();
    this.contentRepo = new ContentRepository();
  }

  async analyzeContent(contentId: string): Promise<void> {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // テキスト抽出
    const extractedText = await this.textExtractor.extract(
      content.filePath,
      content.fileType
    );

    // エージェントで解析
    const analysis = await this.analyzerAgent.execute({
      data: {
        content: extractedText.content,
        metadata: {
          title: content.title,
          fileType: content.fileType,
        },
      },
    });

    // ベクトル埋め込み生成
    const embedding = await this.embeddingService.embed(
      extractedText.content.slice(0, 8000) // トークン制限を考慮
    );

    // DB更新
    await prisma.content.update({
      where: { id: contentId },
      data: {
        analyzedAt: new Date(),
        topics: analysis.result.topics,
        difficulty: analysis.result.difficulty,
      },
    });

    // 埋め込み保存
    await this.contentRepo.updateEmbedding(contentId, embedding);
  }
}
```

**完了条件**:
- [x] 埋め込み生成統合完了
- [x] エンドツーエンド動作確認
- [x] テストが全てパス

---

## Phase 2 完了チェックリスト

### 必須項目 (P0)
- [ ] LangChain.js設定完了
- [ ] BaseAgentクラス実装
- [ ] ファイルアップロードAPI動作
- [ ] ファイルアップロードUI動作
- [ ] TextExtractor動作確認
- [ ] ContentAnalyzerAgent動作確認
- [ ] コンテンツ解析サービス統合完了

### 推奨項目 (P1)
- [ ] LangSmith統合
- [ ] 埋め込み生成動作確認
- [ ] pgvector類似度検索動作確認

### オプション項目 (P2)
- [ ] 他のファイル形式サポート (DOCX, PPTXなど)
- [ ] 画像OCR対応

---

## 次のステップ

✅ Phase 2完了後 → **Phase 3: Learning System Core** へ

Phase 3では以下を実装:
- Learning Plannerエージェント
- Question Generatorエージェント
- Evaluatorエージェント
- LangGraphフロー統合
- 学習セッション管理
