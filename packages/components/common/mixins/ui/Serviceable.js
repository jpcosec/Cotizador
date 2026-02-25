export function Serviceable(Base) {
  return class extends Base {
    _services = {};

    injectService(serviceName, service) {
      this._services[serviceName] = service;
      return this;
    }

    getService(serviceName) {
      return this._services[serviceName];
    }

    hasService(serviceName) {
      return serviceName in this._services;
    }
  };
}
