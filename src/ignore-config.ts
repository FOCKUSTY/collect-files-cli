import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { DEFAULT_IGNORE_CONFIG, ROOT_DIRECTORY, WORKING_DIRECTORY } from "./constants.js";
import { readdirSync, writeFileSync } from "fs";

export type IgnorePatternConfig = {
  isNegative: boolean;
  isDirectory: boolean;
}

export type IgnorePattern = IgnorePatternConfig & {
  pattern: string;
  regex: RegExp
}

export class IgnoreConfig {
  private static readonly FILE_NAME = ".collectignore";
  private static readonly SYMBOLS = {
    COMMENT: "#",
    NEGATIVE: "!",
    DIRECTORY: "/",
    SPLIT: /\r?\n/
  } as const;

  private readonly _dirPath: string;
  private readonly _ignore: Set<string>;

  public static getConfigPathSync(): string {
    const dir = readdirSync(WORKING_DIRECTORY)
    if (dir.includes(IgnoreConfig.FILE_NAME)) {
      return WORKING_DIRECTORY;
    }

    return ROOT_DIRECTORY;
  }

  public static createSync(root: string = ROOT_DIRECTORY) {
    const path = join(root, IgnoreConfig.FILE_NAME);
    writeFileSync(path, DEFAULT_IGNORE_CONFIG, "utf-8");

    return path;
  }

  public constructor(dirPath: string = ROOT_DIRECTORY, ignore: string[] = []) {
    this._dirPath = dirPath;
    this._ignore = new Set(ignore);
  }

  public async execute() {
    const ignore = await this.read();
    const resolvedIgnore = this.resolveIgnore(ignore);
    const filteredIgnore = this.filter(resolvedIgnore);
    const parsedIgnore = this.parse(filteredIgnore);

    return parsedIgnore;
  }

  public isIgnore(path: string, patterns: IgnorePattern[]): boolean {
    const normalizedPath = path.replace(/\\/g, IgnoreConfig.SYMBOLS.DIRECTORY);

    let ignored: boolean = false;
    for (const pattern of patterns) {
      const matches = normalizedPath.match(pattern.regex);
      if (!matches) {
        continue;
      }

      if (pattern.isNegative) {
        console.log({pattern, path});
        break;
      }

      ignored = true;
      break;
    };

    return ignored;
  }

  private resolveIgnore(ignore: string[]) {
    return Array.from(new Set([
      ...ignore,
      ...this._ignore
    ]));
  }

  private async read(): Promise<string[]> {
    const filePath = join(this._dirPath, IgnoreConfig.FILE_NAME);
    const file = await readFile(filePath, "utf-8");

    const ignore = file.split(IgnoreConfig.SYMBOLS.SPLIT);
    return ignore;
  }

  private filter(ignore: string[]): string[] {
    return ignore.filter((value) => {
      const trimmed = value.trim();
      if (trimmed.startsWith(IgnoreConfig.SYMBOLS.COMMENT)) {
        return false;
      }

      if (trimmed === "") {
        return false;
      }

      return true;
    });
  }

  private parse(ignore: string[]): IgnorePattern[] {
    return ignore.map((value) => {
      let pattern = value.trim();
      const config: IgnorePatternConfig = {
        isNegative: false,
        isDirectory: false
      }

      if (pattern.startsWith(IgnoreConfig.SYMBOLS.NEGATIVE)) {
        config.isNegative = true;
        pattern = pattern.slice(1);
      }

      if (pattern.endsWith(IgnoreConfig.SYMBOLS.DIRECTORY)) {
        config.isDirectory = true;
        pattern = pattern.slice(0, -1);
      }

      return {
        pattern,
        regex: this.patternToRegex(pattern),
        ...config,
      }
    });
  }

  private patternToRegex(pattern: string): RegExp {
    let regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');
    
    regexPattern = (() => {
      if (pattern.startsWith(IgnoreConfig.SYMBOLS.DIRECTORY)) {
        return `^${regexPattern.slice(1)}`;
      }

      return `(^|/)${regexPattern}`;
    })();
    
    if (pattern.endsWith(IgnoreConfig.SYMBOLS.DIRECTORY)) {
      regexPattern += IgnoreConfig.SYMBOLS.DIRECTORY;
    }
    
    regexPattern += '($|/)';
    
    return new RegExp(regexPattern);
  }
}
