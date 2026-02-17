const _registry = new Map();

export function registerAction(name, handler) {
  _registry.set(name, handler);
}

export function getActionHandler(name) {
  const handler = _registry.get(name);
  if (!handler) throw new Error(`Unknown action type: ${name}`);
  return handler;
}

export function registeredActions() {
  return [..._registry.keys()];
}
