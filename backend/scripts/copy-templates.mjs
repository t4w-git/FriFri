import { cpSync } from 'node:fs';

cpSync('src/templates', 'dist/templates', { recursive: true });
