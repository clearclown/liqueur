# @liqueur/db-adapter

データベースイントロスペクションアダプター

## 機能

- **Prismaスキーマ解析**: Prismaスキーマファイルからメタデータを自動生成
- **DatabaseMetadata生成**: AI向けのデータベース構造情報を生成
- **マルチDB対応**: PostgreSQL/MySQL/SQLite対応

## インストール

```bash
npm install @liqueur/db-adapter
```

### Peer Dependencies

Prismaを使用する場合:

```bash
npm install prisma @prisma/client
```

## 使用方法

### Prismaスキーマからのイントロスペクション

```typescript
import { PrismaIntrospector } from '@liqueur/db-adapter';

const introspector = new PrismaIntrospector();

// スキーマファイルから解析
const metadata = await introspector.introspect({
  schemaPath: './prisma/schema.prisma',
});

console.log(metadata.tables);
// [
//   { name: 'User', columns: [...], relations: [...] },
//   { name: 'Post', columns: [...], relations: [...] },
// ]
```

### DatabaseMetadataの利用

```typescript
import { PrismaIntrospector } from '@liqueur/db-adapter';
import type { DatabaseMetadata } from '@liqueur/protocol';

const introspector = new PrismaIntrospector();
const metadata: DatabaseMetadata = await introspector.introspect({
  schemaPath: './prisma/schema.prisma',
});

// AIプロンプトに渡す
const prompt = `
Available tables: ${metadata.tables.map(t => t.name).join(', ')}
`;
```

### 接続オプション

```typescript
const metadata = await introspector.introspect({
  schemaPath: './prisma/schema.prisma',
  options: {
    includeViews: true,
    includeEnums: true,
    excludeTables: ['_prisma_migrations'],
  },
});
```

## API リファレンス

### Classes

| クラス | 説明 |
|--------|------|
| `PrismaIntrospector` | Prismaスキーマ解析器 |

### Types

| 型 | 説明 |
|----|------|
| `DatabaseIntrospector` | イントロスペクターインターフェース |
| `DatabaseConnectionOptions` | DB接続オプション |
| `IntrospectionOptions` | イントロスペクションオプション |
| `PrismaSchema` | Prismaスキーマ構造 |
| `PrismaModel` | Prismaモデル定義 |
| `PrismaField` | Prismaフィールド定義 |
| `PrismaEnum` | Prisma Enum定義 |

## 対応予定

- [ ] Drizzle ORM対応
- [ ] TypeORM対応
- [ ] 生SQLスキーマ解析

## ライセンス

MIT
