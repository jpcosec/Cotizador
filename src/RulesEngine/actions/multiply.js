import { registerAction } from './index.js';

registerAction('MULTIPLY', (payload, target) => {
  const delta = target.neto * (payload.factor - 1);
  return { delta, description: `\u00d7${payload.factor}` };
});
