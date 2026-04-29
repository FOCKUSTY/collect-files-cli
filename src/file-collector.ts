import type { CliOptions } from './cli-options.js';

import { readdir, open, readFile, writeFile } from 'fs/promises';
import { join, extname, relative, sep } from 'path';
import { existsSync } from 'fs';

interface FileData {
  filePath: string;
  extension: string;
  content: string;
  binary: boolean;
}

export class FileCollector {
  private static readonly DEFAULT_IGNORES: string[] = [
    'node_modules', '.git', '.idea', '.vscode', 'dist', 'build',
    '.DS_Store', 'Thumbs.db', 'package-lock.json', 'yarn.lock',
  ];

  private readonly rootDir: string;
  private readonly output: string;
  private readonly ignore: Set<string>;
  private readonly concurrency: number;
  private readonly includeBinary: boolean;
  private readonly showProgress: boolean;

  public constructor(options: CliOptions) {
    this.rootDir = options.rootDir;
    this.output = options.output;

    this.ignore = new Set([
      ...FileCollector.DEFAULT_IGNORES,
      ...options.ignore,
    ]);

    this.concurrency = options.concurrency;
    this.includeBinary = options.includeBinary;
    this.showProgress = options.showProgress;
  }

  async execute(): Promise<void> {
    this.validateDirectory();
    if (this.showProgress) {
      console.log(`🔍 Сканируем: ${this.rootDir}`);
    }

    const fileList = await this.collectFilePaths();
    if (this.showProgress) {
      console.log(`📁 Найдено ${fileList.length} файлов. Читаем...`);
    }

    const contents = await this.readFilesWithLimit(fileList);
    const outputText = this.formatOutput(contents);

    await this.writeOutput(outputText);
    if (this.showProgress) {
      console.log(`✅ Готово! Записано в "${this.output}".`);
    }
  }

  private validateDirectory(): void {
    const exists = existsSync(this.rootDir);
    if (!exists) {
      console.error(`❌ Директория "${this.rootDir}" не существует.`);
      process.exit(1);
    }
  }

  private async collectFilePaths(): Promise<string[]> {
    const fileList: string[] = [];

    const entries = await (() => {
      try {
        return readdir(this.rootDir, { withFileTypes: true, recursive: true });
      } catch (error) {
        if (this.showProgress) {
          console.error(`⚠️  Не удалось прочитать директорию ${this.rootDir}: ${(error as Error).message}`);
        }

        return [];
      }
    })();

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      
      const fullPath = join(entry.parentPath, entry.name);
      const relativePath = relative(this.rootDir, fullPath);
      const pathSegments = relativePath.split(sep);

      const ignored = pathSegments.some(segment => {
        return this.ignore.has(segment);
      });
      if (ignored) {
        continue;
      }

      fileList.push(fullPath);
    }

    return fileList;
  }

  private async readFilesWithLimit(fileList: string[]): Promise<FileData[]> {
    const results: FileData[] = [];
    const worker = async (filePath: string): Promise<void> => {
      const data = await this.readSingleFile(filePath);
      if (!data) {
        return;
      }
      
      results.push(data);
    };

    const limit = this.concurrency;
    const executing = new Set<Promise<void>>();
    for (const filePath of fileList) {
      const promise = worker(filePath);
      if (limit >= fileList.length) {
        await promise;
        continue;
      }
      
      const trackedPromise = promise.then(() => {
        executing.delete(trackedPromise);
      });

      executing.add(trackedPromise);
      if (executing.size < limit) {
        continue;
      }

      await Promise.race(executing);
    }

    await Promise.all(executing);
    
    return results;
  }

  private async readSingleFile(filePath: string): Promise<FileData | null> {
    const extention = extname(filePath);

    try {
      const binary = await this.isBinaryFile(filePath);
      if (binary && !this.includeBinary) {
        return null;
      }

      const content = await (async () => {
        if (binary) {
          const buffer = await readFile(filePath);
          return buffer.toString("base64");
        }

        return readFile(filePath, "utf-8");
      })();

      return { filePath, extension: extention, content, binary };
    } catch (error) {
      if (this.showProgress) {
        console.error(`⚠️  Ошибка чтения ${filePath}: ${(error as Error).message}`);
      }

      return null;
    }
  }

  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const fileDescriptor = await open(filePath, 'r');

      const buffer = Buffer.alloc(1024);
      const { bytesRead } = await fileDescriptor.read(buffer, 0, 1024, 0);

      await fileDescriptor.close();

      for (let index = 0; index < bytesRead; index++) {
        if (buffer[index] === 0) {
          return true;
        }
      }

      return false;
    } catch {
      return true;
    }
  }

  private formatOutput(contents: FileData[]): string {
    let text = '';
    for (const item of contents) {
      const binaryLabel = item.binary ? ' (binary base64)' : '';
      text += `\n\`${item.filePath}\`${binaryLabel}\n\`\`\`${item.extension}\n${item.content}\n\`\`\``;
    }

    return text;
  }

  private writeOutput(text: string): Promise<void> {
    return writeFile(this.output, text, 'utf-8');
  }
}