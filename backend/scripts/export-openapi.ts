import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../src/config/swagger';

const out = path.join(__dirname, '../../docs/openapi.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(swaggerSpec, null, 2));
console.log(`Exported OpenAPI spec to ${out}`);
