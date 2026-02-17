import { registerAction } from './index.js';

registerAction('ADD_FIXED', (payload, target) => {
  return { delta: payload.amount, description: `+${payload.amount}` };
});
