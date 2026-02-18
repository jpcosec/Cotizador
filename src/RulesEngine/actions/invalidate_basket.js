import { registerAction } from './index.js';

registerAction('INVALIDATE_BASKET', (payload, _target) => {
  return { delta: 0, type: 'INVALIDATE', message: payload.message, description: `INVALID: ${payload.message}` };
});
