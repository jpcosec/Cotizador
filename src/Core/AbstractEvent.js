export class AbstractEvent {
  constructor(name, payload = {}) {
    this.name = name;
    this.payload = payload;
    this.errors = [];
    this.messages = [];
  }

  async run(state, store) {
    const ctx = { state, store, event: this };

    await this.preExecution(ctx);
    if (this.errors.length) return this._result(state);

    await this.execute(ctx);
    if (this.errors.length) return this._result(state);

    await this.postExecution(ctx);
    if (this.errors.length) return this._result(state);

    await this.preRender(ctx);
    await this.validation(ctx);

    return this._result(state);
  }

  async preExecution(_ctx) {}
  async execute(_ctx) {}
  async postExecution(_ctx) {}
  async preRender(_ctx) {}
  async validation(_ctx) {}

  addError(message, details = {}) {
    this.errors.push({ event: this.name, message, ...details });
  }

  addMessage(type, message, details = {}) {
    this.messages.push({ event: this.name, type, message, ...details });
  }

  toLogEntry() {
    return {
      event: this.name,
      payload: this.payload,
      timestamp: new Date().toISOString(),
      errors: this.errors.length ? [...this.errors] : undefined,
      messages: this.messages.length ? [...this.messages] : undefined,
    };
  }

  _result(state) {
    return {
      state,
      errors: [...this.errors],
      messages: [...this.messages],
    };
  }
}
