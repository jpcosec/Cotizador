import { registerAction } from './index.js';

registerAction('SET_VALUE', (payload, target) => {
  const delta = payload.value - target.neto;
  return { delta, description: `set to ${payload.value}` };
});
