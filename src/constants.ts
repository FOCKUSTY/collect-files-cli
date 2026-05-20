import { cwd } from "process";
import { join } from "path";

export const ROOT_DIRECTORY = join(import.meta.dirname, "..");
export const WORKING_DIRECTORY = cwd();

export const DEFAULT_IGNORE_CONFIG = `\
# .collectignore файл
# Вышестоящие линии имеют больший приоритет
# Если нашли ошибку, то
# пишите https://github.com/FOCKUSTY/collect-files-cli/issues/new
# MIT License Copyright (c) 2026-present FOCKUSTY

# Зависимости
node_modules/
package-lock.json
yarn.lock

# Системы контроля версий и IDE
.git/
.idea/
.vscode/

# Результаты сборки
dist/
build/
.next/
.nuxt/
.output/
.svelte-kit/
target/
.gradle/

# Покрытие кода и метрики
coverage/
.nyc_output/

# Кэш сборщиков
.cache/
.parcel-cache/

# Python
__pycache__/
.pytest_cache/

# Go, PHP, Ruby
vendor/

# Временные файлы
.tmp/
tmp/
temp/
logs/
*.log

# Бекапы
*.bak
*.backup
*.old

# Файлы окружения
.env
.env.local
.env.*.local

# Системные файлы
.DS_Store
Thumbs.db
`;