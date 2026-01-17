/**
 * Prisma Introspector
 *
 * Prisma schemaからデータベースメタデータを取得
 */

import type {
  DatabaseMetadata,
  Table,
  Column,
  Relation,
} from '@liqueur/protocol';
import type {
  DatabaseIntrospector,
  DatabaseConnectionOptions,
  IntrospectionOptions,
  PrismaSchema,
  PrismaModel,
  PrismaField,
} from '../types';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export class PrismaIntrospector implements DatabaseIntrospector {
  private options: DatabaseConnectionOptions;
  private introspectionOptions: IntrospectionOptions;

  constructor(
    options: DatabaseConnectionOptions = {},
    introspectionOptions: IntrospectionOptions = {}
  ) {
    this.options = options;
    this.introspectionOptions = introspectionOptions;
  }

  /**
   * Check if Prisma is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Prisma CLIの存在を確認
      const prismaPath = this.options.prismaSchemaPath || './prisma/schema.prisma';
      return existsSync(prismaPath);
    } catch {
      return false;
    }
  }

  /**
   * Get database metadata from Prisma schema
   */
  async getMetadata(): Promise<DatabaseMetadata> {
    const schema = await this.parsePrismaSchema();
    const tables = this.convertModelsToTables(schema.models);
    const relations = this.extractRelations(schema.models);

    return {
      tables,
      relations,
      enums: schema.enums.map(e => ({
        name: e.name,
        values: e.values,
      })),
    };
  }

  /**
   * Get specific table information
   */
  async getTable(tableName: string): Promise<Table | null> {
    const metadata = await this.getMetadata();
    const table = metadata.tables.find(t => t.name === tableName);
    return table || null;
  }

  /**
   * Parse Prisma schema file
   */
  private async parsePrismaSchema(): Promise<PrismaSchema> {
    const schemaPath = this.options.prismaSchemaPath || './prisma/schema.prisma';

    if (!existsSync(schemaPath)) {
      throw new Error(`Prisma schema file not found: ${schemaPath}`);
    }

    const schemaContent = await readFile(schemaPath, 'utf-8');
    return this.parseSchemaContent(schemaContent);
  }

  /**
   * Parse Prisma schema content
   */
  private parseSchemaContent(content: string): PrismaSchema {
    const models: PrismaModel[] = [];
    const enums: { name: string; values: string[] }[] = [];

    // モデル定義の正規表現
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;

    // モデルをパース
    let modelMatch;
    while ((modelMatch = modelRegex.exec(content)) !== null) {
      const [, modelName, fieldsContent] = modelMatch;

      // フィルタリング
      if (this.shouldIncludeTable(modelName)) {
        models.push(this.parseModel(modelName, fieldsContent));
      }
    }

    // Enumをパース
    let enumMatch;
    while ((enumMatch = enumRegex.exec(content)) !== null) {
      const [, enumName, valuesContent] = enumMatch;
      const values = valuesContent
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => line.split(/\s+/)[0]);

      enums.push({ name: enumName, values });
    }

    return { models, enums };
  }

  /**
   * Parse Prisma model
   */
  private parseModel(name: string, fieldsContent: string): PrismaModel {
    const fields: PrismaField[] = [];
    const lines = fieldsContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // コメントや空行をスキップ
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
        continue;
      }

      const field = this.parseField(trimmed);
      if (field) {
        fields.push(field);
      }
    }

    return { name, fields };
  }

  /**
   * Parse Prisma field
   */
  private parseField(line: string): PrismaField | null {
    // フィールドの基本形式: name Type @attribute
    const match = line.match(/^(\w+)\s+(\w+)(\[\])?\??/);

    if (!match) {
      return null;
    }

    const [, name, type, isList] = match;

    // 属性をパース
    const isId = line.includes('@id');
    const isUnique = line.includes('@unique');
    const isRequired = !line.includes('?') && !isList;

    // リレーション情報
    const relationMatch = line.match(/@relation\("(\w+)"(?:,\s*fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\])?/);
    const relationName = relationMatch?.[1];
    const relationFromFields = relationMatch?.[2]?.split(',').map(f => f.trim());
    const relationToFields = relationMatch?.[3]?.split(',').map(f => f.trim());

    // デフォルト値
    const defaultMatch = line.match(/@default\(([^)]+)\)/);
    const defaultValue = defaultMatch?.[1];

    return {
      name,
      type,
      isRequired,
      isList: !!isList,
      isId,
      isUnique,
      relationName,
      relationFromFields,
      relationToFields,
      default: defaultValue,
    };
  }

  /**
   * Convert Prisma models to Table format
   */
  private convertModelsToTables(models: PrismaModel[]): Table[] {
    return models.map(model => ({
      name: model.name,
      columns: model.fields
        .filter(field => !field.relationName || field.relationFromFields)
        .map(field => this.convertFieldToColumn(field)),
    }));
  }

  /**
   * Convert Prisma field to Column format
   */
  private convertFieldToColumn(field: PrismaField): Column {
    return {
      name: field.name,
      type: this.mapPrismaTypeToSqlType(field.type),
      nullable: !field.isRequired,
      primaryKey: field.isId,
      unique: field.isUnique,
      defaultValue: field.default,
    };
  }

  /**
   * Map Prisma type to SQL type
   */
  private mapPrismaTypeToSqlType(prismaType: string): string {
    const typeMap: Record<string, string> = {
      String: 'VARCHAR',
      Int: 'INTEGER',
      BigInt: 'BIGINT',
      Float: 'FLOAT',
      Decimal: 'DECIMAL',
      Boolean: 'BOOLEAN',
      DateTime: 'TIMESTAMP',
      Json: 'JSON',
      Bytes: 'BYTEA',
    };

    return typeMap[prismaType] || 'VARCHAR';
  }

  /**
   * Extract relations from models
   */
  private extractRelations(models: PrismaModel[]): Relation[] {
    const relations: Relation[] = [];

    for (const model of models) {
      for (const field of model.fields) {
        if (field.relationName && field.relationFromFields && field.relationToFields) {
          // Many-to-one または One-to-one
          relations.push({
            name: field.relationName,
            fromTable: model.name,
            fromColumn: field.relationFromFields[0],
            toTable: field.type,
            toColumn: field.relationToFields[0],
            type: field.isList ? 'one-to-many' : 'many-to-one',
          });
        }
      }
    }

    return relations;
  }

  /**
   * Check if table should be included
   */
  private shouldIncludeTable(tableName: string): boolean {
    const { includeTables, excludeTables } = this.introspectionOptions;

    if (excludeTables?.includes(tableName)) {
      return false;
    }

    if (includeTables && includeTables.length > 0) {
      return includeTables.includes(tableName);
    }

    return true;
  }
}
