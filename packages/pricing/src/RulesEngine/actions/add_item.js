import { registerAction } from './index.js';

registerAction('ADD_ITEM', (payload, _target) => {
  return { delta: 0, itemId: payload.itemId, description: `auto-add ${payload.itemId}` };
});
