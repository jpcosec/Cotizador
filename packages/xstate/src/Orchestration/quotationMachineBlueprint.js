// XState machine blueprint for the quotation application.
// Parallel regions design:
//   - Region 1: quotation_workflow (browse → quotation hierarchy)
//   - Region 2: database_management (closed ↔ open with substates)
// Database changes trigger full recalculation via CLOSE_DATABASE event.

export const quotationMachineBlueprint = {
  id: 'quotationApp',
  type: 'parallel',
  context: {
    // Shared across all states
    previousQuotations: [],

    // Domain model (Phase B)
    catalog: null,       // Catalog instance (loaded at INIT)
    basket: null,        // Basket instance (created/updated as quotation progresses)

    // Quotation context (used in quotation_workflow)
    quotation: null,
    lineas: [],
    totals: { subtotal: 0, taxes: [], total: 0 },
    store: null,
    messages: [],
    errors: [],

    // Database context
    databaseOpen: false,
    databaseUIState: null, // 'browse_database', 'modify_row', 'add_new_row'
    selectedRowId: null,
    selectedRowData: null,
  },

  states: {
    // ========== REGION 1: QUOTATION WORKFLOW ==========
    quotation_workflow: {
      id: 'quotation_workflow',
      initial: 'browse',

      states: {
        // -------- Browse Hub --------
        browse: {
          entry: ['initCatalog'],
          on: {
            VIEW_PREVIOUS_QUOTATIONS: { actions: ['listPreviousQuotations'] },
            START_NEW_QUOTATION: { target: 'quotation.initialize' },
            LOAD_QUOTATION: { target: 'quotation.basket', actions: ['loadPreviousQuotation'] },
          },
        },

        // -------- Quotation Hierarchy (initialize → basket → validation → completed) --------
        quotation: {
          id: 'quotation',
          initial: 'initialize',

          states: {
            // -------- Initialization --------
            initialize: {
              initial: 'chooseSource',
              states: {
                chooseSource: {
                  on: {
                    LOAD_PREVIOUS: { target: 'loadingPrevious' },
                    CREATE_NEW: { target: 'creatingNew' },
                  },
                },

                loadingPrevious: {
                  on: {
                    QUOTATION_LOADED: { target: '#quotation.basket', actions: ['initializeBasketFromLoaded'] },
                    ERROR: { target: '#quotation.error', actions: ['captureError'] },
                  },
                },

                creatingNew: {
                  on: {
                    QUOTATION_INITIALIZED: { target: '#quotation.basket', actions: ['initializeEmptyBasket'] },
                    ERROR: { target: '#quotation.error', actions: ['captureError'] },
                  },
                },
              },
            },

            // -------- Basket (Main editing state) --------
            basket: {
              on: {
                UPDATE_QUOTATION_SETTINGS: {
                  target: 'basket',
                  actions: ['updateQuotationSettings'],
                },

                ADD_ITEM: {
                  target: 'basket',
                  guard: 'canMutateBasket',
                  actions: ['addItem'],
                },

                UPDATE_ITEM: {
                  target: 'basket',
                  guard: 'canMutateBasket',
                  actions: ['updateItem'],
                },

                REMOVE_ITEM: {
                  target: 'basket',
                  guard: 'canMutateBasket',
                  actions: ['removeItem'],
                },

                ADVANCE_TO_VALIDATION: {
                  target: 'validation',
                  guard: 'canAdvanceToValidation',
                },

                RETURN_TO_BROWSE: {
                  target: '#quotation_workflow.browse',
                  actions: ['discardQuotation'],
                },
              },
            },

            // -------- Validation (Checkout) --------
            validation: {
              on: {
                VALIDATE_AND_SAVE: {
                  target: 'completed',
                  guard: 'canSaveQuotation',
                  actions: ['validateAndSave'],
                },

                BACK_TO_BASKET: {
                  target: 'basket',
                },
              },
            },

            // -------- Completed --------
            completed: {
              on: {
                RETURN_TO_BROWSE: {
                  target: '#quotation_workflow.browse',
                  actions: ['clearQuotationContext'],
                },
              },
            },

            // -------- Error --------
            error: {
              on: {
                RETRY: { target: 'basket' },
                RETURN_TO_BROWSE: { target: '#quotation_workflow.browse' },
              },
            },
          },
        },
      },
    },

    // ========== REGION 2: DATABASE MANAGEMENT ==========
    database_management: {
      id: 'database_management',
      initial: 'closed',

      states: {
        // -------- Closed State --------
        closed: {
          on: {
            OPEN_DATABASE: { target: 'open' },
          },
        },

        // -------- Open State (with substates) --------
        open: {
          initial: 'browse_database',

          states: {
            browse_database: {
              on: {
                SELECT_ROW_TO_MODIFY: {
                  target: 'modify_row',
                  actions: ['selectRowToModify'],
                },
                SELECT_ADD_NEW: {
                  target: 'add_new_row',
                },
              },
            },

            modify_row: {
              on: {
                SAVE_ROW: {
                  target: 'browse_database',
                  actions: ['saveRowModification'],
                },
                CANCEL: {
                  target: 'browse_database',
                  actions: ['cancelRowModification'],
                },
              },
            },

            add_new_row: {
              on: {
                SAVE_ROW: {
                  target: 'browse_database',
                  actions: ['saveNewRow'],
                },
                CANCEL: {
                  target: 'browse_database',
                  actions: ['cancelAddRow'],
                },
              },
            },
          },

          on: {
            CLOSE_DATABASE: {
              target: 'closed',
              actions: ['fullRecalculateOnDatabaseClose'],
            },
          },
        },
      },
    },
  },
};

// Adapter contract: all guards, actions, and services the machine expects
export const quotationMachineAdaptersContract = {
  guards: [
    'canMutateBasket',
    'canAdvanceToValidation',
    'canSaveQuotation',
  ],

  actions: [
    // Browse actions
    'listPreviousQuotations',
    'loadPreviousQuotation',

    // Initialization actions
    'initializeBasketFromLoaded',
    'initializeEmptyBasket',
    'captureError',

    // Basket mutation actions (thin adapters)
    'updateQuotationSettings',
    'addItem',
    'updateItem',
    'removeItem',
    'discardQuotation',

    // Validation action (thin adapter)
    'validateAndSave',

    // Context management
    'clearQuotationContext',

    // Database actions
    'selectRowToModify',
    'saveRowModification',
    'cancelRowModification',
    'saveNewRow',
    'cancelAddRow',
    'fullRecalculateOnDatabaseClose',
  ],

  services: [
    'saveQuotationService',
    'sendQuotationService',
  ],
};
