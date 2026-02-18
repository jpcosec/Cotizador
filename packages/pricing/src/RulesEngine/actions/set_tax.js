import { registerAction } from './index.js';

registerAction('SET_TAX', (payload, target) => {
  const amount = target.subtotal * payload.rate;
  return {
    delta: amount,
    description: `${payload.name} ${payload.rate * 100}%`,
    name: payload.name,
    rate: payload.rate,
    amount,
  };
});
