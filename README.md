# collect files cli

Рекурсивно собирает содержимое файлов в один текстовый файл.  
Полезно для создания снимка кодовой базы, документации или передачи контекста.

## Установка

```bash
npm install -g collect-files-cli
```

Или из исходников:

```bash
git clone https://github.com/fockusty/collect-files-cli.git
cd collect-files-cli
npm install
npm run build
npm link
```

## Использование

```bash
cf [директория] [опции]
```

Если директория не указана, используется текущая.

### Опции

| Параметр | Краткий | Описание |
| -------- | ------- | -------- |
| `--output` | `-o` | Путь к выходному файлу (по умолчанию `data.txt` в корне обхода) |
| `--ignore` | `-i` | Дополнительные папки/файлы через запятую (к стандартным игнорируемым) |
| `--concurrency` | `-c` | Максимум одновременных чтений (по умолчанию `10`) |
| `--include-binary` | `-ib` | Включать бинарные файлы в формате base64 |
| `--no-progress` | `-np` | Отключить прогресс-вывод |
| `--help` | `-h` | Показать справку |

### Примеры

```bash
# Собрать текущую папку в data.txt
cf

# Собрать папку src, исключая логи и тесты
cf ./src --ignore logs,tests --output snapshot.md

# Включить бинарные файлы и отключить прогресс
cf . --include-binary --no-progress -o full-dump.txt
cf . -ib -np -o full-dump.txt
```

## Стандартно игнорируемые имена

По умолчанию не обрабатываются:  
`node_modules`, `.git`, `.idea`, `.vscode`, `dist`, `build`, `.DS_Store`, `Thumbs.db`, `package-lock.json`, `yarn.lock`.

Их можно дополнить опцией `--ignore`.

## Разработка

- Язык: TypeScript
- Модульная система: ESM (`"type": "module"`)
- Компиляция: `tsc`

```bash
npm run build   # сборка в dist/
npm start       # запуск собранной версии
```

## Лицензия

MIT
