import { registerAction } from './index.js';

registerAction('ERROR', (payload, _target) => {
  return { delta: 0, type: 'ERROR', message: payload.message, description: payload.message };
});
