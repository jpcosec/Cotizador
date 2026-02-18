export class EventBus {
  constructor(scenario, state, store) {
    this.scenario = scenario;
    this.state = state;
    this.store = store;
    this.history = [];
  }

  async dispatch(event) {
    if (!this.scenario.canDispatch(event.name)) {
      return {
        state: this.state,
        errors: [{
          event: event.name,
          message: `Event '${event.name}' not allowed in step '${this.scenario.currentStep.name}'`,
        }],
        messages: [],
      };
    }

    const result = await event.run(this.state, this.store);
    this.state = result.state;
    this.history.push(event.toLogEntry());
    return result;
  }

  getHistory() {
    return [...this.history];
  }
}
