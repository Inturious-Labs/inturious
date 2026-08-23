// Standalone migration runner, for deploys: `npm run migrate`.
import { open, migrate } from './lib/db.js';

open(process.env.DB_PATH ?? './inturious.db');
const applied = migrate();
console.log(applied.length ? `applied: ${applied.join(', ')}` : 'up to date');
