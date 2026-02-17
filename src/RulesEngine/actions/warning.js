import { registerAction } from './index.js';

registerAction('WARNING', (payload, _target) => {
  return { delta: 0, type: 'WARNING', message: payload.message, description: payload.message };
});
