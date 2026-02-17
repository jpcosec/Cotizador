import { registerAction } from './index.js';

registerAction('SET_DEFAULT', (payload, target) => {
  const value = payload.value;
  return { delta: 0, value, field: payload.field, description: `default ${payload.field}=${value}` };
});
