import { ROOT_DIRECTORY, WORKING_DIRECTORY } from "./constants.js";
import { resolve } from "path";
import { IgnoreConfig } from "./ignore-config.js";

export interface CliOptions {
  rootDir: string;
  configDir: string;
  output: string;
  ignore: string[];
  concurrency: number;
  includeBinary: boolean;
  showProgress: boolean;
}

export class CliOptionsParser {
  public static readonly DEFAULT_OUTPUT_FILENAME = "data.txt";

  public static parse(argv: string[]): CliOptions {
    const args = argv.slice(2);
    const ignore: string[] = [];

    let rootDir = WORKING_DIRECTORY;
    let output: string | null = null;
    let concurrency = 10;
    let includeBinary = false;
    let showProgress = true;
    let configDir: string = IgnoreConfig.getConfigPathSync();

    for (let i = 0; i < args.length; i++) {
      const currentArgument = args[i];
      const nextArgument = args[i + 1];

      switch (currentArgument) {
        case "--output":
        case "-o":
          output = nextArgument;
          i++;
          break;

        case "--ignore":
        case "-i":
          ignore.push(...nextArgument.split(",").map((part) => part.trim()));
          i++;
          break;

        case "--concurrency":
        case "-c":
          concurrency = parseInt(nextArgument, 10) || 10;
          i++;
          break;

        case "--include-binary":
        case "-ib":
          includeBinary = true;
          break;

        case "--no-progress":
        case "-np":
          showProgress = false;
          break;

        case "--help":
        case "-h":
          CliOptionsParser.showHelp();
          process.exit(0);

        default:
          if (currentArgument.startsWith("-")) {
            break;
          }

          if (currentArgument === "config") {
            IgnoreConfig.createSync(WORKING_DIRECTORY);
            process.exit(0);
          }

          rootDir = resolve(currentArgument);
          break;
      }
    }

    return {
      rootDir,
      output: output ?? resolve(rootDir, this.DEFAULT_OUTPUT_FILENAME),
      ignore,
      concurrency,
      includeBinary,
      showProgress,
      configDir: configDir,
    };
  }

  private static showHelp(): void {
    console.log(`
Использование: cf [директория|команда] [опции]

Собирает содержимое всех файлов (кроме игнорируемых) в один текстовый файл.

Команды:
  config                     Создаёт конфиг в рабочей папке

Параметры:
  --output, -o <файл>        Путь к выходному файлу (по умолчанию data.txt в корне обхода)
  --ignore, -i <список>      Исключить папки/файлы через запятую (дополнительно к стандартным)
  --concurrency, -c <число>  Максимум одновременных чтений (по умолчанию 10)
  --config, -cfg             Создаёт конфиг в рабочей директории
  --include-binary, -ib      Включать бинарные файлы в base64
  --no-progress, -np         Отключить прогресс-вывод
  --help, -h                 Эта справка
`);
  }
}
