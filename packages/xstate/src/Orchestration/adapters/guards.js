// Guards for the quotation machine.
// All guards are pure functions of context and/or event — no side effects.

export const guards = {
  /**
   * Can mutate basket: quotation must be initialized.
   */
  canMutateBasket: ({ context }) =>
    context.quotation !== null,

  /**
   * Can advance to validation: quotation initialized + no blocking errors + has items.
   */
  canAdvanceToValidation: ({ context }) =>
    context.quotation !== null &&
    context.lineas.length > 0 &&
    !context.errors.some(e => e.blocking),

  /**
   * Can save quotation: all items valid + prices calculated (no blocking errors).
   */
  canSaveQuotation: ({ context }) =>
    context.quotation !== null &&
    context.lineas.length > 0 &&
    !context.errors.some(e => e.blocking),
};
