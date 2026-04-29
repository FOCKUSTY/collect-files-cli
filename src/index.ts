#!/usr/bin/env node
import { CliOptionsParser } from './cli-options.js';
import { FileCollector } from './file-collector.js';

const main = async (): Promise<void> => {
  try {
    const options = CliOptionsParser.parse(process.argv);
    const collector = new FileCollector(options);
    await collector.execute();
  } catch (error) {
    console.error('💥 Фатальная ошибка:', error);
    process.exit(1);
  }
}

main();