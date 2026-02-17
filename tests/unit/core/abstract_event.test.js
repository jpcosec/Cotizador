import { describe, it, expect } from 'vitest';
import { AbstractEvent } from '../../../mock/Core/AbstractEvent.js';

class SuccessEvent extends AbstractEvent {
  constructor(payload) { super('SuccessEvent', payload); }
  async execute(ctx) {
    ctx.state.value = this.payload.value;
    this.addMessage('INFO', 'Value set');
  }
}

class FailPreEvent extends AbstractEvent {
  constructor() { super('FailPreEvent'); }
  async preExecution() { this.addError('Invalid input'); }
  async execute(ctx) { ctx.state.touched = true; }
}

class FailExecuteEvent extends AbstractEvent {
  constructor() { super('FailExecuteEvent'); }
  async execute() { this.addError('Execution failed'); }
  async postExecution(ctx) { ctx.state.postRan = true; }
}

describe('AbstractEvent', () => {
  it('runs full lifecycle and mutates state', async () => {
    const event = new SuccessEvent({ value: 42 });
    const state = {};
    const result = await event.run(state, {});

    expect(result.state.value).toBe(42);
    expect(result.errors).toHaveLength(0);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('INFO');
  });

  it('short-circuits on preExecution error — execute is skipped', async () => {
    const event = new FailPreEvent();
    const state = {};
    const result = await event.run(state, {});

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('Invalid input');
    expect(result.state.touched).toBeUndefined();
  });

  it('short-circuits on execute error — postExecution is skipped', async () => {
    const event = new FailExecuteEvent();
    const state = {};
    const result = await event.run(state, {});

    expect(result.errors).toHaveLength(1);
    expect(result.state.postRan).toBeUndefined();
  });

  it('toLogEntry returns serializable record', () => {
    const event = new SuccessEvent({ x: 1 });
    event.addError('test error');
    const entry = event.toLogEntry();

    expect(entry.event).toBe('SuccessEvent');
    expect(entry.payload).toEqual({ x: 1 });
    expect(entry.timestamp).toBeDefined();
    expect(entry.errors).toHaveLength(1);
  });
});
