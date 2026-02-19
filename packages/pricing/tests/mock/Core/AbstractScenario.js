export class AbstractScenario {
  constructor(name, steps) {
    this.name = name;
    this.steps = steps;
    this.currentStepIndex = 0;
  }

  get currentStep() {
    return this.steps[this.currentStepIndex];
  }

  canDispatch(eventName) {
    if (eventName === 'AdvanceStep') return true;
    return this.currentStep.allows.includes(eventName);
  }

  advance(target) {
    if (target != null) {
      const idx = this.steps.findIndex(s => s.name === target);
      if (idx === -1) return { ok: false, error: `Unknown step: ${target}` };
      this.currentStepIndex = idx;
      return { ok: true, step: this.currentStep };
    }
    if (this.currentStepIndex >= this.steps.length - 1) {
      return { ok: false, error: 'Already at last step' };
    }
    this.currentStepIndex += 1;
    return { ok: true, step: this.currentStep };
  }

  reset() {
    this.currentStepIndex = 0;
  }
}
