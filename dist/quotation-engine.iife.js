var QuotationEngine = (function (exports) {
  'use strict';

  function cloneValue(value) {
    if (value === null || value === undefined) return value;
    try {
      return structuredClone(value);
    } catch {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function statePath(value) {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return 'unknown';

    const out = [];
    function walk(node, prefix) {
      if (typeof node === 'string') {
        out.push(prefix ? `${prefix}.${node}` : node);
        return;
      }
      Object.entries(node).forEach(([key, child]) => {
        const next = prefix ? `${prefix}.${key}` : key;
        walk(child, next);
      });
    }

    walk(value, '');
    return out.join(' | ');
  }

  class AlpineXStateBridge {
    constructor(actor, alpineStore = {}, opts = {}) {
      if (!actor || typeof actor.getSnapshot !== 'function') {
        throw new Error('AlpineXStateBridge requires an actor with getSnapshot().');
      }

      this.actor = actor;
      this.alpineStore = alpineStore;
      this.opts = {
        autoStart: false,
        syncLineasAsCarrito: true,
        ...opts,
      };
      this.snapshot = actor.getSnapshot();
      this.unsubscribe = null;

      this.syncToAlpine();
    }

    start() {
      if (this.unsubscribe) return this;

      if (this.opts.autoStart && typeof this.actor.start === 'function') {
        this.actor.start();
      }

      const sub = this.actor.subscribe((snapshot) => {
        this.snapshot = snapshot;
        this.syncToAlpine();
      });

      this.unsubscribe = () => {
        if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
      };
      return this;
    }

    stop() {
      if (this.unsubscribe) this.unsubscribe();
      this.unsubscribe = null;
    }

    canSend(type) {
      if (!type) return false;
      if (this.snapshot && typeof this.snapshot.can === 'function') {
        return this.snapshot.can({ type });
      }
      return true;
    }

    send(type, payload = {}) {
      if (!this.canSend(type)) return false;
      this.actor.send({ type, ...payload });
      return true;
    }

    loadQuotation(cotizacionId) {
      if (!cotizacionId) return false;
      return this.send('LOAD_QUOTATION', { cotizacionId });
    }

    syncToAlpine() {
      const context = (this.snapshot && this.snapshot.context) || {};

      this.alpineStore.machineState = statePath(this.snapshot && this.snapshot.value);
      this.alpineStore.quotation = cloneValue(context.quotation || null);
      this.alpineStore.totalsSnapshot = cloneValue(context.totals || { subtotal: 0, taxes: [], total: 0 });
      this.alpineStore.messages = cloneValue(context.messages || []);
      this.alpineStore.errors = cloneValue(context.errors || []);
      this.alpineStore.previousQuotations = cloneValue(context.previousQuotations || []);
      this.alpineStore.databaseOpen = Boolean(context.databaseOpen);
      this.alpineStore.selectedRowData = cloneValue(context.selectedRowData || null);

      if (context.quotation && typeof context.quotation.paxGlobal === 'number') {
        this.alpineStore.paxGlobal = context.quotation.paxGlobal;
      }

      if (Array.isArray(context.catalogo)) {
        this.alpineStore.catalogo = cloneValue(context.catalogo);
      }

      if (this.opts.syncLineasAsCarrito) {
        this.alpineStore.carrito = this.mapLineasToCarrito(context.lineas || [], context.quotation);
      }
    }

    mapLineasToCarrito(lineas, quotation) {
      const fechaEvento = quotation && quotation.cotizacion ? quotation.cotizacion.Fecha_Evento : null;
      const paxDefault = quotation && typeof quotation.paxGlobal === 'number' ? quotation.paxGlobal : 1;

      return (lineas || [])
        .filter((linea) => !linea._removed)
        .map((linea, idx) => {
          const cantidad = linea.Override_Cantidad || linea.Override_Pax || linea._cantidad || linea._pax || paxDefault || 1;
          const total = linea._netoAjustado || linea._netoBase || 0;
          const precio = cantidad > 0 ? Math.round(total / cantidad) : total;

          return {
            id: linea.ID_Linea || linea.id || `LINA_${idx + 1}`,
            nombre: (linea._item && (linea._item.Nombre_Item || linea._item.Nombre)) || linea.Nombre_Item || linea.Nombre || linea.ID_Item || 'Item',
            categoria: (linea._item && linea._item.Categoria) || linea.Categoria || 'General',
            precio,
            cantidad,
            dia: linea.Dia || linea._dia || 1,
            fecha: linea.Fecha || linea._fecha || fechaEvento || '',
            hora: linea.Hora || linea._hora || '09:00',
            comentarios: linea.Comentarios || (linea._item && linea._item.Default_Glosa) || '',
            Comentarios: linea.Comentarios || (linea._item && linea._item.Default_Glosa) || '',
            total,
            lineId: linea.ID_Linea || linea.id || null,
            _raw: linea,
          };
        });
    }
  }

  if (typeof window !== 'undefined') {
    window.AlpineXStateBridge = AlpineXStateBridge;
  }

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
  function getGlobal() {
    if (typeof globalThis !== 'undefined') {
      return globalThis;
    }
    if (typeof self !== 'undefined') {
      return self;
    }
    if (typeof window !== 'undefined') {
      return window;
    }
    if (typeof global !== 'undefined') {
      return global;
    }
  }
  function getDevTools() {
    const w = getGlobal();
    if (w.__xstate__) {
      return w.__xstate__;
    }
    return undefined;
  }
  const devToolsAdapter = service => {
    if (typeof window === 'undefined') {
      return;
    }
    const devTools = getDevTools();
    if (devTools) {
      devTools.register(service);
    }
  };

  class Mailbox {
    constructor(_process) {
      this._process = _process;
      this._active = false;
      this._current = null;
      this._last = null;
    }
    start() {
      this._active = true;
      this.flush();
    }
    clear() {
      // we can't set _current to null because we might be currently processing
      // and enqueue following clear shouldn't start processing the enqueued item immediately
      if (this._current) {
        this._current.next = null;
        this._last = this._current;
      }
    }
    enqueue(event) {
      const enqueued = {
        value: event,
        next: null
      };
      if (this._current) {
        this._last.next = enqueued;
        this._last = enqueued;
        return;
      }
      this._current = enqueued;
      this._last = enqueued;
      if (this._active) {
        this.flush();
      }
    }
    flush() {
      while (this._current) {
        // atm the given _process is responsible for implementing proper try/catch handling
        // we assume here that this won't throw in a way that can affect this mailbox
        const consumed = this._current;
        this._process(consumed.value);
        this._current = consumed.next;
      }
      this._last = null;
    }
  }

  const STATE_DELIMITER = '.';
  const TARGETLESS_KEY = '';
  const NULL_EVENT = '';
  const STATE_IDENTIFIER$1 = '#';
  const WILDCARD = '*';
  const XSTATE_INIT = 'xstate.init';
  const XSTATE_STOP = 'xstate.stop';

  /**
   * Returns an event that represents an implicit event that is sent after the
   * specified `delay`.
   *
   * @param delayRef The delay in milliseconds
   * @param id The state node ID where this event is handled
   */
  function createAfterEvent(delayRef, id) {
    return {
      type: `xstate.after.${delayRef}.${id}`
    };
  }

  /**
   * Returns an event that represents that a final state node has been reached in
   * the parent state node.
   *
   * @param id The final state node's parent state node `id`
   * @param output The data to pass into the event
   */
  function createDoneStateEvent(id, output) {
    return {
      type: `xstate.done.state.${id}`,
      output
    };
  }

  /**
   * Returns an event that represents that an invoked service has terminated.
   *
   * An invoked service is terminated when it has reached a top-level final state
   * node, but not when it is canceled.
   *
   * @param invokeId The invoked service ID
   * @param output The data to pass into the event
   */
  function createDoneActorEvent(invokeId, output) {
    return {
      type: `xstate.done.actor.${invokeId}`,
      output,
      actorId: invokeId
    };
  }
  function createErrorActorEvent(id, error) {
    return {
      type: `xstate.error.actor.${id}`,
      error,
      actorId: id
    };
  }
  function createInitEvent(input) {
    return {
      type: XSTATE_INIT,
      input
    };
  }

  /**
   * This function makes sure that unhandled errors are thrown in a separate
   * macrotask. It allows those errors to be detected by global error handlers and
   * reported to bug tracking services without interrupting our own stack of
   * execution.
   *
   * @param err Error to be thrown
   */
  function reportUnhandledError(err) {
    setTimeout(() => {
      throw err;
    });
  }

  const symbolObservable = (() => typeof Symbol === 'function' && Symbol.observable || '@@observable')();

  function matchesState(parentStateId, childStateId) {
    const parentStateValue = toStateValue(parentStateId);
    const childStateValue = toStateValue(childStateId);
    if (typeof childStateValue === 'string') {
      if (typeof parentStateValue === 'string') {
        return childStateValue === parentStateValue;
      }

      // Parent more specific than child
      return false;
    }
    if (typeof parentStateValue === 'string') {
      return parentStateValue in childStateValue;
    }
    return Object.keys(parentStateValue).every(key => {
      if (!(key in childStateValue)) {
        return false;
      }
      return matchesState(parentStateValue[key], childStateValue[key]);
    });
  }
  function toStatePath(stateId) {
    if (isArray(stateId)) {
      return stateId;
    }
    const result = [];
    let segment = '';
    for (let i = 0; i < stateId.length; i++) {
      const char = stateId.charCodeAt(i);
      switch (char) {
        // \
        case 92:
          // consume the next character
          segment += stateId[i + 1];
          // and skip over it
          i++;
          continue;
        // .
        case 46:
          result.push(segment);
          segment = '';
          continue;
      }
      segment += stateId[i];
    }
    result.push(segment);
    return result;
  }
  function toStateValue(stateValue) {
    if (isMachineSnapshot(stateValue)) {
      return stateValue.value;
    }
    if (typeof stateValue !== 'string') {
      return stateValue;
    }
    const statePath = toStatePath(stateValue);
    return pathToStateValue(statePath);
  }
  function pathToStateValue(statePath) {
    if (statePath.length === 1) {
      return statePath[0];
    }
    const value = {};
    let marker = value;
    for (let i = 0; i < statePath.length - 1; i++) {
      if (i === statePath.length - 2) {
        marker[statePath[i]] = statePath[i + 1];
      } else {
        const previous = marker;
        marker = {};
        previous[statePath[i]] = marker;
      }
    }
    return value;
  }
  function mapValues(collection, iteratee) {
    const result = {};
    const collectionKeys = Object.keys(collection);
    for (let i = 0; i < collectionKeys.length; i++) {
      const key = collectionKeys[i];
      result[key] = iteratee(collection[key], key, collection, i);
    }
    return result;
  }
  function toArrayStrict(value) {
    if (isArray(value)) {
      return value;
    }
    return [value];
  }
  function toArray(value) {
    if (value === undefined) {
      return [];
    }
    return toArrayStrict(value);
  }
  function resolveOutput(mapper, context, event, self) {
    if (typeof mapper === 'function') {
      return mapper({
        context,
        event,
        self
      });
    }
    return mapper;
  }
  function isArray(value) {
    return Array.isArray(value);
  }
  function isErrorActorEvent(event) {
    return event.type.startsWith('xstate.error.actor');
  }
  function toTransitionConfigArray(configLike) {
    return toArrayStrict(configLike).map(transitionLike => {
      if (typeof transitionLike === 'undefined' || typeof transitionLike === 'string') {
        return {
          target: transitionLike
        };
      }
      return transitionLike;
    });
  }
  function normalizeTarget(target) {
    if (target === undefined || target === TARGETLESS_KEY) {
      return undefined;
    }
    return toArray(target);
  }
  function toObserver(nextHandler, errorHandler, completionHandler) {
    const isObserver = typeof nextHandler === 'object';
    const self = isObserver ? nextHandler : undefined;
    return {
      next: (isObserver ? nextHandler.next : nextHandler)?.bind(self),
      error: (isObserver ? nextHandler.error : errorHandler)?.bind(self),
      complete: (isObserver ? nextHandler.complete : completionHandler)?.bind(self)
    };
  }
  function createInvokeId(stateNodeId, index) {
    return `${index}.${stateNodeId}`;
  }
  function resolveReferencedActor(machine, src) {
    const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/);
    if (!match) {
      return machine.implementations.actors[src];
    }
    const [, indexStr, nodeId] = match;
    const node = machine.getStateNodeById(nodeId);
    const invokeConfig = node.config.invoke;
    return (Array.isArray(invokeConfig) ? invokeConfig[indexStr] : invokeConfig).src;
  }

  /**
   * Checks if an event type matches an event descriptor, supporting wildcards.
   * Event descriptors can be:
   *
   * - Exact matches: "event.type"
   * - Wildcard: "*"
   * - Partial matches: "event.*"
   *
   * @param eventType - The actual event type string
   * @param descriptor - The event descriptor to match against
   * @returns True if the event type matches the descriptor
   */
  function matchesEventDescriptor(eventType, descriptor) {
    if (descriptor === eventType) {
      return true;
    }
    if (descriptor === WILDCARD) {
      return true;
    }
    if (!descriptor.endsWith('.*')) {
      return false;
    }
    const partialEventTokens = descriptor.split('.');
    const eventTokens = eventType.split('.');
    for (let tokenIndex = 0; tokenIndex < partialEventTokens.length; tokenIndex++) {
      const partialEventToken = partialEventTokens[tokenIndex];
      const eventToken = eventTokens[tokenIndex];
      if (partialEventToken === '*') {
        const isLastToken = tokenIndex === partialEventTokens.length - 1;
        return isLastToken;
      }
      if (partialEventToken !== eventToken) {
        return false;
      }
    }
    return true;
  }

  function createScheduledEventId(actorRef, id) {
    return `${actorRef.sessionId}.${id}`;
  }
  let idCounter = 0;
  function createSystem(rootActor, options) {
    const children = new Map();
    const keyedActors = new Map();
    const reverseKeyedActors = new WeakMap();
    const inspectionObservers = new Set();
    const timerMap = {};
    const {
      clock,
      logger
    } = options;
    const scheduler = {
      schedule: (source, target, event, delay, id = Math.random().toString(36).slice(2)) => {
        const scheduledEvent = {
          source,
          target,
          event,
          delay,
          id,
          startedAt: Date.now()
        };
        const scheduledEventId = createScheduledEventId(source, id);
        system._snapshot._scheduledEvents[scheduledEventId] = scheduledEvent;
        const timeout = clock.setTimeout(() => {
          delete timerMap[scheduledEventId];
          delete system._snapshot._scheduledEvents[scheduledEventId];
          system._relay(source, target, event);
        }, delay);
        timerMap[scheduledEventId] = timeout;
      },
      cancel: (source, id) => {
        const scheduledEventId = createScheduledEventId(source, id);
        const timeout = timerMap[scheduledEventId];
        delete timerMap[scheduledEventId];
        delete system._snapshot._scheduledEvents[scheduledEventId];
        if (timeout !== undefined) {
          clock.clearTimeout(timeout);
        }
      },
      cancelAll: actorRef => {
        for (const scheduledEventId in system._snapshot._scheduledEvents) {
          const scheduledEvent = system._snapshot._scheduledEvents[scheduledEventId];
          if (scheduledEvent.source === actorRef) {
            scheduler.cancel(actorRef, scheduledEvent.id);
          }
        }
      }
    };
    const sendInspectionEvent = event => {
      if (!inspectionObservers.size) {
        return;
      }
      const resolvedInspectionEvent = {
        ...event,
        rootId: rootActor.sessionId
      };
      inspectionObservers.forEach(observer => observer.next?.(resolvedInspectionEvent));
    };
    const system = {
      _snapshot: {
        _scheduledEvents: (options?.snapshot && options.snapshot.scheduler) ?? {}
      },
      _bookId: () => `x:${idCounter++}`,
      _register: (sessionId, actorRef) => {
        children.set(sessionId, actorRef);
        return sessionId;
      },
      _unregister: actorRef => {
        children.delete(actorRef.sessionId);
        const systemId = reverseKeyedActors.get(actorRef);
        if (systemId !== undefined) {
          keyedActors.delete(systemId);
          reverseKeyedActors.delete(actorRef);
        }
      },
      get: systemId => {
        return keyedActors.get(systemId);
      },
      getAll: () => {
        return Object.fromEntries(keyedActors.entries());
      },
      _set: (systemId, actorRef) => {
        const existing = keyedActors.get(systemId);
        if (existing && existing !== actorRef) {
          throw new Error(`Actor with system ID '${systemId}' already exists.`);
        }
        keyedActors.set(systemId, actorRef);
        reverseKeyedActors.set(actorRef, systemId);
      },
      inspect: observerOrFn => {
        const observer = toObserver(observerOrFn);
        inspectionObservers.add(observer);
        return {
          unsubscribe() {
            inspectionObservers.delete(observer);
          }
        };
      },
      _sendInspectionEvent: sendInspectionEvent,
      _relay: (source, target, event) => {
        system._sendInspectionEvent({
          type: '@xstate.event',
          sourceRef: source,
          actorRef: target,
          event
        });
        target._send(event);
      },
      scheduler,
      getSnapshot: () => {
        return {
          _scheduledEvents: {
            ...system._snapshot._scheduledEvents
          }
        };
      },
      start: () => {
        const scheduledEvents = system._snapshot._scheduledEvents;
        system._snapshot._scheduledEvents = {};
        for (const scheduledId in scheduledEvents) {
          const {
            source,
            target,
            event,
            delay,
            id
          } = scheduledEvents[scheduledId];
          scheduler.schedule(source, target, event, delay, id);
        }
      },
      _clock: clock,
      _logger: logger
    };
    return system;
  }

  // those are needed to make JSDoc `@link` work properly

  let executingCustomAction = false;
  const $$ACTOR_TYPE = 1;

  // those values are currently used by @xstate/react directly so it's important to keep the assigned values in sync
  let ProcessingStatus = /*#__PURE__*/function (ProcessingStatus) {
    ProcessingStatus[ProcessingStatus["NotStarted"] = 0] = "NotStarted";
    ProcessingStatus[ProcessingStatus["Running"] = 1] = "Running";
    ProcessingStatus[ProcessingStatus["Stopped"] = 2] = "Stopped";
    return ProcessingStatus;
  }({});
  const defaultOptions = {
    clock: {
      setTimeout: (fn, ms) => {
        return setTimeout(fn, ms);
      },
      clearTimeout: id => {
        return clearTimeout(id);
      }
    },
    logger: console.log.bind(console),
    devTools: false
  };

  /**
   * An Actor is a running process that can receive events, send events and change
   * its behavior based on the events it receives, which can cause effects outside
   * of the actor. When you run a state machine, it becomes an actor.
   */
  class Actor {
    /**
     * Creates a new actor instance for the given logic with the provided options,
     * if any.
     *
     * @param logic The logic to create an actor from
     * @param options Actor options
     */
    constructor(logic, options) {
      this.logic = logic;
      /** The current internal state of the actor. */
      this._snapshot = void 0;
      /**
       * The clock that is responsible for setting and clearing timeouts, such as
       * delayed events and transitions.
       */
      this.clock = void 0;
      this.options = void 0;
      /** The unique identifier for this actor relative to its parent. */
      this.id = void 0;
      this.mailbox = new Mailbox(this._process.bind(this));
      this.observers = new Set();
      this.eventListeners = new Map();
      this.logger = void 0;
      /** @internal */
      this._processingStatus = ProcessingStatus.NotStarted;
      // Actor Ref
      this._parent = void 0;
      /** @internal */
      this._syncSnapshot = void 0;
      this.ref = void 0;
      // TODO: add typings for system
      this._actorScope = void 0;
      this.systemId = void 0;
      /** The globally unique process ID for this invocation. */
      this.sessionId = void 0;
      /** The system to which this actor belongs. */
      this.system = void 0;
      this._doneEvent = void 0;
      this.src = void 0;
      // array of functions to defer
      this._deferred = [];
      const resolvedOptions = {
        ...defaultOptions,
        ...options
      };
      const {
        clock,
        logger,
        parent,
        syncSnapshot,
        id,
        systemId,
        inspect
      } = resolvedOptions;
      this.system = parent ? parent.system : createSystem(this, {
        clock,
        logger
      });
      if (inspect && !parent) {
        // Always inspect at the system-level
        this.system.inspect(toObserver(inspect));
      }
      this.sessionId = this.system._bookId();
      this.id = id ?? this.sessionId;
      this.logger = options?.logger ?? this.system._logger;
      this.clock = options?.clock ?? this.system._clock;
      this._parent = parent;
      this._syncSnapshot = syncSnapshot;
      this.options = resolvedOptions;
      this.src = resolvedOptions.src ?? logic;
      this.ref = this;
      this._actorScope = {
        self: this,
        id: this.id,
        sessionId: this.sessionId,
        logger: this.logger,
        defer: fn => {
          this._deferred.push(fn);
        },
        system: this.system,
        stopChild: child => {
          if (child._parent !== this) {
            throw new Error(`Cannot stop child actor ${child.id} of ${this.id} because it is not a child`);
          }
          child._stop();
        },
        emit: emittedEvent => {
          const listeners = this.eventListeners.get(emittedEvent.type);
          const wildcardListener = this.eventListeners.get('*');
          if (!listeners && !wildcardListener) {
            return;
          }
          const allListeners = [...(listeners ? listeners.values() : []), ...(wildcardListener ? wildcardListener.values() : [])];
          for (const handler of allListeners) {
            try {
              handler(emittedEvent);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
        },
        actionExecutor: action => {
          const exec = () => {
            this._actorScope.system._sendInspectionEvent({
              type: '@xstate.action',
              actorRef: this,
              action: {
                type: action.type,
                params: action.params
              }
            });
            if (!action.exec) {
              return;
            }
            const saveExecutingCustomAction = executingCustomAction;
            try {
              executingCustomAction = true;
              action.exec(action.info, action.params);
            } finally {
              executingCustomAction = saveExecutingCustomAction;
            }
          };
          if (this._processingStatus === ProcessingStatus.Running) {
            exec();
          } else {
            this._deferred.push(exec);
          }
        }
      };

      // Ensure that the send method is bound to this Actor instance
      // if destructured
      this.send = this.send.bind(this);
      this.system._sendInspectionEvent({
        type: '@xstate.actor',
        actorRef: this
      });
      if (systemId) {
        this.systemId = systemId;
        this.system._set(systemId, this);
      }
      this._initState(options?.snapshot ?? options?.state);
      if (systemId && this._snapshot.status !== 'active') {
        this.system._unregister(this);
      }
    }
    _initState(persistedState) {
      try {
        this._snapshot = persistedState ? this.logic.restoreSnapshot ? this.logic.restoreSnapshot(persistedState, this._actorScope) : persistedState : this.logic.getInitialSnapshot(this._actorScope, this.options?.input);
      } catch (err) {
        // if we get here then it means that we assign a value to this._snapshot that is not of the correct type
        // we can't get the true `TSnapshot & { status: 'error'; }`, it's impossible
        // so right now this is a lie of sorts
        this._snapshot = {
          status: 'error',
          output: undefined,
          error: err
        };
      }
    }
    update(snapshot, event) {
      // Update state
      this._snapshot = snapshot;

      // Execute deferred effects
      let deferredFn;
      while (deferredFn = this._deferred.shift()) {
        try {
          deferredFn();
        } catch (err) {
          // this error can only be caught when executing *initial* actions
          // it's the only time when we call actions provided by the user through those deferreds
          // when the actor is already running we always execute them synchronously while transitioning
          // no "builtin deferred" should actually throw an error since they are either safe
          // or the control flow is passed through the mailbox and errors should be caught by the `_process` used by the mailbox
          this._deferred.length = 0;
          this._snapshot = {
            ...snapshot,
            status: 'error',
            error: err
          };
        }
      }
      switch (this._snapshot.status) {
        case 'active':
          for (const observer of this.observers) {
            try {
              observer.next?.(snapshot);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
          break;
        case 'done':
          // next observers are meant to be notified about done snapshots
          // this can be seen as something that is different from how observable work
          // but with observables `complete` callback is called without any arguments
          // it's more ergonomic for XState to treat a done snapshot as a "next" value
          // and the completion event as something that is separate,
          // something that merely follows emitting that done snapshot
          for (const observer of this.observers) {
            try {
              observer.next?.(snapshot);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
          this._stopProcedure();
          this._complete();
          this._doneEvent = createDoneActorEvent(this.id, this._snapshot.output);
          if (this._parent) {
            this.system._relay(this, this._parent, this._doneEvent);
          }
          break;
        case 'error':
          this._error(this._snapshot.error);
          break;
      }
      this.system._sendInspectionEvent({
        type: '@xstate.snapshot',
        actorRef: this,
        event,
        snapshot
      });
    }

    /**
     * Subscribe an observer to an actor’s snapshot values.
     *
     * @remarks
     * The observer will receive the actor’s snapshot value when it is emitted.
     * The observer can be:
     *
     * - A plain function that receives the latest snapshot, or
     * - An observer object whose `.next(snapshot)` method receives the latest
     *   snapshot
     *
     * @example
     *
     * ```ts
     * // Observer as a plain function
     * const subscription = actor.subscribe((snapshot) => {
     *   console.log(snapshot);
     * });
     * ```
     *
     * @example
     *
     * ```ts
     * // Observer as an object
     * const subscription = actor.subscribe({
     *   next(snapshot) {
     *     console.log(snapshot);
     *   },
     *   error(err) {
     *     // ...
     *   },
     *   complete() {
     *     // ...
     *   }
     * });
     * ```
     *
     * The return value of `actor.subscribe(observer)` is a subscription object
     * that has an `.unsubscribe()` method. You can call
     * `subscription.unsubscribe()` to unsubscribe the observer:
     *
     * @example
     *
     * ```ts
     * const subscription = actor.subscribe((snapshot) => {
     *   // ...
     * });
     *
     * // Unsubscribe the observer
     * subscription.unsubscribe();
     * ```
     *
     * When the actor is stopped, all of its observers will automatically be
     * unsubscribed.
     *
     * @param observer - Either a plain function that receives the latest
     *   snapshot, or an observer object whose `.next(snapshot)` method receives
     *   the latest snapshot
     */

    subscribe(nextListenerOrObserver, errorListener, completeListener) {
      const observer = toObserver(nextListenerOrObserver, errorListener, completeListener);
      if (this._processingStatus !== ProcessingStatus.Stopped) {
        this.observers.add(observer);
      } else {
        switch (this._snapshot.status) {
          case 'done':
            try {
              observer.complete?.();
            } catch (err) {
              reportUnhandledError(err);
            }
            break;
          case 'error':
            {
              const err = this._snapshot.error;
              if (!observer.error) {
                reportUnhandledError(err);
              } else {
                try {
                  observer.error(err);
                } catch (err) {
                  reportUnhandledError(err);
                }
              }
              break;
            }
        }
      }
      return {
        unsubscribe: () => {
          this.observers.delete(observer);
        }
      };
    }
    on(type, handler) {
      let listeners = this.eventListeners.get(type);
      if (!listeners) {
        listeners = new Set();
        this.eventListeners.set(type, listeners);
      }
      const wrappedHandler = handler.bind(undefined);
      listeners.add(wrappedHandler);
      return {
        unsubscribe: () => {
          listeners.delete(wrappedHandler);
        }
      };
    }

    /** Starts the Actor from the initial state */
    start() {
      if (this._processingStatus === ProcessingStatus.Running) {
        // Do not restart the service if it is already started
        return this;
      }
      if (this._syncSnapshot) {
        this.subscribe({
          next: snapshot => {
            if (snapshot.status === 'active') {
              this.system._relay(this, this._parent, {
                type: `xstate.snapshot.${this.id}`,
                snapshot
              });
            }
          },
          error: () => {}
        });
      }
      this.system._register(this.sessionId, this);
      if (this.systemId) {
        this.system._set(this.systemId, this);
      }
      this._processingStatus = ProcessingStatus.Running;

      // TODO: this isn't correct when rehydrating
      const initEvent = createInitEvent(this.options.input);
      this.system._sendInspectionEvent({
        type: '@xstate.event',
        sourceRef: this._parent,
        actorRef: this,
        event: initEvent
      });
      const status = this._snapshot.status;
      switch (status) {
        case 'done':
          // a state machine can be "done" upon initialization (it could reach a final state using initial microsteps)
          // we still need to complete observers, flush deferreds etc
          this.update(this._snapshot, initEvent);
          // TODO: rethink cleanup of observers, mailbox, etc
          return this;
        case 'error':
          this._error(this._snapshot.error);
          return this;
      }
      if (!this._parent) {
        this.system.start();
      }
      if (this.logic.start) {
        try {
          this.logic.start(this._snapshot, this._actorScope);
        } catch (err) {
          this._snapshot = {
            ...this._snapshot,
            status: 'error',
            error: err
          };
          this._error(err);
          return this;
        }
      }

      // TODO: this notifies all subscribers but usually this is redundant
      // there is no real change happening here
      // we need to rethink if this needs to be refactored
      this.update(this._snapshot, initEvent);
      if (this.options.devTools) {
        this.attachDevTools();
      }
      this.mailbox.start();
      return this;
    }
    _process(event) {
      let nextState;
      let caughtError;
      try {
        nextState = this.logic.transition(this._snapshot, event, this._actorScope);
      } catch (err) {
        // we wrap it in a box so we can rethrow it later even if falsy value gets caught here
        caughtError = {
          err
        };
      }
      if (caughtError) {
        const {
          err
        } = caughtError;
        this._snapshot = {
          ...this._snapshot,
          status: 'error',
          error: err
        };
        this._error(err);
        return;
      }
      this.update(nextState, event);
      if (event.type === XSTATE_STOP) {
        this._stopProcedure();
        this._complete();
      }
    }
    _stop() {
      if (this._processingStatus === ProcessingStatus.Stopped) {
        return this;
      }
      this.mailbox.clear();
      if (this._processingStatus === ProcessingStatus.NotStarted) {
        this._processingStatus = ProcessingStatus.Stopped;
        return this;
      }
      this.mailbox.enqueue({
        type: XSTATE_STOP
      });
      return this;
    }

    /** Stops the Actor and unsubscribe all listeners. */
    stop() {
      if (this._parent) {
        throw new Error('A non-root actor cannot be stopped directly.');
      }
      return this._stop();
    }
    _complete() {
      for (const observer of this.observers) {
        try {
          observer.complete?.();
        } catch (err) {
          reportUnhandledError(err);
        }
      }
      this.observers.clear();
      this.eventListeners.clear();
    }
    _reportError(err) {
      if (!this.observers.size) {
        if (!this._parent) {
          reportUnhandledError(err);
        }
        this.eventListeners.clear();
        return;
      }
      let reportError = false;
      for (const observer of this.observers) {
        const errorListener = observer.error;
        reportError ||= !errorListener;
        try {
          errorListener?.(err);
        } catch (err2) {
          reportUnhandledError(err2);
        }
      }
      this.observers.clear();
      this.eventListeners.clear();
      if (reportError) {
        reportUnhandledError(err);
      }
    }
    _error(err) {
      this._stopProcedure();
      this._reportError(err);
      if (this._parent) {
        this.system._relay(this, this._parent, createErrorActorEvent(this.id, err));
      }
    }
    // TODO: atm children don't belong entirely to the actor so
    // in a way - it's not even super aware of them
    // so we can't stop them from here but we really should!
    // right now, they are being stopped within the machine's transition
    // but that could throw and leave us with "orphaned" active actors
    _stopProcedure() {
      if (this._processingStatus !== ProcessingStatus.Running) {
        // Actor already stopped; do nothing
        return this;
      }

      // Cancel all delayed events
      this.system.scheduler.cancelAll(this);

      // TODO: mailbox.reset
      this.mailbox.clear();
      // TODO: after `stop` we must prepare ourselves for receiving events again
      // events sent *after* stop signal must be queued
      // it seems like this should be the common behavior for all of our consumers
      // so perhaps this should be unified somehow for all of them
      this.mailbox = new Mailbox(this._process.bind(this));
      this._processingStatus = ProcessingStatus.Stopped;
      this.system._unregister(this);
      return this;
    }

    /** @internal */
    _send(event) {
      if (this._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      this.mailbox.enqueue(event);
    }

    /**
     * Sends an event to the running Actor to trigger a transition.
     *
     * @param event The event to send
     */
    send(event) {
      this.system._relay(undefined, this, event);
    }
    attachDevTools() {
      const {
        devTools
      } = this.options;
      if (devTools) {
        const resolvedDevToolsAdapter = typeof devTools === 'function' ? devTools : devToolsAdapter;
        resolvedDevToolsAdapter(this);
      }
    }
    toJSON() {
      return {
        xstate$$type: $$ACTOR_TYPE,
        id: this.id
      };
    }

    /**
     * Obtain the internal state of the actor, which can be persisted.
     *
     * @remarks
     * The internal state can be persisted from any actor, not only machines.
     *
     * Note that the persisted state is not the same as the snapshot from
     * {@link Actor.getSnapshot}. Persisted state represents the internal state of
     * the actor, while snapshots represent the actor's last emitted value.
     *
     * Can be restored with {@link ActorOptions.state}
     * @see https://stately.ai/docs/persistence
     */

    getPersistedSnapshot(options) {
      return this.logic.getPersistedSnapshot(this._snapshot, options);
    }
    [symbolObservable]() {
      return this;
    }

    /**
     * Read an actor’s snapshot synchronously.
     *
     * @remarks
     * The snapshot represent an actor's last emitted value.
     *
     * When an actor receives an event, its internal state may change. An actor
     * may emit a snapshot when a state transition occurs.
     *
     * Note that some actors, such as callback actors generated with
     * `fromCallback`, will not emit snapshots.
     * @see {@link Actor.subscribe} to subscribe to an actor’s snapshot values.
     * @see {@link Actor.getPersistedSnapshot} to persist the internal state of an actor (which is more than just a snapshot).
     */
    getSnapshot() {
      return this._snapshot;
    }
  }
  /**
   * Creates a new actor instance for the given actor logic with the provided
   * options, if any.
   *
   * @remarks
   * When you create an actor from actor logic via `createActor(logic)`, you
   * implicitly create an actor system where the created actor is the root actor.
   * Any actors spawned from this root actor and its descendants are part of that
   * actor system.
   * @example
   *
   * ```ts
   * import { createActor } from 'xstate';
   * import { someActorLogic } from './someActorLogic.ts';
   *
   * // Creating the actor, which implicitly creates an actor system with itself as the root actor
   * const actor = createActor(someActorLogic);
   *
   * actor.subscribe((snapshot) => {
   *   console.log(snapshot);
   * });
   *
   * // Actors must be started by calling `actor.start()`, which will also start the actor system.
   * actor.start();
   *
   * // Actors can receive events
   * actor.send({ type: 'someEvent' });
   *
   * // You can stop root actors by calling `actor.stop()`, which will also stop the actor system and all actors in that system.
   * actor.stop();
   * ```
   *
   * @param logic - The actor logic to create an actor from. For a state machine
   *   actor logic creator, see {@link createMachine}. Other actor logic creators
   *   include {@link fromCallback}, {@link fromEventObservable},
   *   {@link fromObservable}, {@link fromPromise}, and {@link fromTransition}.
   * @param options - Actor options
   */
  function createActor(logic, ...[options]) {
    return new Actor(logic, options);
  }

  /**
   * @deprecated Use `Actor` instead.
   * @alias
   */

  function resolveCancel(_, snapshot, actionArgs, actionParams, {
    sendId
  }) {
    const resolvedSendId = typeof sendId === 'function' ? sendId(actionArgs, actionParams) : sendId;
    return [snapshot, {
      sendId: resolvedSendId
    }, undefined];
  }
  function executeCancel(actorScope, params) {
    actorScope.defer(() => {
      actorScope.system.scheduler.cancel(actorScope.self, params.sendId);
    });
  }
  /**
   * Cancels a delayed `sendTo(...)` action that is waiting to be executed. The
   * canceled `sendTo(...)` action will not send its event or execute, unless the
   * `delay` has already elapsed before `cancel(...)` is called.
   *
   * @example
   *
   * ```ts
   * import { createMachine, sendTo, cancel } from 'xstate';
   *
   * const machine = createMachine({
   *   // ...
   *   on: {
   *     sendEvent: {
   *       actions: sendTo(
   *         'some-actor',
   *         { type: 'someEvent' },
   *         {
   *           id: 'some-id',
   *           delay: 1000
   *         }
   *       )
   *     },
   *     cancelEvent: {
   *       actions: cancel('some-id')
   *     }
   *   }
   * });
   * ```
   *
   * @param sendId The `id` of the `sendTo(...)` action to cancel.
   */
  function cancel(sendId) {
    function cancel(_args, _params) {
    }
    cancel.type = 'xstate.cancel';
    cancel.sendId = sendId;
    cancel.resolve = resolveCancel;
    cancel.execute = executeCancel;
    return cancel;
  }

  function resolveSpawn(actorScope, snapshot, actionArgs, _actionParams, {
    id,
    systemId,
    src,
    input,
    syncSnapshot
  }) {
    const logic = typeof src === 'string' ? resolveReferencedActor(snapshot.machine, src) : src;
    const resolvedId = typeof id === 'function' ? id(actionArgs) : id;
    let actorRef;
    let resolvedInput = undefined;
    if (logic) {
      resolvedInput = typeof input === 'function' ? input({
        context: snapshot.context,
        event: actionArgs.event,
        self: actorScope.self
      }) : input;
      actorRef = createActor(logic, {
        id: resolvedId,
        src,
        parent: actorScope.self,
        syncSnapshot,
        systemId,
        input: resolvedInput
      });
    }
    return [cloneMachineSnapshot(snapshot, {
      children: {
        ...snapshot.children,
        [resolvedId]: actorRef
      }
    }), {
      id,
      systemId,
      actorRef,
      src,
      input: resolvedInput
    }, undefined];
  }
  function executeSpawn(actorScope, {
    actorRef
  }) {
    if (!actorRef) {
      return;
    }
    actorScope.defer(() => {
      if (actorRef._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      actorRef.start();
    });
  }
  function spawnChild(...[src, {
    id,
    systemId,
    input,
    syncSnapshot = false
  } = {}]) {
    function spawnChild(_args, _params) {
    }
    spawnChild.type = 'xstate.spawnChild';
    spawnChild.id = id;
    spawnChild.systemId = systemId;
    spawnChild.src = src;
    spawnChild.input = input;
    spawnChild.syncSnapshot = syncSnapshot;
    spawnChild.resolve = resolveSpawn;
    spawnChild.execute = executeSpawn;
    return spawnChild;
  }

  function resolveStop(_, snapshot, args, actionParams, {
    actorRef
  }) {
    const actorRefOrString = typeof actorRef === 'function' ? actorRef(args, actionParams) : actorRef;
    const resolvedActorRef = typeof actorRefOrString === 'string' ? snapshot.children[actorRefOrString] : actorRefOrString;
    let children = snapshot.children;
    if (resolvedActorRef) {
      children = {
        ...children
      };
      delete children[resolvedActorRef.id];
    }
    return [cloneMachineSnapshot(snapshot, {
      children
    }), resolvedActorRef, undefined];
  }
  function unregisterRecursively(actorScope, actorRef) {
    // unregister children first (depth-first)
    const snapshot = actorRef.getSnapshot();
    if (snapshot && 'children' in snapshot) {
      for (const child of Object.values(snapshot.children)) {
        unregisterRecursively(actorScope, child);
      }
    }
    actorScope.system._unregister(actorRef);
  }
  function executeStop(actorScope, actorRef) {
    if (!actorRef) {
      return;
    }

    // we need to eagerly unregister it here so a new actor with the same systemId can be registered immediately
    // since we defer actual stopping of the actor but we don't defer actor creations (and we can't do that)
    // this could throw on `systemId` collision, for example, when dealing with reentering transitions
    // we also need to recursively unregister all nested children's systemIds
    unregisterRecursively(actorScope, actorRef);

    // this allows us to prevent an actor from being started if it gets stopped within the same macrostep
    // this can happen, for example, when the invoking state is being exited immediately by an always transition
    if (actorRef._processingStatus !== ProcessingStatus.Running) {
      actorScope.stopChild(actorRef);
      return;
    }
    // stopping a child enqueues a stop event in the child actor's mailbox
    // we need for all of the already enqueued events to be processed before we stop the child
    // the parent itself might want to send some events to a child (for example from exit actions on the invoking state)
    // and we don't want to ignore those events
    actorScope.defer(() => {
      actorScope.stopChild(actorRef);
    });
  }
  /**
   * Stops a child actor.
   *
   * @param actorRef The actor to stop.
   */
  function stopChild(actorRef) {
    function stop(_args, _params) {
    }
    stop.type = 'xstate.stopChild';
    stop.actorRef = actorRef;
    stop.resolve = resolveStop;
    stop.execute = executeStop;
    return stop;
  }

  // TODO: throw on cycles (depth check should be enough)
  function evaluateGuard(guard, context, event, snapshot) {
    const {
      machine
    } = snapshot;
    const isInline = typeof guard === 'function';
    const resolved = isInline ? guard : machine.implementations.guards[typeof guard === 'string' ? guard : guard.type];
    if (!isInline && !resolved) {
      throw new Error(`Guard '${typeof guard === 'string' ? guard : guard.type}' is not implemented.'.`);
    }
    if (typeof resolved !== 'function') {
      return evaluateGuard(resolved, context, event, snapshot);
    }
    const guardArgs = {
      context,
      event
    };
    const guardParams = isInline || typeof guard === 'string' ? undefined : 'params' in guard ? typeof guard.params === 'function' ? guard.params({
      context,
      event
    }) : guard.params : undefined;
    if (!('check' in resolved)) {
      // the existing type of `.guards` assumes non-nullable `TExpressionGuard`
      // inline guards expect `TExpressionGuard` to be set to `undefined`
      // it's fine to cast this here, our logic makes sure that we call those 2 "variants" correctly
      return resolved(guardArgs, guardParams);
    }
    const builtinGuard = resolved;
    return builtinGuard.check(snapshot, guardArgs, resolved // this holds all params
    );
  }

  function isAtomicStateNode(stateNode) {
    return stateNode.type === 'atomic' || stateNode.type === 'final';
  }
  function getChildren(stateNode) {
    return Object.values(stateNode.states).filter(sn => sn.type !== 'history');
  }
  function getProperAncestors(stateNode, toStateNode) {
    const ancestors = [];
    if (toStateNode === stateNode) {
      return ancestors;
    }

    // add all ancestors
    let m = stateNode.parent;
    while (m && m !== toStateNode) {
      ancestors.push(m);
      m = m.parent;
    }
    return ancestors;
  }
  function getAllStateNodes(stateNodes) {
    const nodeSet = new Set(stateNodes);
    const adjList = getAdjList(nodeSet);

    // add descendants
    for (const s of nodeSet) {
      // if previously active, add existing child nodes
      if (s.type === 'compound' && (!adjList.get(s) || !adjList.get(s).length)) {
        getInitialStateNodesWithTheirAncestors(s).forEach(sn => nodeSet.add(sn));
      } else {
        if (s.type === 'parallel') {
          for (const child of getChildren(s)) {
            if (child.type === 'history') {
              continue;
            }
            if (!nodeSet.has(child)) {
              const initialStates = getInitialStateNodesWithTheirAncestors(child);
              for (const initialStateNode of initialStates) {
                nodeSet.add(initialStateNode);
              }
            }
          }
        }
      }
    }

    // add all ancestors
    for (const s of nodeSet) {
      let m = s.parent;
      while (m) {
        nodeSet.add(m);
        m = m.parent;
      }
    }
    return nodeSet;
  }
  function getValueFromAdj(baseNode, adjList) {
    const childStateNodes = adjList.get(baseNode);
    if (!childStateNodes) {
      return {}; // todo: fix?
    }
    if (baseNode.type === 'compound') {
      const childStateNode = childStateNodes[0];
      if (childStateNode) {
        if (isAtomicStateNode(childStateNode)) {
          return childStateNode.key;
        }
      } else {
        return {};
      }
    }
    const stateValue = {};
    for (const childStateNode of childStateNodes) {
      stateValue[childStateNode.key] = getValueFromAdj(childStateNode, adjList);
    }
    return stateValue;
  }
  function getAdjList(stateNodes) {
    const adjList = new Map();
    for (const s of stateNodes) {
      if (!adjList.has(s)) {
        adjList.set(s, []);
      }
      if (s.parent) {
        if (!adjList.has(s.parent)) {
          adjList.set(s.parent, []);
        }
        adjList.get(s.parent).push(s);
      }
    }
    return adjList;
  }
  function getStateValue(rootNode, stateNodes) {
    const config = getAllStateNodes(stateNodes);
    return getValueFromAdj(rootNode, getAdjList(config));
  }
  function isInFinalState(stateNodeSet, stateNode) {
    if (stateNode.type === 'compound') {
      return getChildren(stateNode).some(s => s.type === 'final' && stateNodeSet.has(s));
    }
    if (stateNode.type === 'parallel') {
      return getChildren(stateNode).every(sn => isInFinalState(stateNodeSet, sn));
    }
    return stateNode.type === 'final';
  }
  const isStateId = str => str[0] === STATE_IDENTIFIER$1;
  function getCandidates(stateNode, receivedEventType) {
    const candidates = stateNode.transitions.get(receivedEventType) || [...stateNode.transitions.keys()].filter(eventDescriptor => matchesEventDescriptor(receivedEventType, eventDescriptor)).sort((a, b) => b.length - a.length).flatMap(key => stateNode.transitions.get(key));
    return candidates;
  }

  /** All delayed transitions from the config. */
  function getDelayedTransitions(stateNode) {
    const afterConfig = stateNode.config.after;
    if (!afterConfig) {
      return [];
    }
    const mutateEntryExit = delay => {
      const afterEvent = createAfterEvent(delay, stateNode.id);
      const eventType = afterEvent.type;
      stateNode.entry.push(raise(afterEvent, {
        id: eventType,
        delay
      }));
      stateNode.exit.push(cancel(eventType));
      return eventType;
    };
    const delayedTransitions = Object.keys(afterConfig).flatMap(delay => {
      const configTransition = afterConfig[delay];
      const resolvedTransition = typeof configTransition === 'string' ? {
        target: configTransition
      } : configTransition;
      const resolvedDelay = Number.isNaN(+delay) ? delay : +delay;
      const eventType = mutateEntryExit(resolvedDelay);
      return toArray(resolvedTransition).map(transition => ({
        ...transition,
        event: eventType,
        delay: resolvedDelay
      }));
    });
    return delayedTransitions.map(delayedTransition => {
      const {
        delay
      } = delayedTransition;
      return {
        ...formatTransition(stateNode, delayedTransition.event, delayedTransition),
        delay
      };
    });
  }
  function formatTransition(stateNode, descriptor, transitionConfig) {
    const normalizedTarget = normalizeTarget(transitionConfig.target);
    const reenter = transitionConfig.reenter ?? false;
    const target = resolveTarget(stateNode, normalizedTarget);
    const transition = {
      ...transitionConfig,
      actions: toArray(transitionConfig.actions),
      guard: transitionConfig.guard,
      target,
      source: stateNode,
      reenter,
      eventType: descriptor,
      toJSON: () => ({
        ...transition,
        source: `#${stateNode.id}`,
        target: target ? target.map(t => `#${t.id}`) : undefined
      })
    };
    return transition;
  }
  function formatTransitions(stateNode) {
    const transitions = new Map();
    if (stateNode.config.on) {
      for (const descriptor of Object.keys(stateNode.config.on)) {
        if (descriptor === NULL_EVENT) {
          throw new Error('Null events ("") cannot be specified as a transition key. Use `always: { ... }` instead.');
        }
        const transitionsConfig = stateNode.config.on[descriptor];
        transitions.set(descriptor, toTransitionConfigArray(transitionsConfig).map(t => formatTransition(stateNode, descriptor, t)));
      }
    }
    if (stateNode.config.onDone) {
      const descriptor = `xstate.done.state.${stateNode.id}`;
      transitions.set(descriptor, toTransitionConfigArray(stateNode.config.onDone).map(t => formatTransition(stateNode, descriptor, t)));
    }
    for (const invokeDef of stateNode.invoke) {
      if (invokeDef.onDone) {
        const descriptor = `xstate.done.actor.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onDone).map(t => formatTransition(stateNode, descriptor, t)));
      }
      if (invokeDef.onError) {
        const descriptor = `xstate.error.actor.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onError).map(t => formatTransition(stateNode, descriptor, t)));
      }
      if (invokeDef.onSnapshot) {
        const descriptor = `xstate.snapshot.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onSnapshot).map(t => formatTransition(stateNode, descriptor, t)));
      }
    }
    for (const delayedTransition of stateNode.after) {
      let existing = transitions.get(delayedTransition.eventType);
      if (!existing) {
        existing = [];
        transitions.set(delayedTransition.eventType, existing);
      }
      existing.push(delayedTransition);
    }
    return transitions;
  }

  /**
   * Collects route transitions from all descendants with explicit IDs. Called
   * once on the root node to avoid O(N²) repeated traversals.
   */
  function formatRouteTransitions(rootStateNode) {
    const routeTransitions = [];
    const collectRoutes = states => {
      Object.values(states).forEach(sn => {
        if (sn.config.route && sn.config.id) {
          const routeId = sn.config.id;
          const userGuard = sn.config.route.guard;
          const routeGuard = (args, params) => {
            if (args.event.to !== `#${routeId}`) {
              return false;
            }
            if (!userGuard) {
              return true;
            }
            if (typeof userGuard === 'function') {
              return userGuard(args, params);
            }
            return true;
          };
          const transition = {
            ...sn.config.route,
            guard: routeGuard,
            target: `#${routeId}`
          };
          routeTransitions.push(formatTransition(rootStateNode, 'xstate.route', transition));
        }
        if (sn.states) {
          collectRoutes(sn.states);
        }
      });
    };
    collectRoutes(rootStateNode.states);
    if (routeTransitions.length > 0) {
      rootStateNode.transitions.set('xstate.route', routeTransitions);
    }
  }
  function formatInitialTransition(stateNode, _target) {
    const resolvedTarget = typeof _target === 'string' ? stateNode.states[_target] : _target ? stateNode.states[_target.target] : undefined;
    if (!resolvedTarget && _target) {
      throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
      `Initial state node "${_target}" not found on parent state node #${stateNode.id}`);
    }
    const transition = {
      source: stateNode,
      actions: !_target || typeof _target === 'string' ? [] : toArray(_target.actions),
      eventType: null,
      reenter: false,
      target: resolvedTarget ? [resolvedTarget] : [],
      toJSON: () => ({
        ...transition,
        source: `#${stateNode.id}`,
        target: resolvedTarget ? [`#${resolvedTarget.id}`] : []
      })
    };
    return transition;
  }
  function resolveTarget(stateNode, targets) {
    if (targets === undefined) {
      // an undefined target signals that the state node should not transition from that state when receiving that event
      return undefined;
    }
    return targets.map(target => {
      if (typeof target !== 'string') {
        return target;
      }
      if (isStateId(target)) {
        return stateNode.machine.getStateNodeById(target);
      }
      const isInternalTarget = target[0] === STATE_DELIMITER;
      // If internal target is defined on machine,
      // do not include machine key on target
      if (isInternalTarget && !stateNode.parent) {
        return getStateNodeByPath(stateNode, target.slice(1));
      }
      const resolvedTarget = isInternalTarget ? stateNode.key + target : target;
      if (stateNode.parent) {
        try {
          const targetStateNode = getStateNodeByPath(stateNode.parent, resolvedTarget);
          return targetStateNode;
        } catch (err) {
          throw new Error(`Invalid transition definition for state node '${stateNode.id}':\n${err.message}`);
        }
      } else {
        throw new Error(`Invalid target: "${target}" is not a valid target from the root node. Did you mean ".${target}"?`);
      }
    });
  }
  function resolveHistoryDefaultTransition(stateNode) {
    const normalizedTarget = normalizeTarget(stateNode.config.target);
    if (!normalizedTarget) {
      return stateNode.parent.initial;
    }
    return {
      target: normalizedTarget.map(t => typeof t === 'string' ? getStateNodeByPath(stateNode.parent, t) : t)
    };
  }
  function isHistoryNode(stateNode) {
    return stateNode.type === 'history';
  }
  function getInitialStateNodesWithTheirAncestors(stateNode) {
    const states = getInitialStateNodes(stateNode);
    for (const initialState of states) {
      for (const ancestor of getProperAncestors(initialState, stateNode)) {
        states.add(ancestor);
      }
    }
    return states;
  }
  function getInitialStateNodes(stateNode) {
    const set = new Set();
    function iter(descStateNode) {
      if (set.has(descStateNode)) {
        return;
      }
      set.add(descStateNode);
      if (descStateNode.type === 'compound') {
        iter(descStateNode.initial.target[0]);
      } else if (descStateNode.type === 'parallel') {
        for (const child of getChildren(descStateNode)) {
          iter(child);
        }
      }
    }
    iter(stateNode);
    return set;
  }
  /** Returns the child state node from its relative `stateKey`, or throws. */
  function getStateNode(stateNode, stateKey) {
    if (isStateId(stateKey)) {
      return stateNode.machine.getStateNodeById(stateKey);
    }
    if (!stateNode.states) {
      throw new Error(`Unable to retrieve child state '${stateKey}' from '${stateNode.id}'; no child states exist.`);
    }
    const result = stateNode.states[stateKey];
    if (!result) {
      throw new Error(`Child state '${stateKey}' does not exist on '${stateNode.id}'`);
    }
    return result;
  }

  /**
   * Returns the relative state node from the given `statePath`, or throws.
   *
   * @param statePath The string or string array relative path to the state node.
   */
  function getStateNodeByPath(stateNode, statePath) {
    if (typeof statePath === 'string' && isStateId(statePath)) {
      try {
        return stateNode.machine.getStateNodeById(statePath);
      } catch {
        // try individual paths
        // throw e;
      }
    }
    const arrayStatePath = toStatePath(statePath).slice();
    let currentStateNode = stateNode;
    while (arrayStatePath.length) {
      const key = arrayStatePath.shift();
      if (!key.length) {
        break;
      }
      currentStateNode = getStateNode(currentStateNode, key);
    }
    return currentStateNode;
  }

  /**
   * Returns the state nodes represented by the current state value.
   *
   * @param stateValue The state value or State instance
   */
  function getStateNodes(stateNode, stateValue) {
    if (typeof stateValue === 'string') {
      const childStateNode = stateNode.states[stateValue];
      if (!childStateNode) {
        throw new Error(`State '${stateValue}' does not exist on '${stateNode.id}'`);
      }
      return [stateNode, childStateNode];
    }
    const childStateKeys = Object.keys(stateValue);
    const childStateNodes = childStateKeys.map(subStateKey => getStateNode(stateNode, subStateKey)).filter(Boolean);
    return [stateNode.machine.root, stateNode].concat(childStateNodes, childStateKeys.reduce((allSubStateNodes, subStateKey) => {
      const subStateNode = getStateNode(stateNode, subStateKey);
      if (!subStateNode) {
        return allSubStateNodes;
      }
      const subStateNodes = getStateNodes(subStateNode, stateValue[subStateKey]);
      return allSubStateNodes.concat(subStateNodes);
    }, []));
  }
  function transitionAtomicNode(stateNode, stateValue, snapshot, event) {
    const childStateNode = getStateNode(stateNode, stateValue);
    const next = childStateNode.next(snapshot, event);
    if (!next || !next.length) {
      return stateNode.next(snapshot, event);
    }
    return next;
  }
  function transitionCompoundNode(stateNode, stateValue, snapshot, event) {
    const subStateKeys = Object.keys(stateValue);
    const childStateNode = getStateNode(stateNode, subStateKeys[0]);
    const next = transitionNode(childStateNode, stateValue[subStateKeys[0]], snapshot, event);
    if (!next || !next.length) {
      return stateNode.next(snapshot, event);
    }
    return next;
  }
  function transitionParallelNode(stateNode, stateValue, snapshot, event) {
    const allInnerTransitions = [];
    for (const subStateKey of Object.keys(stateValue)) {
      const subStateValue = stateValue[subStateKey];
      if (!subStateValue) {
        continue;
      }
      const subStateNode = getStateNode(stateNode, subStateKey);
      const innerTransitions = transitionNode(subStateNode, subStateValue, snapshot, event);
      if (innerTransitions) {
        allInnerTransitions.push(...innerTransitions);
      }
    }
    if (!allInnerTransitions.length) {
      return stateNode.next(snapshot, event);
    }
    return allInnerTransitions;
  }
  function transitionNode(stateNode, stateValue, snapshot, event) {
    // leaf node
    if (typeof stateValue === 'string') {
      return transitionAtomicNode(stateNode, stateValue, snapshot, event);
    }

    // compound node
    if (Object.keys(stateValue).length === 1) {
      return transitionCompoundNode(stateNode, stateValue, snapshot, event);
    }

    // parallel node
    return transitionParallelNode(stateNode, stateValue, snapshot, event);
  }
  function getHistoryNodes(stateNode) {
    return Object.keys(stateNode.states).map(key => stateNode.states[key]).filter(sn => sn.type === 'history');
  }
  function isDescendant(childStateNode, parentStateNode) {
    let marker = childStateNode;
    while (marker.parent && marker.parent !== parentStateNode) {
      marker = marker.parent;
    }
    return marker.parent === parentStateNode;
  }
  function hasIntersection(s1, s2) {
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    for (const item of set1) {
      if (set2.has(item)) {
        return true;
      }
    }
    for (const item of set2) {
      if (set1.has(item)) {
        return true;
      }
    }
    return false;
  }
  function removeConflictingTransitions(enabledTransitions, stateNodeSet, historyValue) {
    const filteredTransitions = new Set();
    for (const t1 of enabledTransitions) {
      let t1Preempted = false;
      const transitionsToRemove = new Set();
      for (const t2 of filteredTransitions) {
        if (hasIntersection(computeExitSet([t1], stateNodeSet, historyValue), computeExitSet([t2], stateNodeSet, historyValue))) {
          if (isDescendant(t1.source, t2.source)) {
            transitionsToRemove.add(t2);
          } else {
            t1Preempted = true;
            break;
          }
        }
      }
      if (!t1Preempted) {
        for (const t3 of transitionsToRemove) {
          filteredTransitions.delete(t3);
        }
        filteredTransitions.add(t1);
      }
    }
    return Array.from(filteredTransitions);
  }
  function findLeastCommonAncestor(stateNodes) {
    const [head, ...tail] = stateNodes;
    for (const ancestor of getProperAncestors(head, undefined)) {
      if (tail.every(sn => isDescendant(sn, ancestor))) {
        return ancestor;
      }
    }
  }
  function getEffectiveTargetStates(transition, historyValue) {
    if (!transition.target) {
      return [];
    }
    const targets = new Set();
    for (const targetNode of transition.target) {
      if (isHistoryNode(targetNode)) {
        if (historyValue[targetNode.id]) {
          for (const node of historyValue[targetNode.id]) {
            targets.add(node);
          }
        } else {
          for (const node of getEffectiveTargetStates(resolveHistoryDefaultTransition(targetNode), historyValue)) {
            targets.add(node);
          }
        }
      } else {
        targets.add(targetNode);
      }
    }
    return [...targets];
  }
  function getTransitionDomain(transition, historyValue) {
    const targetStates = getEffectiveTargetStates(transition, historyValue);
    if (!targetStates) {
      return;
    }
    if (!transition.reenter && targetStates.every(target => target === transition.source || isDescendant(target, transition.source))) {
      return transition.source;
    }
    const lca = findLeastCommonAncestor(targetStates.concat(transition.source));
    if (lca) {
      return lca;
    }

    // at this point we know that it's a root transition since LCA couldn't be found
    if (transition.reenter) {
      return;
    }
    return transition.source.machine.root;
  }
  function computeExitSet(transitions, stateNodeSet, historyValue) {
    const statesToExit = new Set();
    for (const t of transitions) {
      if (t.target?.length) {
        const domain = getTransitionDomain(t, historyValue);
        if (t.reenter && t.source === domain) {
          statesToExit.add(domain);
        }
        for (const stateNode of stateNodeSet) {
          if (isDescendant(stateNode, domain)) {
            statesToExit.add(stateNode);
          }
        }
      }
    }
    return [...statesToExit];
  }
  function areStateNodeCollectionsEqual(prevStateNodes, nextStateNodeSet) {
    if (prevStateNodes.length !== nextStateNodeSet.size) {
      return false;
    }
    for (const node of prevStateNodes) {
      if (!nextStateNodeSet.has(node)) {
        return false;
      }
    }
    return true;
  }
  function initialMicrostep(root, preInitialState, actorScope, initEvent, internalQueue) {
    return microstep([{
      target: [...getInitialStateNodes(root)],
      source: root,
      reenter: true,
      actions: [],
      eventType: null,
      toJSON: null
    }], preInitialState, actorScope, initEvent, true, internalQueue);
  }

  /** https://www.w3.org/TR/scxml/#microstepProcedure */
  function microstep(transitions, currentSnapshot, actorScope, event, isInitial, internalQueue) {
    const actions = [];
    if (!transitions.length) {
      return [currentSnapshot, actions];
    }
    const originalExecutor = actorScope.actionExecutor;
    actorScope.actionExecutor = action => {
      actions.push(action);
      originalExecutor(action);
    };
    try {
      const mutStateNodeSet = new Set(currentSnapshot._nodes);
      let historyValue = currentSnapshot.historyValue;
      const filteredTransitions = removeConflictingTransitions(transitions, mutStateNodeSet, historyValue);
      let nextState = currentSnapshot;

      // Exit states
      if (!isInitial) {
        [nextState, historyValue] = exitStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, historyValue, internalQueue, actorScope.actionExecutor);
      }

      // Execute transition content
      nextState = resolveActionsAndContext(nextState, event, actorScope, filteredTransitions.flatMap(t => t.actions), internalQueue, undefined);

      // Enter states
      nextState = enterStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial);
      const nextStateNodes = [...mutStateNodeSet];
      if (nextState.status === 'done') {
        nextState = resolveActionsAndContext(nextState, event, actorScope, nextStateNodes.sort((a, b) => b.order - a.order).flatMap(state => state.exit), internalQueue, undefined);
      }

      // eslint-disable-next-line no-useless-catch
      try {
        if (historyValue === currentSnapshot.historyValue && areStateNodeCollectionsEqual(currentSnapshot._nodes, mutStateNodeSet)) {
          return [nextState, actions];
        }
        return [cloneMachineSnapshot(nextState, {
          _nodes: nextStateNodes,
          historyValue
        }), actions];
      } catch (e) {
        // TODO: Refactor this once proper error handling is implemented.
        // See https://github.com/statelyai/rfcs/pull/4
        throw e;
      }
    } finally {
      actorScope.actionExecutor = originalExecutor;
    }
  }
  function getMachineOutput(snapshot, event, actorScope, rootNode, rootCompletionNode) {
    if (rootNode.output === undefined) {
      return;
    }
    const doneStateEvent = createDoneStateEvent(rootCompletionNode.id, rootCompletionNode.output !== undefined && rootCompletionNode.parent ? resolveOutput(rootCompletionNode.output, snapshot.context, event, actorScope.self) : undefined);
    return resolveOutput(rootNode.output, snapshot.context, doneStateEvent, actorScope.self);
  }
  function enterStates(currentSnapshot, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial) {
    let nextSnapshot = currentSnapshot;
    const statesToEnter = new Set();
    // those are states that were directly targeted or indirectly targeted by the explicit target
    // in other words, those are states for which initial actions should be executed
    // when we target `#deep_child` initial actions of its ancestors shouldn't be executed
    const statesForDefaultEntry = new Set();
    computeEntrySet(filteredTransitions, historyValue, statesForDefaultEntry, statesToEnter);

    // In the initial state, the root state node is "entered".
    if (isInitial) {
      statesForDefaultEntry.add(currentSnapshot.machine.root);
    }
    const completedNodes = new Set();
    for (const stateNodeToEnter of [...statesToEnter].sort((a, b) => a.order - b.order)) {
      mutStateNodeSet.add(stateNodeToEnter);
      const actions = [];

      // Add entry actions
      actions.push(...stateNodeToEnter.entry);
      for (const invokeDef of stateNodeToEnter.invoke) {
        actions.push(spawnChild(invokeDef.src, {
          ...invokeDef,
          syncSnapshot: !!invokeDef.onSnapshot
        }));
      }
      if (statesForDefaultEntry.has(stateNodeToEnter)) {
        const initialActions = stateNodeToEnter.initial.actions;
        actions.push(...initialActions);
      }
      nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, actions, internalQueue, stateNodeToEnter.invoke.map(invokeDef => invokeDef.id));
      if (stateNodeToEnter.type === 'final') {
        const parent = stateNodeToEnter.parent;
        let ancestorMarker = parent?.type === 'parallel' ? parent : parent?.parent;
        let rootCompletionNode = ancestorMarker || stateNodeToEnter;
        if (parent?.type === 'compound') {
          internalQueue.push(createDoneStateEvent(parent.id, stateNodeToEnter.output !== undefined ? resolveOutput(stateNodeToEnter.output, nextSnapshot.context, event, actorScope.self) : undefined));
        }
        while (ancestorMarker?.type === 'parallel' && !completedNodes.has(ancestorMarker) && isInFinalState(mutStateNodeSet, ancestorMarker)) {
          completedNodes.add(ancestorMarker);
          internalQueue.push(createDoneStateEvent(ancestorMarker.id));
          rootCompletionNode = ancestorMarker;
          ancestorMarker = ancestorMarker.parent;
        }
        if (ancestorMarker) {
          continue;
        }
        nextSnapshot = cloneMachineSnapshot(nextSnapshot, {
          status: 'done',
          output: getMachineOutput(nextSnapshot, event, actorScope, nextSnapshot.machine.root, rootCompletionNode)
        });
      }
    }
    return nextSnapshot;
  }
  function computeEntrySet(transitions, historyValue, statesForDefaultEntry, statesToEnter) {
    for (const t of transitions) {
      const domain = getTransitionDomain(t, historyValue);
      for (const s of t.target || []) {
        if (!isHistoryNode(s) && (
        // if the target is different than the source then it will *definitely* be entered
        t.source !== s ||
        // we know that the domain can't lie within the source
        // if it's different than the source then it's outside of it and it means that the target has to be entered as well
        t.source !== domain ||
        // reentering transitions always enter the target, even if it's the source itself
        t.reenter)) {
          statesToEnter.add(s);
          statesForDefaultEntry.add(s);
        }
        addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
      }
      const targetStates = getEffectiveTargetStates(t, historyValue);
      for (const s of targetStates) {
        const ancestors = getProperAncestors(s, domain);
        if (domain?.type === 'parallel') {
          ancestors.push(domain);
        }
        addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, !t.source.parent && t.reenter ? undefined : domain);
      }
    }
  }
  function addDescendantStatesToEnter(stateNode, historyValue, statesForDefaultEntry, statesToEnter) {
    if (isHistoryNode(stateNode)) {
      if (historyValue[stateNode.id]) {
        const historyStateNodes = historyValue[stateNode.id];
        for (const s of historyStateNodes) {
          statesToEnter.add(s);
          addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
        }
        for (const s of historyStateNodes) {
          addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
        }
      } else {
        const historyDefaultTransition = resolveHistoryDefaultTransition(stateNode);
        for (const s of historyDefaultTransition.target) {
          statesToEnter.add(s);
          if (historyDefaultTransition === stateNode.parent?.initial) {
            statesForDefaultEntry.add(stateNode.parent);
          }
          addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
        }
        for (const s of historyDefaultTransition.target) {
          addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
        }
      }
    } else {
      if (stateNode.type === 'compound') {
        const [initialState] = stateNode.initial.target;
        if (!isHistoryNode(initialState)) {
          statesToEnter.add(initialState);
          statesForDefaultEntry.add(initialState);
        }
        addDescendantStatesToEnter(initialState, historyValue, statesForDefaultEntry, statesToEnter);
        addProperAncestorStatesToEnter(initialState, stateNode, statesToEnter, historyValue, statesForDefaultEntry);
      } else {
        if (stateNode.type === 'parallel') {
          for (const child of getChildren(stateNode).filter(sn => !isHistoryNode(sn))) {
            if (![...statesToEnter].some(s => isDescendant(s, child))) {
              if (!isHistoryNode(child)) {
                statesToEnter.add(child);
                statesForDefaultEntry.add(child);
              }
              addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
            }
          }
        }
      }
    }
  }
  function addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, reentrancyDomain) {
    for (const anc of ancestors) {
      if (!reentrancyDomain || isDescendant(anc, reentrancyDomain)) {
        statesToEnter.add(anc);
      }
      if (anc.type === 'parallel') {
        for (const child of getChildren(anc).filter(sn => !isHistoryNode(sn))) {
          if (![...statesToEnter].some(s => isDescendant(s, child))) {
            statesToEnter.add(child);
            addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
          }
        }
      }
    }
  }
  function addProperAncestorStatesToEnter(stateNode, toStateNode, statesToEnter, historyValue, statesForDefaultEntry) {
    addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, getProperAncestors(stateNode, toStateNode));
  }
  function exitStates(currentSnapshot, event, actorScope, transitions, mutStateNodeSet, historyValue, internalQueue, _actionExecutor) {
    let nextSnapshot = currentSnapshot;
    const statesToExit = computeExitSet(transitions, mutStateNodeSet, historyValue);
    statesToExit.sort((a, b) => b.order - a.order);
    let changedHistory;

    // From SCXML algorithm: https://www.w3.org/TR/scxml/#exitStates
    for (const exitStateNode of statesToExit) {
      for (const historyNode of getHistoryNodes(exitStateNode)) {
        let predicate;
        if (historyNode.history === 'deep') {
          predicate = sn => isAtomicStateNode(sn) && isDescendant(sn, exitStateNode);
        } else {
          predicate = sn => {
            return sn.parent === exitStateNode;
          };
        }
        changedHistory ??= {
          ...historyValue
        };
        changedHistory[historyNode.id] = Array.from(mutStateNodeSet).filter(predicate);
      }
    }
    for (const s of statesToExit) {
      nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, [...s.exit, ...s.invoke.map(def => stopChild(def.id))], internalQueue, undefined);
      mutStateNodeSet.delete(s);
    }
    return [nextSnapshot, changedHistory || historyValue];
  }
  function getAction(machine, actionType) {
    return machine.implementations.actions[actionType];
  }
  function resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, extra, retries) {
    const {
      machine
    } = currentSnapshot;
    let intermediateSnapshot = currentSnapshot;
    for (const action of actions) {
      const isInline = typeof action === 'function';
      const resolvedAction = isInline ? action :
      // the existing type of `.actions` assumes non-nullable `TExpressionAction`
      // it's fine to cast this here to get a common type and lack of errors in the rest of the code
      // our logic below makes sure that we call those 2 "variants" correctly

      getAction(machine, typeof action === 'string' ? action : action.type);
      const actionArgs = {
        context: intermediateSnapshot.context,
        event,
        self: actorScope.self,
        system: actorScope.system
      };
      const actionParams = isInline || typeof action === 'string' ? undefined : 'params' in action ? typeof action.params === 'function' ? action.params({
        context: intermediateSnapshot.context,
        event
      }) : action.params : undefined;
      if (!resolvedAction || !('resolve' in resolvedAction)) {
        actorScope.actionExecutor({
          type: typeof action === 'string' ? action : typeof action === 'object' ? action.type : action.name || '(anonymous)',
          info: actionArgs,
          params: actionParams,
          exec: resolvedAction
        });
        continue;
      }
      const builtinAction = resolvedAction;
      const [nextState, params, actions] = builtinAction.resolve(actorScope, intermediateSnapshot, actionArgs, actionParams, resolvedAction,
      // this holds all params
      extra);
      intermediateSnapshot = nextState;
      if ('retryResolve' in builtinAction) {
        retries?.push([builtinAction, params]);
      }
      if ('execute' in builtinAction) {
        actorScope.actionExecutor({
          type: builtinAction.type,
          info: actionArgs,
          params,
          exec: builtinAction.execute.bind(null, actorScope, params)
        });
      }
      if (actions) {
        intermediateSnapshot = resolveAndExecuteActionsWithContext(intermediateSnapshot, event, actorScope, actions, extra, retries);
      }
    }
    return intermediateSnapshot;
  }
  function resolveActionsAndContext(currentSnapshot, event, actorScope, actions, internalQueue, deferredActorIds) {
    const retries = deferredActorIds ? [] : undefined;
    const nextState = resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, {
      internalQueue,
      deferredActorIds
    }, retries);
    retries?.forEach(([builtinAction, params]) => {
      builtinAction.retryResolve(actorScope, nextState, params);
    });
    return nextState;
  }
  function macrostep(snapshot, event, actorScope, internalQueue) {
    let nextSnapshot = snapshot;
    const microsteps = [];
    function addMicrostep(step, event, transitions) {
      actorScope.system._sendInspectionEvent({
        type: '@xstate.microstep',
        actorRef: actorScope.self,
        event,
        snapshot: step[0],
        _transitions: transitions
      });
      microsteps.push(step);
    }

    // Handle stop event
    if (event.type === XSTATE_STOP) {
      nextSnapshot = cloneMachineSnapshot(stopChildren(nextSnapshot, event, actorScope), {
        status: 'stopped'
      });
      addMicrostep([nextSnapshot, []], event, []);
      return {
        snapshot: nextSnapshot,
        microsteps
      };
    }
    let nextEvent = event;

    // Assume the state is at rest (no raised events)
    // Determine the next state based on the next microstep
    if (nextEvent.type !== XSTATE_INIT) {
      const currentEvent = nextEvent;
      const isErr = isErrorActorEvent(currentEvent);
      const transitions = selectTransitions(currentEvent, nextSnapshot);
      if (isErr && !transitions.length) {
        // TODO: we should likely only allow transitions selected by very explicit descriptors
        // `*` shouldn't be matched, likely `xstate.error.*` shouldn't be either
        // similarly `xstate.error.actor.*` and `xstate.error.actor.todo.*` have to be considered too
        nextSnapshot = cloneMachineSnapshot(snapshot, {
          status: 'error',
          error: currentEvent.error
        });
        addMicrostep([nextSnapshot, []], currentEvent, []);
        return {
          snapshot: nextSnapshot,
          microsteps
        };
      }
      const step = microstep(transitions, snapshot, actorScope, nextEvent, false,
      // isInitial
      internalQueue);
      nextSnapshot = step[0];
      addMicrostep(step, currentEvent, transitions);
    }
    let shouldSelectEventlessTransitions = true;
    while (nextSnapshot.status === 'active') {
      let enabledTransitions = shouldSelectEventlessTransitions ? selectEventlessTransitions(nextSnapshot, nextEvent) : [];

      // eventless transitions should always be selected after selecting *regular* transitions
      // by assigning `undefined` to `previousState` we ensure that `shouldSelectEventlessTransitions` gets always computed to true in such a case
      const previousState = enabledTransitions.length ? nextSnapshot : undefined;
      if (!enabledTransitions.length) {
        if (!internalQueue.length) {
          break;
        }
        nextEvent = internalQueue.shift();
        enabledTransitions = selectTransitions(nextEvent, nextSnapshot);
      }
      const step = microstep(enabledTransitions, nextSnapshot, actorScope, nextEvent, false, internalQueue);
      nextSnapshot = step[0];
      shouldSelectEventlessTransitions = nextSnapshot !== previousState;
      addMicrostep(step, nextEvent, enabledTransitions);
    }
    if (nextSnapshot.status !== 'active') {
      stopChildren(nextSnapshot, nextEvent, actorScope);
    }
    return {
      snapshot: nextSnapshot,
      microsteps
    };
  }
  function stopChildren(nextState, event, actorScope) {
    return resolveActionsAndContext(nextState, event, actorScope, Object.values(nextState.children).map(child => stopChild(child)), [], undefined);
  }
  function selectTransitions(event, nextState) {
    return nextState.machine.getTransitionData(nextState, event);
  }
  function selectEventlessTransitions(nextState, event) {
    const enabledTransitionSet = new Set();
    const atomicStates = nextState._nodes.filter(isAtomicStateNode);
    for (const stateNode of atomicStates) {
      loop: for (const s of [stateNode].concat(getProperAncestors(stateNode, undefined))) {
        if (!s.always) {
          continue;
        }
        for (const transition of s.always) {
          if (transition.guard === undefined || evaluateGuard(transition.guard, nextState.context, event, nextState)) {
            enabledTransitionSet.add(transition);
            break loop;
          }
        }
      }
    }
    return removeConflictingTransitions(Array.from(enabledTransitionSet), new Set(nextState._nodes), nextState.historyValue);
  }

  /**
   * Resolves a partial state value with its full representation in the state
   * node's machine.
   *
   * @param stateValue The partial state value to resolve.
   */
  function resolveStateValue(rootNode, stateValue) {
    const allStateNodes = getAllStateNodes(getStateNodes(rootNode, stateValue));
    return getStateValue(rootNode, [...allStateNodes]);
  }

  function isMachineSnapshot(value) {
    return !!value && typeof value === 'object' && 'machine' in value && 'value' in value;
  }
  const machineSnapshotMatches = function matches(testValue) {
    return matchesState(testValue, this.value);
  };
  const machineSnapshotHasTag = function hasTag(tag) {
    return this.tags.has(tag);
  };
  const machineSnapshotCan = function can(event) {
    const transitionData = this.machine.getTransitionData(this, event);
    return !!transitionData?.length &&
    // Check that at least one transition is not forbidden
    transitionData.some(t => t.target !== undefined || t.actions.length);
  };
  const machineSnapshotToJSON = function toJSON() {
    const {
      _nodes: nodes,
      tags,
      machine,
      getMeta,
      toJSON,
      can,
      hasTag,
      matches,
      ...jsonValues
    } = this;
    return {
      ...jsonValues,
      tags: Array.from(tags)
    };
  };
  const machineSnapshotGetMeta = function getMeta() {
    return this._nodes.reduce((acc, stateNode) => {
      if (stateNode.meta !== undefined) {
        acc[stateNode.id] = stateNode.meta;
      }
      return acc;
    }, {});
  };
  function createMachineSnapshot(config, machine) {
    return {
      status: config.status,
      output: config.output,
      error: config.error,
      machine,
      context: config.context,
      _nodes: config._nodes,
      value: getStateValue(machine.root, config._nodes),
      tags: new Set(config._nodes.flatMap(sn => sn.tags)),
      children: config.children,
      historyValue: config.historyValue || {},
      matches: machineSnapshotMatches,
      hasTag: machineSnapshotHasTag,
      can: machineSnapshotCan,
      getMeta: machineSnapshotGetMeta,
      toJSON: machineSnapshotToJSON
    };
  }
  function cloneMachineSnapshot(snapshot, config = {}) {
    return createMachineSnapshot({
      ...snapshot,
      ...config
    }, snapshot.machine);
  }
  function serializeHistoryValue(historyValue) {
    if (typeof historyValue !== 'object' || historyValue === null) {
      return {};
    }
    const result = {};
    for (const key in historyValue) {
      const value = historyValue[key];
      if (Array.isArray(value)) {
        result[key] = value.map(item => ({
          id: item.id
        }));
      }
    }
    return result;
  }
  function getPersistedSnapshot(snapshot, options) {
    const {
      _nodes: nodes,
      tags,
      machine,
      children,
      context,
      can,
      hasTag,
      matches,
      getMeta,
      toJSON,
      ...jsonValues
    } = snapshot;
    const childrenJson = {};
    for (const id in children) {
      const child = children[id];
      childrenJson[id] = {
        snapshot: child.getPersistedSnapshot(options),
        src: child.src,
        systemId: child.systemId,
        syncSnapshot: child._syncSnapshot
      };
    }
    const persisted = {
      ...jsonValues,
      context: persistContext(context),
      children: childrenJson,
      historyValue: serializeHistoryValue(jsonValues.historyValue)
    };
    return persisted;
  }
  function persistContext(contextPart) {
    let copy;
    for (const key in contextPart) {
      const value = contextPart[key];
      if (value && typeof value === 'object') {
        if ('sessionId' in value && 'send' in value && 'ref' in value) {
          copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
            ...contextPart
          };
          copy[key] = {
            xstate$$type: $$ACTOR_TYPE,
            id: value.id
          };
        } else {
          const result = persistContext(value);
          if (result !== value) {
            copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
              ...contextPart
            };
            copy[key] = result;
          }
        }
      }
    }
    return copy ?? contextPart;
  }

  function resolveRaise(_, snapshot, args, actionParams, {
    event: eventOrExpr,
    id,
    delay
  }, {
    internalQueue
  }) {
    const delaysMap = snapshot.machine.implementations.delays;
    if (typeof eventOrExpr === 'string') {
      throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Only event objects may be used with raise; use raise({ type: "${eventOrExpr}" }) instead`);
    }
    const resolvedEvent = typeof eventOrExpr === 'function' ? eventOrExpr(args, actionParams) : eventOrExpr;
    let resolvedDelay;
    if (typeof delay === 'string') {
      const configDelay = delaysMap && delaysMap[delay];
      resolvedDelay = typeof configDelay === 'function' ? configDelay(args, actionParams) : configDelay;
    } else {
      resolvedDelay = typeof delay === 'function' ? delay(args, actionParams) : delay;
    }
    if (typeof resolvedDelay !== 'number') {
      internalQueue.push(resolvedEvent);
    }
    return [snapshot, {
      event: resolvedEvent,
      id,
      delay: resolvedDelay
    }, undefined];
  }
  function executeRaise(actorScope, params) {
    const {
      event,
      delay,
      id
    } = params;
    if (typeof delay === 'number') {
      actorScope.defer(() => {
        const self = actorScope.self;
        actorScope.system.scheduler.schedule(self, self, event, delay, id);
      });
      return;
    }
  }
  /**
   * Raises an event. This places the event in the internal event queue, so that
   * the event is immediately consumed by the machine in the current step.
   *
   * @param eventType The event to raise.
   */
  function raise(eventOrExpr, options) {
    function raise(_args, _params) {
    }
    raise.type = 'xstate.raise';
    raise.event = eventOrExpr;
    raise.id = options?.id;
    raise.delay = options?.delay;
    raise.resolve = resolveRaise;
    raise.execute = executeRaise;
    return raise;
  }

  const XSTATE_PROMISE_RESOLVE = 'xstate.promise.resolve';
  const XSTATE_PROMISE_REJECT = 'xstate.promise.reject';

  /**
   * Represents an actor created by `fromPromise`.
   *
   * The type of `self` within the actor's logic.
   *
   * @example
   *
   * ```ts
   * import { fromPromise, createActor } from 'xstate';
   *
   * // The actor's resolved output
   * type Output = string;
   * // The actor's input.
   * type Input = { message: string };
   *
   * // Actor logic that fetches the url of an image of a cat saying `input.message`.
   * const logic = fromPromise<Output, Input>(async ({ input, self }) => {
   *   self;
   *   // ^? PromiseActorRef<Output, Input>
   *
   *   const data = await fetch(
   *     `https://cataas.com/cat/says/${input.message}`
   *   );
   *   const url = await data.json();
   *   return url;
   * });
   *
   * const actor = createActor(logic, { input: { message: 'hello world' } });
   * //    ^? PromiseActorRef<Output, Input>
   * ```
   *
   * @see {@link fromPromise}
   */

  const controllerMap = new WeakMap();

  /**
   * An actor logic creator which returns promise logic as defined by an async
   * process that resolves or rejects after some time.
   *
   * Actors created from promise actor logic (“promise actors”) can:
   *
   * - Emit the resolved value of the promise
   * - Output the resolved value of the promise
   *
   * Sending events to promise actors will have no effect.
   *
   * @example
   *
   * ```ts
   * const promiseLogic = fromPromise(async () => {
   *   const result = await fetch('https://example.com/...').then((data) =>
   *     data.json()
   *   );
   *
   *   return result;
   * });
   *
   * const promiseActor = createActor(promiseLogic);
   * promiseActor.subscribe((snapshot) => {
   *   console.log(snapshot);
   * });
   * promiseActor.start();
   * // => {
   * //   output: undefined,
   * //   status: 'active'
   * //   ...
   * // }
   *
   * // After promise resolves
   * // => {
   * //   output: { ... },
   * //   status: 'done',
   * //   ...
   * // }
   * ```
   *
   * @param promiseCreator A function which returns a Promise, and accepts an
   *   object with the following properties:
   *
   *   - `input` - Data that was provided to the promise actor
   *   - `self` - The parent actor of the promise actor
   *   - `system` - The actor system to which the promise actor belongs
   *
   * @see {@link https://stately.ai/docs/input | Input docs} for more information about how input is passed
   */
  function fromPromise$1(promiseCreator) {
    const logic = {
      config: promiseCreator,
      transition: (state, event, scope) => {
        if (state.status !== 'active') {
          return state;
        }
        switch (event.type) {
          case XSTATE_PROMISE_RESOLVE:
            {
              const resolvedValue = event.data;
              return {
                ...state,
                status: 'done',
                output: resolvedValue,
                input: undefined
              };
            }
          case XSTATE_PROMISE_REJECT:
            return {
              ...state,
              status: 'error',
              error: event.data,
              input: undefined
            };
          case XSTATE_STOP:
            {
              controllerMap.get(scope.self)?.abort();
              controllerMap.delete(scope.self);
              return {
                ...state,
                status: 'stopped',
                input: undefined
              };
            }
          default:
            return state;
        }
      },
      start: (state, {
        self,
        system,
        emit
      }) => {
        // TODO: determine how to allow customizing this so that promises
        // can be restarted if necessary
        if (state.status !== 'active') {
          return;
        }
        const controller = new AbortController();
        controllerMap.set(self, controller);
        const resolvedPromise = Promise.resolve(promiseCreator({
          input: state.input,
          system,
          self,
          signal: controller.signal,
          emit
        }));
        resolvedPromise.then(response => {
          if (self.getSnapshot().status !== 'active') {
            return;
          }
          controllerMap.delete(self);
          system._relay(self, self, {
            type: XSTATE_PROMISE_RESOLVE,
            data: response
          });
        }, errorData => {
          if (self.getSnapshot().status !== 'active') {
            return;
          }
          controllerMap.delete(self);
          system._relay(self, self, {
            type: XSTATE_PROMISE_REJECT,
            data: errorData
          });
        });
      },
      getInitialSnapshot: (_, input) => {
        return {
          status: 'active',
          output: undefined,
          error: undefined,
          input
        };
      },
      getPersistedSnapshot: snapshot => snapshot,
      restoreSnapshot: snapshot => snapshot
    };
    return logic;
  }

  function createSpawner(actorScope, {
    machine,
    context
  }, event, spawnedChildren) {
    const spawn = (src, options) => {
      if (typeof src === 'string') {
        const logic = resolveReferencedActor(machine, src);
        if (!logic) {
          throw new Error(`Actor logic '${src}' not implemented in machine '${machine.id}'`);
        }
        const actorRef = createActor(logic, {
          id: options?.id,
          parent: actorScope.self,
          syncSnapshot: options?.syncSnapshot,
          input: typeof options?.input === 'function' ? options.input({
            context,
            event,
            self: actorScope.self
          }) : options?.input,
          src,
          systemId: options?.systemId
        });
        spawnedChildren[actorRef.id] = actorRef;
        return actorRef;
      } else {
        const actorRef = createActor(src, {
          id: options?.id,
          parent: actorScope.self,
          syncSnapshot: options?.syncSnapshot,
          input: options?.input,
          src,
          systemId: options?.systemId
        });
        return actorRef;
      }
    };
    return (src, options) => {
      const actorRef = spawn(src, options); // TODO: fix types
      spawnedChildren[actorRef.id] = actorRef;
      actorScope.defer(() => {
        if (actorRef._processingStatus === ProcessingStatus.Stopped) {
          return;
        }
        actorRef.start();
      });
      return actorRef;
    };
  }

  function resolveAssign(actorScope, snapshot, actionArgs, actionParams, {
    assignment
  }) {
    if (!snapshot.context) {
      throw new Error('Cannot assign to undefined `context`. Ensure that `context` is defined in the machine config.');
    }
    const spawnedChildren = {};
    const assignArgs = {
      context: snapshot.context,
      event: actionArgs.event,
      spawn: createSpawner(actorScope, snapshot, actionArgs.event, spawnedChildren),
      self: actorScope.self,
      system: actorScope.system
    };
    let partialUpdate = {};
    if (typeof assignment === 'function') {
      partialUpdate = assignment(assignArgs, actionParams);
    } else {
      for (const key of Object.keys(assignment)) {
        const propAssignment = assignment[key];
        partialUpdate[key] = typeof propAssignment === 'function' ? propAssignment(assignArgs, actionParams) : propAssignment;
      }
    }
    const updatedContext = Object.assign({}, snapshot.context, partialUpdate);
    return [cloneMachineSnapshot(snapshot, {
      context: updatedContext,
      children: Object.keys(spawnedChildren).length ? {
        ...snapshot.children,
        ...spawnedChildren
      } : snapshot.children
    }), undefined, undefined];
  }
  /**
   * Updates the current context of the machine.
   *
   * @example
   *
   * ```ts
   * import { createMachine, assign } from 'xstate';
   *
   * const countMachine = createMachine({
   *   context: {
   *     count: 0,
   *     message: ''
   *   },
   *   on: {
   *     inc: {
   *       actions: assign({
   *         count: ({ context }) => context.count + 1
   *       })
   *     },
   *     updateMessage: {
   *       actions: assign(({ context, event }) => {
   *         return {
   *           message: event.message.trim()
   *         };
   *       })
   *     }
   *   }
   * });
   * ```
   *
   * @param assignment An object that represents the partial context to update, or
   *   a function that returns an object that represents the partial context to
   *   update.
   */
  function assign(assignment) {
    function assign(_args, _params) {
    }
    assign.type = 'xstate.assign';
    assign.assignment = assignment;
    assign.resolve = resolveAssign;
    return assign;
  }

  const cache = new WeakMap();
  function memo(object, key, fn) {
    let memoizedData = cache.get(object);
    if (!memoizedData) {
      memoizedData = {
        [key]: fn()
      };
      cache.set(object, memoizedData);
    } else if (!(key in memoizedData)) {
      memoizedData[key] = fn();
    }
    return memoizedData[key];
  }

  const EMPTY_OBJECT = {};
  const toSerializableAction = action => {
    if (typeof action === 'string') {
      return {
        type: action
      };
    }
    if (typeof action === 'function') {
      if ('resolve' in action) {
        return {
          type: action.type
        };
      }
      return {
        type: action.name
      };
    }
    return action;
  };
  class StateNode {
    constructor(/** The raw config used to create the machine. */
    config, options) {
      this.config = config;
      /**
       * The relative key of the state node, which represents its location in the
       * overall state value.
       */
      this.key = void 0;
      /** The unique ID of the state node. */
      this.id = void 0;
      /**
       * The type of this state node:
       *
       * - `'atomic'` - no child state nodes
       * - `'compound'` - nested child state nodes (XOR)
       * - `'parallel'` - orthogonal nested child state nodes (AND)
       * - `'history'` - history state node
       * - `'final'` - final state node
       */
      this.type = void 0;
      /** The string path from the root machine node to this node. */
      this.path = void 0;
      /** The child state nodes. */
      this.states = void 0;
      /**
       * The type of history on this state node. Can be:
       *
       * - `'shallow'` - recalls only top-level historical state value
       * - `'deep'` - recalls historical state value at all levels
       */
      this.history = void 0;
      /** The action(s) to be executed upon entering the state node. */
      this.entry = void 0;
      /** The action(s) to be executed upon exiting the state node. */
      this.exit = void 0;
      /** The parent state node. */
      this.parent = void 0;
      /** The root machine node. */
      this.machine = void 0;
      /**
       * The meta data associated with this state node, which will be returned in
       * State instances.
       */
      this.meta = void 0;
      /**
       * The output data sent with the "xstate.done.state._id_" event if this is a
       * final state node.
       */
      this.output = void 0;
      /**
       * The order this state node appears. Corresponds to the implicit document
       * order.
       */
      this.order = -1;
      this.description = void 0;
      this.tags = [];
      this.transitions = void 0;
      this.always = void 0;
      this.parent = options._parent;
      this.key = options._key;
      this.machine = options._machine;
      this.path = this.parent ? this.parent.path.concat(this.key) : [];
      this.id = this.config.id || [this.machine.id, ...this.path].join(STATE_DELIMITER);
      this.type = this.config.type || (this.config.states && Object.keys(this.config.states).length ? 'compound' : this.config.history ? 'history' : 'atomic');
      this.description = this.config.description;
      this.order = this.machine.idMap.size;
      this.machine.idMap.set(this.id, this);
      this.states = this.config.states ? mapValues(this.config.states, (stateConfig, key) => {
        const stateNode = new StateNode(stateConfig, {
          _parent: this,
          _key: key,
          _machine: this.machine
        });
        return stateNode;
      }) : EMPTY_OBJECT;
      if (this.type === 'compound' && !this.config.initial) {
        throw new Error(`No initial state specified for compound state node "#${this.id}". Try adding { initial: "${Object.keys(this.states)[0]}" } to the state config.`);
      }

      // History config
      this.history = this.config.history === true ? 'shallow' : this.config.history || false;
      this.entry = toArray(this.config.entry).slice();
      this.exit = toArray(this.config.exit).slice();
      this.meta = this.config.meta;
      this.output = this.type === 'final' || !this.parent ? this.config.output : undefined;
      this.tags = toArray(config.tags).slice();
    }

    /** @internal */
    _initialize() {
      this.transitions = formatTransitions(this);
      if (this.config.always) {
        this.always = toTransitionConfigArray(this.config.always).map(t => formatTransition(this, NULL_EVENT, t));
      }
      Object.keys(this.states).forEach(key => {
        this.states[key]._initialize();
      });
    }

    /** The well-structured state node definition. */
    get definition() {
      return {
        id: this.id,
        key: this.key,
        version: this.machine.version,
        type: this.type,
        initial: this.initial ? {
          target: this.initial.target,
          source: this,
          actions: this.initial.actions.map(toSerializableAction),
          eventType: null,
          reenter: false,
          toJSON: () => ({
            target: this.initial.target.map(t => `#${t.id}`),
            source: `#${this.id}`,
            actions: this.initial.actions.map(toSerializableAction),
            eventType: null
          })
        } : undefined,
        history: this.history,
        states: mapValues(this.states, state => {
          return state.definition;
        }),
        on: this.on,
        transitions: [...this.transitions.values()].flat().map(t => ({
          ...t,
          actions: t.actions.map(toSerializableAction)
        })),
        entry: this.entry.map(toSerializableAction),
        exit: this.exit.map(toSerializableAction),
        meta: this.meta,
        order: this.order || -1,
        output: this.output,
        invoke: this.invoke,
        description: this.description,
        tags: this.tags
      };
    }

    /** @internal */
    toJSON() {
      return this.definition;
    }

    /** The logic invoked as actors by this state node. */
    get invoke() {
      return memo(this, 'invoke', () => toArray(this.config.invoke).map((invokeConfig, i) => {
        const {
          src,
          systemId
        } = invokeConfig;
        const resolvedId = invokeConfig.id ?? createInvokeId(this.id, i);
        const sourceName = typeof src === 'string' ? src : `xstate.invoke.${createInvokeId(this.id, i)}`;
        return {
          ...invokeConfig,
          src: sourceName,
          id: resolvedId,
          systemId: systemId,
          toJSON() {
            const {
              onDone,
              onError,
              ...invokeDefValues
            } = invokeConfig;
            return {
              ...invokeDefValues,
              type: 'xstate.invoke',
              src: sourceName,
              id: resolvedId
            };
          }
        };
      }));
    }

    /** The mapping of events to transitions. */
    get on() {
      return memo(this, 'on', () => {
        const transitions = this.transitions;
        return [...transitions].flatMap(([descriptor, t]) => t.map(t => [descriptor, t])).reduce((map, [descriptor, transition]) => {
          map[descriptor] = map[descriptor] || [];
          map[descriptor].push(transition);
          return map;
        }, {});
      });
    }
    get after() {
      return memo(this, 'delayedTransitions', () => getDelayedTransitions(this));
    }
    get initial() {
      return memo(this, 'initial', () => formatInitialTransition(this, this.config.initial));
    }

    /** @internal */
    next(snapshot, event) {
      const eventType = event.type;
      const actions = [];
      let selectedTransition;
      const candidates = memo(this, `candidates-${eventType}`, () => getCandidates(this, eventType));
      for (const candidate of candidates) {
        const {
          guard
        } = candidate;
        const resolvedContext = snapshot.context;
        let guardPassed = false;
        try {
          guardPassed = !guard || evaluateGuard(guard, resolvedContext, event, snapshot);
        } catch (err) {
          const guardType = typeof guard === 'string' ? guard : typeof guard === 'object' ? guard.type : undefined;
          throw new Error(`Unable to evaluate guard ${guardType ? `'${guardType}' ` : ''}in transition for event '${eventType}' in state node '${this.id}':\n${err.message}`);
        }
        if (guardPassed) {
          actions.push(...candidate.actions);
          selectedTransition = candidate;
          break;
        }
      }
      return selectedTransition ? [selectedTransition] : undefined;
    }

    /** All the event types accepted by this state node and its descendants. */
    get events() {
      return memo(this, 'events', () => {
        const {
          states
        } = this;
        const events = new Set(this.ownEvents);
        if (states) {
          for (const stateId of Object.keys(states)) {
            const state = states[stateId];
            if (state.states) {
              for (const event of state.events) {
                events.add(`${event}`);
              }
            }
          }
        }
        return Array.from(events);
      });
    }

    /**
     * All the events that have transitions directly from this state node.
     *
     * Excludes any inert events.
     */
    get ownEvents() {
      const keys = Object.keys(Object.fromEntries(this.transitions));
      const events = new Set(keys.filter(descriptor => {
        return this.transitions.get(descriptor).some(transition => !(!transition.target && !transition.actions.length && !transition.reenter));
      }));
      return Array.from(events);
    }
  }

  const STATE_IDENTIFIER = '#';
  class StateMachine {
    constructor(/** The raw config used to create the machine. */
    config, implementations) {
      this.config = config;
      /** The machine's own version. */
      this.version = void 0;
      this.schemas = void 0;
      this.implementations = void 0;
      /** @internal */
      this.__xstatenode = true;
      /** @internal */
      this.idMap = new Map();
      this.root = void 0;
      this.id = void 0;
      this.states = void 0;
      this.events = void 0;
      this.id = config.id || '(machine)';
      this.implementations = {
        actors: implementations?.actors ?? {},
        actions: implementations?.actions ?? {},
        delays: implementations?.delays ?? {},
        guards: implementations?.guards ?? {}
      };
      this.version = this.config.version;
      this.schemas = this.config.schemas;
      this.transition = this.transition.bind(this);
      this.getInitialSnapshot = this.getInitialSnapshot.bind(this);
      this.getPersistedSnapshot = this.getPersistedSnapshot.bind(this);
      this.restoreSnapshot = this.restoreSnapshot.bind(this);
      this.start = this.start.bind(this);
      this.root = new StateNode(config, {
        _key: this.id,
        _machine: this
      });
      this.root._initialize();
      formatRouteTransitions(this.root);
      this.states = this.root.states; // TODO: remove!
      this.events = this.root.events;
    }

    /**
     * Clones this state machine with the provided implementations.
     *
     * @param implementations Options (`actions`, `guards`, `actors`, `delays`) to
     *   recursively merge with the existing options.
     * @returns A new `StateMachine` instance with the provided implementations.
     */
    provide(implementations) {
      const {
        actions,
        guards,
        actors,
        delays
      } = this.implementations;
      return new StateMachine(this.config, {
        actions: {
          ...actions,
          ...implementations.actions
        },
        guards: {
          ...guards,
          ...implementations.guards
        },
        actors: {
          ...actors,
          ...implementations.actors
        },
        delays: {
          ...delays,
          ...implementations.delays
        }
      });
    }
    resolveState(config) {
      const resolvedStateValue = resolveStateValue(this.root, config.value);
      const nodeSet = getAllStateNodes(getStateNodes(this.root, resolvedStateValue));
      return createMachineSnapshot({
        _nodes: [...nodeSet],
        context: config.context || {},
        children: {},
        status: isInFinalState(nodeSet, this.root) ? 'done' : config.status || 'active',
        output: config.output,
        error: config.error,
        historyValue: config.historyValue
      }, this);
    }

    /**
     * Determines the next snapshot given the current `snapshot` and received
     * `event`. Calculates a full macrostep from all microsteps.
     *
     * @param snapshot The current snapshot
     * @param event The received event
     */
    transition(snapshot, event, actorScope) {
      return macrostep(snapshot, event, actorScope, []).snapshot;
    }

    /**
     * Determines the next state given the current `state` and `event`. Calculates
     * a microstep.
     *
     * @param state The current state
     * @param event The received event
     */
    microstep(snapshot, event, actorScope) {
      return macrostep(snapshot, event, actorScope, []).microsteps.map(([s]) => s);
    }
    getTransitionData(snapshot, event) {
      return transitionNode(this.root, snapshot.value, snapshot, event) || [];
    }

    /**
     * The initial state _before_ evaluating any microsteps. This "pre-initial"
     * state is provided to initial actions executed in the initial state.
     *
     * @internal
     */
    _getPreInitialState(actorScope, initEvent, internalQueue) {
      const {
        context
      } = this.config;
      const preInitial = createMachineSnapshot({
        context: typeof context !== 'function' && context ? context : {},
        _nodes: [this.root],
        children: {},
        status: 'active'
      }, this);
      if (typeof context === 'function') {
        const assignment = ({
          spawn,
          event,
          self
        }) => context({
          spawn,
          input: event.input,
          self
        });
        return resolveActionsAndContext(preInitial, initEvent, actorScope, [assign(assignment)], internalQueue, undefined);
      }
      return preInitial;
    }

    /**
     * Returns the initial `State` instance, with reference to `self` as an
     * `ActorRef`.
     */
    getInitialSnapshot(actorScope, input) {
      const initEvent = createInitEvent(input); // TODO: fix;
      const internalQueue = [];
      const preInitialState = this._getPreInitialState(actorScope, initEvent, internalQueue);
      const [nextState] = initialMicrostep(this.root, preInitialState, actorScope, initEvent, internalQueue);
      const {
        snapshot: macroState
      } = macrostep(nextState, initEvent, actorScope, internalQueue);
      return macroState;
    }
    start(snapshot) {
      Object.values(snapshot.children).forEach(child => {
        if (child.getSnapshot().status === 'active') {
          child.start();
        }
      });
    }
    getStateNodeById(stateId) {
      const fullPath = toStatePath(stateId);
      const relativePath = fullPath.slice(1);
      const resolvedStateId = isStateId(fullPath[0]) ? fullPath[0].slice(STATE_IDENTIFIER.length) : fullPath[0];
      const stateNode = this.idMap.get(resolvedStateId);
      if (!stateNode) {
        throw new Error(`Child state node '#${resolvedStateId}' does not exist on machine '${this.id}'`);
      }
      return getStateNodeByPath(stateNode, relativePath);
    }
    get definition() {
      return this.root.definition;
    }
    toJSON() {
      return this.definition;
    }
    getPersistedSnapshot(snapshot, options) {
      return getPersistedSnapshot(snapshot, options);
    }
    restoreSnapshot(snapshot, _actorScope) {
      const children = {};
      const snapshotChildren = snapshot.children;
      Object.keys(snapshotChildren).forEach(actorId => {
        const actorData = snapshotChildren[actorId];
        const childState = actorData.snapshot;
        const src = actorData.src;
        const logic = typeof src === 'string' ? resolveReferencedActor(this, src) : src;
        if (!logic) {
          return;
        }
        const actorRef = createActor(logic, {
          id: actorId,
          parent: _actorScope.self,
          syncSnapshot: actorData.syncSnapshot,
          snapshot: childState,
          src,
          systemId: actorData.systemId
        });
        children[actorId] = actorRef;
      });
      function resolveHistoryReferencedState(root, referenced) {
        if (referenced instanceof StateNode) {
          return referenced;
        }
        try {
          return root.machine.getStateNodeById(referenced.id);
        } catch {
        }
      }
      function reviveHistoryValue(root, historyValue) {
        if (!historyValue || typeof historyValue !== 'object') {
          return {};
        }
        const revived = {};
        for (const key in historyValue) {
          const arr = historyValue[key];
          for (const item of arr) {
            const resolved = resolveHistoryReferencedState(root, item);
            if (!resolved) {
              continue;
            }
            revived[key] ??= [];
            revived[key].push(resolved);
          }
        }
        return revived;
      }
      const revivedHistoryValue = reviveHistoryValue(this.root, snapshot.historyValue);
      const restoredSnapshot = createMachineSnapshot({
        ...snapshot,
        children,
        _nodes: Array.from(getAllStateNodes(getStateNodes(this.root, snapshot.value))),
        historyValue: revivedHistoryValue
      }, this);
      const seen = new Set();
      function reviveContext(contextPart, children) {
        if (seen.has(contextPart)) {
          return;
        }
        seen.add(contextPart);
        for (const key in contextPart) {
          const value = contextPart[key];
          if (value && typeof value === 'object') {
            if ('xstate$$type' in value && value.xstate$$type === $$ACTOR_TYPE) {
              contextPart[key] = children[value.id];
              continue;
            }
            reviveContext(value, children);
          }
        }
      }
      reviveContext(restoredSnapshot.context, children);
      return restoredSnapshot;
    }
  }

  /**
   * Creates a state machine (statechart) with the given configuration.
   *
   * The state machine represents the pure logic of a state machine actor.
   *
   * @example
   *
   * ```ts
   * import { createMachine } from 'xstate';
   *
   * const lightMachine = createMachine({
   *   id: 'light',
   *   initial: 'green',
   *   states: {
   *     green: {
   *       on: {
   *         TIMER: { target: 'yellow' }
   *       }
   *     },
   *     yellow: {
   *       on: {
   *         TIMER: { target: 'red' }
   *       }
   *     },
   *     red: {
   *       on: {
   *         TIMER: { target: 'green' }
   *       }
   *     }
   *   }
   * });
   *
   * const lightActor = createActor(lightMachine);
   * lightActor.start();
   *
   * lightActor.send({ type: 'TIMER' });
   * ```
   *
   * @param config The state machine configuration.
   * @param options DEPRECATED: use `setup({ ... })` or `machine.provide({ ... })`
   *   to provide machine implementations instead.
   */
  function createMachine(config, implementations) {
    return new StateMachine(config, implementations);
  }

  var xstate = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Actor: Actor,
    StateMachine: StateMachine,
    StateNode: StateNode,
    assign: assign,
    cancel: cancel,
    createActor: createActor,
    createMachine: createMachine,
    fromPromise: fromPromise$1,
    getStateNodes: getStateNodes,
    isMachineSnapshot: isMachineSnapshot,
    matchesState: matchesState,
    pathToStateValue: pathToStateValue,
    raise: raise,
    spawnChild: spawnChild,
    stopChild: stopChild,
    toObserver: toObserver
  });

  // XState machine blueprint for the quotation application.
  // Parallel regions design:
  //   - Region 1: quotation_workflow (browse → quotation hierarchy)
  //   - Region 2: database_management (closed ↔ open with substates)
  // Database changes trigger full recalculation via CLOSE_DATABASE event.

  const quotationMachineBlueprint = {
    id: 'quotationApp',
    type: 'parallel',
    context: {
      // Shared across all states
      previousQuotations: [],

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

  function normalizeAdapters(adapters = {}) {
    return {
      guards: adapters.guards || {},
      actions: adapters.actions || {},
      services: adapters.services || {},
      actors: adapters.actors || adapters.services || {},
    };
  }

  // Builds a concrete XState machine from the blueprint.
  // Supports both:
  // - XState v4 via createMachine(config, options)
  // - XState v5 via machine.provide(...)
  function createQuotationXStateMachine(adapters = {}) {
    const resolved = normalizeAdapters(adapters);

    const base = createMachine(quotationMachineBlueprint);
    if (typeof base.provide === 'function') {
      return base.provide({
        guards: resolved.guards,
        actions: resolved.actions,
        actors: resolved.actors,
      });
    }

    return createMachine(quotationMachineBlueprint, {
      guards: resolved.guards,
      actions: resolved.actions,
      services: resolved.services,
    });
  }

  // Guards for the quotation machine.
  // All guards are pure functions of context and/or event — no side effects.

  const guards = {
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

  function expandCompositions(lineas, store) {
    const result = [];

    for (const linea of lineas) {
      const children = store.findByFK('COMPOSICION_KIT', 'ID_Item_Padre', linea.ID_Item);

      if (!children.length) {
        result.push(linea);
        continue;
      }

      for (const comp of children) {
        const childLine = {
          ...linea,
          ID_Item: comp.ID_Item_Hijo,
          _source: 'COMPOSITION',
          _parentItem: comp.ID_Item_Padre,
          _tipoPrecio: comp.Tipo_Precio,
          _cantidadComp: comp.Cantidad,
        };
        result.push(...expandCompositions([childLine], store));
      }
    }

    return result;
  }

  function resolveDefaults(linea, paxGlobal, store) {
    const item = store.findById('ITEM_CATALOGO', 'ID_Item', linea.ID_Item);
    const cat = store.findById('CATEGORIAS', 'ID_Categoria', item.ID_Categoria);

    linea._categoriaId = cat.ID_Categoria;

    // Overrides bypass category requirements
    if (linea.Override_Pax != null) {
      linea._pax = linea.Override_Pax;
    } else {
      linea._pax = cat.Def_Requiere_Pax ? paxGlobal : 0;
    }

    if (linea.Override_Duracion_Min != null) {
      linea._duracionMin = linea.Override_Duracion_Min;
    } else {
      linea._duracionMin = cat.Def_Requiere_Tiempo ? (cat.Def_Duracion_Min ?? 0) : 0;
    }

    if (linea.Override_Cantidad != null) {
      linea._cantidad = linea.Override_Cantidad;
    } else if (cat.Def_Requiere_Cant) {
      const unitsPerPax = item.Def_Unidades_Por_Pax_Override ?? cat.Def_Unidades_Por_Pax ?? 0;
      linea._cantidad = Math.round(unitsPerPax * linea._pax);
    } else {
      linea._cantidad = 0;
    }

    return linea;
  }

  function resolvePerfil(linea, store) {
    const item = store.findById('ITEM_CATALOGO', 'ID_Item', linea.ID_Item);
    if (item.ID_Perfil_Precio_Override) {
      return store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', item.ID_Perfil_Precio_Override);
    }
    const cat = store.findById('CATEGORIAS', 'ID_Categoria', item.ID_Categoria);
    return store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', cat.ID_Perfil_Precio_Default);
  }

  function calculateLinePrice(linea, store) {
    const perfil = resolvePerfil(linea, store);
    linea._perfil = perfil?.ID_Perfil_Precio ?? null;

    if (!perfil) {
      linea._netoBase = 0;
      return linea;
    }

    const P = linea._pax || 0;
    const T = linea._duracionMin || 0;
    const Q = linea._cantidad || 0;

    linea._netoBase =
      (perfil.Costo_Base_Fijo || 0) +
      (P * (perfil.Costo_Unitario_Pax || 0)) +
      (T * (perfil.Costo_Unitario_Tiempo || 0)) +
      (Q * (perfil.Costo_Unitario_Item || 0));

    return linea;
  }

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var logic$1 = {exports: {}};

  /* globals define,module */
  var logic = logic$1.exports;

  var hasRequiredLogic;

  function requireLogic () {
  	if (hasRequiredLogic) return logic$1.exports;
  	hasRequiredLogic = 1;
  	(function (module, exports$1) {
  (function(root, factory) {
  		  {
  		    module.exports = factory();
  		  }
  		}(logic, function() {
  		  /* globals console:false */

  		  if ( ! Array.isArray) {
  		    Array.isArray = function(arg) {
  		      return Object.prototype.toString.call(arg) === "[object Array]";
  		    };
  		  }

  		  /**
  		   * Return an array that contains no duplicates (original not modified)
  		   * @param  {array} array   Original reference array
  		   * @return {array}         New array with no duplicates
  		   */
  		  function arrayUnique(array) {
  		    var a = [];
  		    for (var i=0, l=array.length; i<l; i++) {
  		      if (a.indexOf(array[i]) === -1) {
  		        a.push(array[i]);
  		      }
  		    }
  		    return a;
  		  }

  		  var jsonLogic = {};
  		  var operations = {
  		    "==": function(a, b) {
  		      return a == b;
  		    },
  		    "===": function(a, b) {
  		      return a === b;
  		    },
  		    "!=": function(a, b) {
  		      return a != b;
  		    },
  		    "!==": function(a, b) {
  		      return a !== b;
  		    },
  		    ">": function(a, b) {
  		      return a > b;
  		    },
  		    ">=": function(a, b) {
  		      return a >= b;
  		    },
  		    "<": function(a, b, c) {
  		      return (c === undefined) ? a < b : (a < b) && (b < c);
  		    },
  		    "<=": function(a, b, c) {
  		      return (c === undefined) ? a <= b : (a <= b) && (b <= c);
  		    },
  		    "!!": function(a) {
  		      return jsonLogic.truthy(a);
  		    },
  		    "!": function(a) {
  		      return !jsonLogic.truthy(a);
  		    },
  		    "%": function(a, b) {
  		      return a % b;
  		    },
  		    "log": function(a) {
  		      console.log(a); return a;
  		    },
  		    "in": function(a, b) {
  		      if (!b || typeof b.indexOf === "undefined") return false;
  		      return (b.indexOf(a) !== -1);
  		    },
  		    "cat": function() {
  		      return Array.prototype.join.call(arguments, "");
  		    },
  		    "substr": function(source, start, end) {
  		      if (end < 0) {
  		        // JavaScript doesn't support negative end, this emulates PHP behavior
  		        var temp = String(source).substr(start);
  		        return temp.substr(0, temp.length + end);
  		      }
  		      return String(source).substr(start, end);
  		    },
  		    "+": function() {
  		      return Array.prototype.reduce.call(arguments, function(a, b) {
  		        return parseFloat(a, 10) + parseFloat(b, 10);
  		      }, 0);
  		    },
  		    "*": function() {
  		      return Array.prototype.reduce.call(arguments, function(a, b) {
  		        return parseFloat(a, 10) * parseFloat(b, 10);
  		      });
  		    },
  		    "-": function(a, b) {
  		      if (b === undefined) {
  		        return -a;
  		      } else {
  		        return a - b;
  		      }
  		    },
  		    "/": function(a, b) {
  		      return a / b;
  		    },
  		    "min": function() {
  		      return Math.min.apply(this, arguments);
  		    },
  		    "max": function() {
  		      return Math.max.apply(this, arguments);
  		    },
  		    "merge": function() {
  		      return Array.prototype.reduce.call(arguments, function(a, b) {
  		        return a.concat(b);
  		      }, []);
  		    },
  		    "var": function(a, b) {
  		      var not_found = (b === undefined) ? null : b;
  		      var data = this;
  		      if (typeof a === "undefined" || a==="" || a===null) {
  		        return data;
  		      }
  		      var sub_props = String(a).split(".");
  		      for (var i = 0; i < sub_props.length; i++) {
  		        if (data === null || data === undefined) {
  		          return not_found;
  		        }
  		        // Descending into data
  		        data = data[sub_props[i]];
  		        if (data === undefined) {
  		          return not_found;
  		        }
  		      }
  		      return data;
  		    },
  		    "missing": function() {
  		      /*
  		      Missing can receive many keys as many arguments, like {"missing:[1,2]}
  		      Missing can also receive *one* argument that is an array of keys,
  		      which typically happens if it's actually acting on the output of another command
  		      (like 'if' or 'merge')
  		      */

  		      var missing = [];
  		      var keys = Array.isArray(arguments[0]) ? arguments[0] : arguments;

  		      for (var i = 0; i < keys.length; i++) {
  		        var key = keys[i];
  		        var value = jsonLogic.apply({"var": key}, this);
  		        if (value === null || value === "") {
  		          missing.push(key);
  		        }
  		      }

  		      return missing;
  		    },
  		    "missing_some": function(need_count, options) {
  		      // missing_some takes two arguments, how many (minimum) items must be present, and an array of keys (just like 'missing') to check for presence.
  		      var are_missing = jsonLogic.apply({"missing": options}, this);

  		      if (options.length - are_missing.length >= need_count) {
  		        return [];
  		      } else {
  		        return are_missing;
  		      }
  		    },
  		  };

  		  jsonLogic.is_logic = function(logic) {
  		    return (
  		      typeof logic === "object" && // An object
  		      logic !== null && // but not null
  		      ! Array.isArray(logic) && // and not an array
  		      Object.keys(logic).length === 1 // with exactly one key
  		    );
  		  };

  		  /*
  		  This helper will defer to the JsonLogic spec as a tie-breaker when different language interpreters define different behavior for the truthiness of primitives.  E.g., PHP considers empty arrays to be falsy, but Javascript considers them to be truthy. JsonLogic, as an ecosystem, needs one consistent answer.

  		  Spec and rationale here: http://jsonlogic.com/truthy
  		  */
  		  jsonLogic.truthy = function(value) {
  		    if (Array.isArray(value) && value.length === 0) {
  		      return false;
  		    }
  		    return !! value;
  		  };


  		  jsonLogic.get_operator = function(logic) {
  		    return Object.keys(logic)[0];
  		  };

  		  jsonLogic.get_values = function(logic) {
  		    return logic[jsonLogic.get_operator(logic)];
  		  };

  		  jsonLogic.apply = function(logic, data) {
  		    // Does this array contain logic? Only one way to find out.
  		    if (Array.isArray(logic)) {
  		      return logic.map(function(l) {
  		        return jsonLogic.apply(l, data);
  		      });
  		    }
  		    // You've recursed to a primitive, stop!
  		    if ( ! jsonLogic.is_logic(logic) ) {
  		      return logic;
  		    }

  		    var op = jsonLogic.get_operator(logic);
  		    var values = logic[op];
  		    var i;
  		    var current;
  		    var scopedLogic;
  		    var scopedData;
  		    var initial;

  		    // easy syntax for unary operators, like {"var" : "x"} instead of strict {"var" : ["x"]}
  		    if ( ! Array.isArray(values)) {
  		      values = [values];
  		    }

  		    // 'if', 'and', and 'or' violate the normal rule of depth-first calculating consequents, let each manage recursion as needed.
  		    if (op === "if" || op == "?:") {
  		      /* 'if' should be called with a odd number of parameters, 3 or greater
  		      This works on the pattern:
  		      if( 0 ){ 1 }else{ 2 };
  		      if( 0 ){ 1 }else if( 2 ){ 3 }else{ 4 };
  		      if( 0 ){ 1 }else if( 2 ){ 3 }else if( 4 ){ 5 }else{ 6 };

  		      The implementation is:
  		      For pairs of values (0,1 then 2,3 then 4,5 etc)
  		      If the first evaluates truthy, evaluate and return the second
  		      If the first evaluates falsy, jump to the next pair (e.g, 0,1 to 2,3)
  		      given one parameter, evaluate and return it. (it's an Else and all the If/ElseIf were false)
  		      given 0 parameters, return NULL (not great practice, but there was no Else)
  		      */
  		      for (i = 0; i < values.length - 1; i += 2) {
  		        if ( jsonLogic.truthy( jsonLogic.apply(values[i], data) ) ) {
  		          return jsonLogic.apply(values[i+1], data);
  		        }
  		      }
  		      if (values.length === i+1) {
  		        return jsonLogic.apply(values[i], data);
  		      }
  		      return null;
  		    } else if (op === "and") { // Return first falsy, or last
  		      for (i=0; i < values.length; i+=1) {
  		        current = jsonLogic.apply(values[i], data);
  		        if ( ! jsonLogic.truthy(current)) {
  		          return current;
  		        }
  		      }
  		      return current; // Last
  		    } else if (op === "or") {// Return first truthy, or last
  		      for (i=0; i < values.length; i+=1) {
  		        current = jsonLogic.apply(values[i], data);
  		        if ( jsonLogic.truthy(current) ) {
  		          return current;
  		        }
  		      }
  		      return current; // Last
  		    } else if (op === "filter") {
  		      scopedData = jsonLogic.apply(values[0], data);
  		      scopedLogic = values[1];

  		      if ( ! Array.isArray(scopedData)) {
  		        return [];
  		      }
  		      // Return only the elements from the array in the first argument,
  		      // that return truthy when passed to the logic in the second argument.
  		      // For parity with JavaScript, reindex the returned array
  		      return scopedData.filter(function(datum) {
  		        return jsonLogic.truthy( jsonLogic.apply(scopedLogic, datum));
  		      });
  		    } else if (op === "map") {
  		      scopedData = jsonLogic.apply(values[0], data);
  		      scopedLogic = values[1];

  		      if ( ! Array.isArray(scopedData)) {
  		        return [];
  		      }

  		      return scopedData.map(function(datum) {
  		        return jsonLogic.apply(scopedLogic, datum);
  		      });
  		    } else if (op === "reduce") {
  		      scopedData = jsonLogic.apply(values[0], data);
  		      scopedLogic = values[1];
  		      initial = typeof values[2] !== "undefined" ? jsonLogic.apply(values[2], data) : null;

  		      if ( ! Array.isArray(scopedData)) {
  		        return initial;
  		      }

  		      return scopedData.reduce(
  		        function(accumulator, current) {
  		          return jsonLogic.apply(
  		            scopedLogic,
  		            {current: current, accumulator: accumulator}
  		          );
  		        },
  		        initial
  		      );
  		    } else if (op === "all") {
  		      scopedData = jsonLogic.apply(values[0], data);
  		      scopedLogic = values[1];
  		      // All of an empty set is false. Note, some and none have correct fallback after the for loop
  		      if ( ! Array.isArray(scopedData) || ! scopedData.length) {
  		        return false;
  		      }
  		      for (i=0; i < scopedData.length; i+=1) {
  		        if ( ! jsonLogic.truthy( jsonLogic.apply(scopedLogic, scopedData[i]) )) {
  		          return false; // First falsy, short circuit
  		        }
  		      }
  		      return true; // All were truthy
  		    } else if (op === "none") {
  		      scopedData = jsonLogic.apply(values[0], data);
  		      scopedLogic = values[1];

  		      if ( ! Array.isArray(scopedData) || ! scopedData.length) {
  		        return true;
  		      }
  		      for (i=0; i < scopedData.length; i+=1) {
  		        if ( jsonLogic.truthy( jsonLogic.apply(scopedLogic, scopedData[i]) )) {
  		          return false; // First truthy, short circuit
  		        }
  		      }
  		      return true; // None were truthy
  		    } else if (op === "some") {
  		      scopedData = jsonLogic.apply(values[0], data);
  		      scopedLogic = values[1];

  		      if ( ! Array.isArray(scopedData) || ! scopedData.length) {
  		        return false;
  		      }
  		      for (i=0; i < scopedData.length; i+=1) {
  		        if ( jsonLogic.truthy( jsonLogic.apply(scopedLogic, scopedData[i]) )) {
  		          return true; // First truthy, short circuit
  		        }
  		      }
  		      return false; // None were truthy
  		    }

  		    // Everyone else gets immediate depth-first recursion
  		    values = values.map(function(val) {
  		      return jsonLogic.apply(val, data);
  		    });


  		    // The operation is called with "data" bound to its "this" and "values" passed as arguments.
  		    // Structured commands like % or > can name formal arguments while flexible commands (like missing or merge) can operate on the pseudo-array arguments
  		    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
  		    if (operations.hasOwnProperty(op) && typeof operations[op] === "function") {
  		      return operations[op].apply(data, values);
  		    } else if (op.indexOf(".") > 0) { // Contains a dot, and not in the 0th position
  		      var sub_ops = String(op).split(".");
  		      var operation = operations;
  		      for (i = 0; i < sub_ops.length; i++) {
  		        if (!operation.hasOwnProperty(sub_ops[i])) {
  		          throw new Error("Unrecognized operation " + op +
  		            " (failed at " + sub_ops.slice(0, i+1).join(".") + ")");
  		        }
  		        // Descending into operations
  		        operation = operation[sub_ops[i]];
  		      }

  		      return operation.apply(data, values);
  		    }

  		    throw new Error("Unrecognized operation " + op );
  		  };

  		  jsonLogic.uses_data = function(logic) {
  		    var collection = [];

  		    if (jsonLogic.is_logic(logic)) {
  		      var op = jsonLogic.get_operator(logic);
  		      var values = logic[op];

  		      if ( ! Array.isArray(values)) {
  		        values = [values];
  		      }

  		      if (op === "var") {
  		        // This doesn't cover the case where the arg to var is itself a rule.
  		        collection.push(values[0]);
  		      } else {
  		        // Recursion!
  		        values.forEach(function(val) {
  		          collection.push.apply(collection, jsonLogic.uses_data(val) );
  		        });
  		      }
  		    }

  		    return arrayUnique(collection);
  		  };

  		  jsonLogic.add_operation = function(name, code) {
  		    operations[name] = code;
  		  };

  		  jsonLogic.rm_operation = function(name) {
  		    delete operations[name];
  		  };

  		  jsonLogic.rule_like = function(rule, pattern) {
  		    // console.log("Is ". JSON.stringify(rule) . " like " . JSON.stringify(pattern) . "?");
  		    if (pattern === rule) {
  		      return true;
  		    } // TODO : Deep object equivalency?
  		    if (pattern === "@") {
  		      return true;
  		    } // Wildcard!
  		    if (pattern === "number") {
  		      return (typeof rule === "number");
  		    }
  		    if (pattern === "string") {
  		      return (typeof rule === "string");
  		    }
  		    if (pattern === "array") {
  		      // !logic test might be superfluous in JavaScript
  		      return Array.isArray(rule) && ! jsonLogic.is_logic(rule);
  		    }

  		    if (jsonLogic.is_logic(pattern)) {
  		      if (jsonLogic.is_logic(rule)) {
  		        var pattern_op = jsonLogic.get_operator(pattern);
  		        var rule_op = jsonLogic.get_operator(rule);

  		        if (pattern_op === "@" || pattern_op === rule_op) {
  		          // echo "\nOperators match, go deeper\n";
  		          return jsonLogic.rule_like(
  		            jsonLogic.get_values(rule, false),
  		            jsonLogic.get_values(pattern, false)
  		          );
  		        }
  		      }
  		      return false; // pattern is logic, rule isn't, can't be eq
  		    }

  		    if (Array.isArray(pattern)) {
  		      if (Array.isArray(rule)) {
  		        if (pattern.length !== rule.length) {
  		          return false;
  		        }
  		        /*
  		          Note, array order MATTERS, because we're using this array test logic to consider arguments, where order can matter. (e.g., + is commutative, but '-' or 'if' or 'var' are NOT)
  		        */
  		        for (var i = 0; i < pattern.length; i += 1) {
  		          // If any fail, we fail
  		          if ( ! jsonLogic.rule_like(rule[i], pattern[i])) {
  		            return false;
  		          }
  		        }
  		        return true; // If they *all* passed, we pass
  		      } else {
  		        return false; // Pattern is array, rule isn't
  		      }
  		    }

  		    // Not logic, not array, not a === match for rule.
  		    return false;
  		  };

  		  return jsonLogic;
  		})); 
  	} (logic$1));
  	return logic$1.exports;
  }

  var logicExports = requireLogic();
  var jsonLogic = /*@__PURE__*/getDefaultExportFromCjs(logicExports);

  const _registry = new Map();

  function registerAction(name, handler) {
    _registry.set(name, handler);
  }

  function getActionHandler(name) {
    const handler = _registry.get(name);
    if (!handler) throw new Error(`Unknown action type: ${name}`);
    return handler;
  }

  registerAction('MULTIPLY', (payload, target) => {
    const delta = target.neto * (payload.factor - 1);
    return { delta, description: `\u00d7${payload.factor}` };
  });

  registerAction('ADD_FIXED', (payload, target) => {
    return { delta: payload.amount, description: `+${payload.amount}` };
  });

  registerAction('SET_VALUE', (payload, target) => {
    const delta = payload.value - target.neto;
    return { delta, description: `set to ${payload.value}` };
  });

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

  registerAction('SET_DEFAULT', (payload, target) => {
    const value = payload.value;
    return { delta: 0, value, field: payload.field, description: `default ${payload.field}=${value}` };
  });

  registerAction('ADD_ITEM', (payload, _target) => {
    return { delta: 0, itemId: payload.itemId, description: `auto-add ${payload.itemId}` };
  });

  registerAction('WARNING', (payload, _target) => {
    return { delta: 0, type: 'WARNING', message: payload.message, description: payload.message };
  });

  registerAction('ERROR', (payload, _target) => {
    return { delta: 0, type: 'ERROR', message: payload.message, description: payload.message };
  });

  registerAction('INVALIDATE_BASKET', (payload, _target) => {
    return { delta: 0, type: 'INVALIDATE', message: payload.message, description: `INVALID: ${payload.message}` };
  });

  function getRulesForStageAndHook(stage, hook, store) {
    return store
      .findAll('REGLAS_NEGOCIO', { Etapa: stage, Activo: true })
      .filter(r => !hook || !r.Hook || r.Hook === hook)
      .sort((a, b) => a.Prioridad - b.Prioridad);
  }

  function evaluateCondition(logic, data) {
    // Parse logic if it's a JSON string
    const parsedLogic = typeof logic === 'string' ? JSON.parse(logic) : logic;
    return jsonLogic.apply(parsedLogic, data);
  }

  function executeAction(tipoAccion, payload, target) {
    const handler = getActionHandler(tipoAccion);
    // Parse payload if it's a JSON string
    const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return handler(parsedPayload, target);
  }

  function applyLineAdjustments(lineas, store, hook = null) {
    const rules = getRulesForStageAndHook('AJUSTE_LINEA', hook, store);

    for (const linea of lineas) {
      linea._ajustes = [];
      linea._netoAjustado = linea._netoBase;

      for (const rule of rules) {
        if (!evaluateCondition(rule.Condicion_JSON, linea)) continue;

        const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { neto: linea._netoAjustado });
        linea._ajustes.push({ ruleId: rule.ID_Regla, ...result });
        linea._netoAjustado += result.delta;

        if (!rule.Acumulable) break;
      }
    }
  }

  function applyGlobalAdjustments(lineas, messages, store, hook = null) {
    const rules = getRulesForStageAndHook('AJUSTE_GLOBAL', hook, store);

    for (const rule of rules) {
      const subtotal = lineas.reduce((s, l) => s + l._netoAjustado, 0);
      const ctx = { subtotal, lineas };
      if (!evaluateCondition(rule.Condicion_JSON, ctx)) continue;

      const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { neto: subtotal });
      messages.push({ stage: 'AJUSTE_GLOBAL', ruleId: rule.ID_Regla, ...result });
    }
  }

  function applyManualAdjustments(lineas, ajustesManuales) {
    for (const linea of lineas) {
      linea._netoFinal = linea._netoAjustado ?? linea._netoBase;
      linea._ajusteManual = null;
    }

    for (const ajuste of ajustesManuales) {
      if (ajuste.Tipo_Ajuste === 'DESCUENTO_GLOBAL' || ajuste.Tipo_Ajuste === 'RECARGO') {
        continue; // global adjustments handled separately
      }

      const linea = lineas.find(l => l.ID_Linea === ajuste.ID_Linea);
      if (!linea) continue;

      linea._valorOriginal = linea._netoFinal;

      switch (ajuste.Tipo_Ajuste) {
        case 'OVERRIDE_PRECIO':
          linea._netoFinal = ajuste.Valor_Nuevo;
          break;
        case 'DESCUENTO_LINEA':
          linea._netoFinal -= ajuste.Valor_Nuevo;
          break;
      }

      linea._ajusteManual = ajuste;
    }
  }

  function getGlobalManualAdjustments(ajustesManuales) {
    return ajustesManuales.filter(
      a => a.Tipo_Ajuste === 'DESCUENTO_GLOBAL' || a.Tipo_Ajuste === 'RECARGO'
    );
  }

  function calculateTaxes(lineas, store, hook = null) {
    const subtotal = lineas.reduce(
      (sum, l) => sum + (l._netoFinal ?? l._netoAjustado ?? l._netoBase ?? 0), 0
    );

    const taxes = [];
    const rules = getRulesForStageAndHook('IMPUESTO', hook, store);

    for (const rule of rules) {
      if (!evaluateCondition(rule.Condicion_JSON, { subtotal, lineas })) continue;

      const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { subtotal });
      taxes.push({ name: result.name, rate: result.rate, amount: result.amount });
    }

    const totalTax = taxes.reduce((sum, t) => sum + t.amount, 0);

    return { subtotal, taxes, total: subtotal + totalTax };
  }

  // Pipeline recalculation primitives split from pipeline.js to avoid
  // circular imports with operations modules.


  const DEFAULT_FIELD_TO_LINE_KEY = {
    cantidad: '_cantidad',
    pax: '_pax',
    duracionMin: '_duracionMin',
    _cantidad: '_cantidad',
    _pax: '_pax',
    _duracionMin: '_duracionMin',
  };

  function applyCantidadDefaultRules(linea, store) {
    const rules = getRulesForStageAndHook('CANTIDAD_DEFAULT', null, store);
    if (!rules.length) return;

    for (const rule of rules) {
      if (!evaluateCondition(rule.Condicion_JSON, { linea })) continue;

      const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, {
        cantidad: linea._cantidad,
        pax: linea._pax,
        duracionMin: linea._duracionMin,
        linea,
      });

      const targetField = DEFAULT_FIELD_TO_LINE_KEY[result?.field] || null;
      if (targetField && Number.isFinite(result.value)) {
        linea[targetField] = result.value;
        continue;
      }

      if (Number.isFinite(result?.cantidad)) linea._cantidad = result.cantidad;
      if (Number.isFinite(result?.pax)) linea._pax = result.pax;
      if (Number.isFinite(result?.duracionMin)) linea._duracionMin = result.duracionMin;
      if (result?.field == null && Number.isFinite(result?.value)) linea._cantidad = result.value;
    }
  }

  function expandItemCompositions(linea, store) {
    return expandCompositions([linea], store);
  }

  function resolveItemDefaults(linea, paxGlobal, store) {
    resolveDefaults(linea, paxGlobal, store);
    applyCantidadDefaultRules(linea, store);
  }

  function recalculateItemPrice(linea, store) {
    calculateLinePrice(linea, store);
  }

  function applyItemRules(linea, store) {
    const errors = [];

    const restriccionRules = getRulesForStageAndHook('RESTRICCION_UI', null, store);
    for (const rule of restriccionRules) {
      if (!evaluateCondition(rule.Condicion_JSON, { linea })) continue;
      if (rule.Tipo_Accion === 'ERROR') {
        errors.push({
          ruleId: rule.ID_Regla,
          message: rule.Mensaje || rule.ID_Regla,
          blocking: true,
        });
      }
    }

    applyLineAdjustments([linea], store);

    return {
      linea,
      errors,
      adjustments: linea._ajustes || [],
    };
  }

  function aggregateBasketTotals(lineas, ajustesManuales, store) {
    const messages = [];

    applyGlobalAdjustments(lineas, messages, store);
    applyManualAdjustments(lineas, ajustesManuales);

    const totals = calculateTaxes(lineas, store);
    const globalManuals = getGlobalManualAdjustments(ajustesManuales);
    const globalDelta = globalManuals.reduce(
      (sum, a) =>
        a.Tipo_Ajuste === 'RECARGO' ? sum + a.Valor_Nuevo : sum - a.Valor_Nuevo,
      0
    );

    totals.subtotal += globalDelta;
    totals.total += globalDelta;

    return { totals, messages };
  }

  const STRUCTURAL_KEYS = new Set(['_source', '_parentItem', '_tipoPrecio', '_cantidadComp']);

  function stripComputedFields(lineas) {
    return lineas.map(linea => {
      const clean = {};
      for (const [k, v] of Object.entries(linea)) {
        if (!k.startsWith('_') || STRUCTURAL_KEYS.has(k)) {
          clean[k] = v;
        }
      }
      return clean;
    });
  }

  function fullRecalculateBasket(lineas, quotation, store) {
    const messages = [];
    const errors = [];
    const cleanedLineas = stripComputedFields(lineas);

    for (let i = 0; i < cleanedLineas.length; i++) {
      const linea = cleanedLineas[i];

      resolveItemDefaults(linea, quotation.paxGlobal, store);
      recalculateItemPrice(linea, store);

      const ruleResult = applyItemRules(linea, store);
      if (ruleResult.errors.length > 0) {
        errors.push(...ruleResult.errors);
      }
    }

    const { totals, messages: globalMessages } = aggregateBasketTotals(
      cleanedLineas,
      quotation.ajustesManuales,
      store
    );

    messages.push(...globalMessages);

    const basketValidationRules = getRulesForStageAndHook('RESTRICCION_UI', null, store);
    for (const rule of basketValidationRules) {
      if (!evaluateCondition(rule.Condicion_JSON, { lineas: cleanedLineas, quotation })) {
        continue;
      }
      if (rule.Tipo_Accion === 'ERROR') {
        errors.push({
          ruleId: rule.ID_Regla,
          message: rule.Mensaje || rule.ID_Regla,
          blocking: true,
        });
      }
    }

    return {
      lineas: cleanedLineas,
      totals,
      messages,
      errors,
    };
  }

  // Archivo: src/Config/Config_Schema.js
  // Versión: 3.2.0 (Input-only transactional + runtime calculation + JSON cache)
  // FUENTE DE VERDAD para estructura de datos del sistema.
  //
  // Principios:
  // - LINEA_DETALLE es tabla de inputs, no de resultados.
  // - Los cálculos se hacen en runtime y se cachean como JSON snapshot.
  // - No se borra data: toda modificación reescribe con Updated_At.
  // - Impuestos se aplican siempre al total, no por línea.

  const DATA_SCHEMA = {

    // ==========================================
    // BLOQUE 1: MASTER DATA (Configuración)
    // ==========================================

    CLIENTES: {
      description: "Base de datos de clientes.",
      columns: [
        { name: "ID_Cliente", type: "PK", desc: "Identificador" },
        { name: "Nombre_Empresa", type: "TEXT", desc: "Razón Social" },
        { name: "RUT", type: "TEXT", desc: "Identificador Fiscal" },
        { name: "Email", type: "TEXT", desc: "Contacto Principal" },
        { name: "Telefono", type: "TEXT", desc: "Contacto" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    CATEGORIAS: {
      description: "Configurador de dimensiones de pricing y defaults de UI por tipo de ítem.",
      columns: [
        { name: "ID_Categoria", type: "PK", desc: "Identificador categoría" },
        { name: "Nombre", type: "TEXT", desc: "Nombre visible" },
        { name: "ID_Perfil_Precio_Default", type: "FK", ref: "PERFILES_PRECIO", desc: "Perfil de precio base heredable" },
        { name: "Def_Requiere_Pax", type: "BOOLEAN", desc: "Pricing depende de pax (P)" },
        { name: "Def_Requiere_Cant", type: "BOOLEAN", desc: "Pricing depende de cantidad (Q)" },
        { name: "Def_Requiere_Tiempo", type: "BOOLEAN", desc: "Pricing depende de tiempo (T)" },
        { name: "Def_Requiere_Hora", type: "BOOLEAN", desc: "UI: mostrar selectores de hora" },
        { name: "Def_Duracion_Min", type: "INTEGER", desc: "Duración default en minutos" },
        { name: "Def_Unidades_Por_Pax", type: "DECIMAL", desc: "Calculador default: unidades por pax (ej: 0.33 = 1 cada 3)" },
        { name: "Icono_UI", type: "TEXT", desc: "Nombre de icono para UI" },
        { name: "Activo", type: "BOOLEAN", desc: "Vigencia" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    ITEM_CATALOGO: {
      description: "Inventario vendible. Hereda dimensiones de categoría, permite override de precio y calculador.",
      columns: [
        { name: "ID_Item", type: "PK", desc: "SKU único" },
        { name: "Nombre", type: "TEXT", desc: "Nombre comercial" },
        { name: "ID_Categoria", type: "FK", ref: "CATEGORIAS", desc: "Categoría base" },
        { name: "ID_Perfil_Precio_Override", type: "FK", ref: "PERFILES_PRECIO", desc: "Override de perfil de precio (si vacío, hereda de categoría)" },
        { name: "Def_Unidades_Por_Pax_Override", type: "DECIMAL", desc: "Override del calculador unidades/pax" },
        { name: "Default_Glosa", type: "TEXT", desc: "Descripción/comentario por defecto del ítem" },
        { name: "Activo", type: "BOOLEAN", desc: "Borrado lógico" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    PERFILES_PRECIO: {
      description: "Componentes base de precio. Fórmula: Neto = Base + (P * Cp) + (T * Ct) + (Q * Cq).",
      columns: [
        { name: "ID_Perfil_Precio", type: "PK", desc: "Identificador del perfil" },
        { name: "Nombre", type: "TEXT", desc: "Nombre legible (ej: Salon Base 4h)" },
        { name: "Costo_Base_Fijo", type: "MONEY", desc: "Base fija" },
        { name: "Costo_Unitario_Pax", type: "MONEY", desc: "Costo por pax" },
        { name: "Costo_Unitario_Tiempo", type: "MONEY", desc: "Costo por minuto/hora" },
        { name: "Costo_Unitario_Item", type: "MONEY", desc: "Costo por unidad/cantidad" },
        { name: "Activo", type: "BOOLEAN", desc: "Vigencia" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    COMPOSICION_KIT: {
      description: "Estructura recursiva Padre-Hijo para packs/kits.",
      columns: [
        { name: "ID_Composicion", type: "PK", desc: "ID relación" },
        { name: "ID_Item_Padre", type: "FK", ref: "ITEM_CATALOGO", desc: "Ítem comercial (pack/kit)" },
        { name: "ID_Item_Hijo", type: "FK", ref: "ITEM_CATALOGO", desc: "Ítem operativo" },
        { name: "Cantidad", type: "DECIMAL", desc: "Multiplicador" },
        { name: "Tipo_Precio", type: "ENUM", options: ["ABSORBIDO", "SUMAR"], desc: "Cómo contribuye al precio" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    REGLAS_NEGOCIO: {
      description: "Motor unificado de reglas por etapa. Cubre defaults de cantidad, restricciones, ajustes, sobreturno e impuestos.",
      columns: [
        { name: "ID_Regla", type: "PK", desc: "Identificador único" },
        { name: "Nombre", type: "TEXT", desc: "Nombre legible de la regla" },
        { name: "Etapa", type: "ENUM", options: ["CANTIDAD_DEFAULT", "RESTRICCION_UI", "AJUSTE_LINEA", "AJUSTE_GLOBAL", "IMPUESTO"], desc: "Fase del pipeline" },
        { name: "Scope", type: "ENUM", options: ["LINEA", "ITEM", "CATEGORIA", "COTIZACION", "CLIENTE", "COMPOSICION"], desc: "Alcance de aplicación" },
        { name: "Tipo_Accion", type: "ENUM", options: ["SET_VALUE", "MULTIPLY", "ADD_FIXED", "ADD_ITEM", "INVALIDATE_BASKET", "WARNING", "ERROR", "SET_TAX", "SET_DEFAULT"], desc: "Acción ejecutable" },
        { name: "Hook", type: "ENUM", options: ["pre_execution", "execute", "post_execution", null], desc: "Lifecycle hook filter (null = any)" },
        { name: "Condicion_JSON", type: "JSON", desc: "Predicado para activar la regla" },
        { name: "Payload_JSON", type: "JSON", desc: "Parámetros para ejecutar la acción" },
        { name: "Prioridad", type: "INTEGER", desc: "Orden de ejecución en su etapa" },
        { name: "Acumulable", type: "BOOLEAN", desc: "Si puede combinarse con otras reglas" },
        { name: "Activo", type: "BOOLEAN", desc: "Vigencia" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    // ==========================================
    // BLOQUE 2: TRANSACTIONAL DATA (Operación)
    // ==========================================

    COTIZACIONES: {
      description: "Encabezados de venta. Sin campos calculados — los totales se computan en runtime.",
      columns: [
        { name: "ID_Cotizacion", type: "PK", desc: "Folio" },
        { name: "ID_Cliente", type: "FK", ref: "CLIENTES", desc: "Cliente" },
        { name: "Estado", type: "ENUM", options: ["Borrador", "Enviada", "Pendiente_Aprobacion", "Aprobada", "Finalizada"], desc: "Workflow" },
        { name: "Fecha_Evento", type: "DATE", desc: "Inicio del evento" },
        { name: "Duracion_Dias", type: "INTEGER", desc: "Duración global" },
        { name: "Pax_Global", type: "INTEGER", desc: "Pax base" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    LINEA_DETALLE: {
      description: "Inputs de venta. Solo datos de entrada y overrides del usuario. Sin cálculos.",
      columns: [
        { name: "ID_Linea", type: "PK", desc: "ID único" },
        { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Cotización padre" },
        { name: "ID_Item", type: "FK", ref: "ITEM_CATALOGO", desc: "Ítem de catálogo" },
        { name: "Estado_Linea", type: "ENUM", options: ["ACTIVA", "REMOVIDA"], desc: "Estado de ciclo de vida; no se elimina historial" },
        { name: "Dia_Numero", type: "INTEGER", desc: "Día relativo (1..N)" },
        { name: "Hora_Inicio", type: "TIME", desc: "Inicio servicio (si aplica)" },
        { name: "Override_Pax", type: "INTEGER", desc: "Pax override por usuario (nullable, si vacío usa global)" },
        { name: "Override_Cantidad", type: "DECIMAL", desc: "Cantidad override por usuario (nullable, si vacío usa calculador)" },
        { name: "Override_Duracion_Min", type: "INTEGER", desc: "Duración override en minutos (nullable, si vacío usa default)" },
        { name: "Comentarios", type: "TEXT", desc: "Observaciones/justificación" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    AJUSTES_COTIZACION: {
      description: "Intervenciones manuales del usuario sobre los cálculos automáticos. Traza de 'el sistema dijo X, el usuario cambió a Y'.",
      columns: [
        { name: "ID_Ajuste", type: "PK", desc: "Identificador" },
        { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Cotización afectada" },
        { name: "ID_Linea", type: "FK", ref: "LINEA_DETALLE", desc: "Línea afectada (nullable para ajustes globales)" },
        { name: "Tipo_Ajuste", type: "ENUM", options: ["OVERRIDE_PRECIO", "OVERRIDE_PAX", "OVERRIDE_CANTIDAD", "OVERRIDE_DURACION", "DESCUENTO_LINEA", "DESCUENTO_GLOBAL", "RECARGO"], desc: "Tipo de intervención" },
        { name: "Valor_Original", type: "MONEY", desc: "Lo que calculó el sistema" },
        { name: "Valor_Nuevo", type: "MONEY", desc: "Lo que el usuario puso" },
        { name: "Motivo", type: "TEXT", desc: "Justificación del cambio" },
        { name: "Usuario", type: "TEXT", desc: "Quién hizo el ajuste" },
        { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
      ]
    },

    // ==========================================
    // BLOQUE 3: CACHE Y AUDITORÍA
    // ==========================================

    CACHE_COTIZACION: {
      description: "JSON snapshot de resultados calculados. Regenerable en cualquier momento. Consumido por frontend.",
      columns: [
        { name: "ID_Cotizacion", type: "PK/FK", ref: "COTIZACIONES", desc: "1:1 con cotización" },
        { name: "Snapshot_JSON", type: "JSON", desc: "Resultado completo: líneas con precios, subtotales, impuestos, totales, reglas aplicadas" },
        { name: "Updated_At", type: "DATETIME", desc: "Última regeneración" }
      ]
    },

    HISTORIAL_COTIZACION: {
      description: "Auditoría de cambios.",
      columns: [
        { name: "ID_Log", type: "PK", desc: "ID evento" },
        { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Target" },
        { name: "Timestamp", type: "DATETIME", desc: "Cuándo" },
        { name: "Usuario", type: "TEXT", desc: "Quién" },
        { name: "Accion", type: "TEXT", desc: "Qué hizo" },
        { name: "Detalle_Cambio", type: "JSON", desc: "Valores ant/nue" }
      ]
    }
  };

  // XState actions for the quotation machine.
  // Thin adapters that delegate orchestration to pricing module functions.
  // Each action is a pure assign — no side effects outside of context mutation.
  //
  // Import paths assume the merged project structure (src/Pricing/ + src/Orchestration/).
  // In the worktree phase, configure your bundler to resolve these from the pricing branch.


  // --- Helpers ---

  function nextId(quotation) {
    quotation._lineSeq = (quotation._lineSeq || 0) + 1;
    return `LIN_${quotation._lineSeq}`;
  }

  function buildSchemaMetadata(schema) {
    const primaryKeyByTable = {};
    const tablesByIdField = {};

    for (const [tableName, tableSchema] of Object.entries(schema || {})) {
      const pkColumn = (tableSchema.columns || []).find((column) => String(column.type || '').includes('PK'));
      if (!pkColumn) continue;

      primaryKeyByTable[tableName] = pkColumn.name;

      if (!tablesByIdField[pkColumn.name]) {
        tablesByIdField[pkColumn.name] = [];
      }
      tablesByIdField[pkColumn.name].push(tableName);
    }

    return { primaryKeyByTable, tablesByIdField };
  }

  const SCHEMA_METADATA = buildSchemaMetadata(DATA_SCHEMA);
  const TABLE_PRIMARY_KEY = SCHEMA_METADATA.primaryKeyByTable;

  function parseSnapshot(value) {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  function getCachedQuotation(store, cotizacionId) {
    if (!store || !cotizacionId) return null;
    if (typeof store.findById === 'function') {
      const found = store.findById('CACHE_COTIZACION', 'ID_Cotizacion', cotizacionId);
      if (found) return found;
    }
    if (typeof store.findAll === 'function') {
      const matches = store.findAll('CACHE_COTIZACION', { ID_Cotizacion: cotizacionId });
      if (Array.isArray(matches) && matches.length > 0) return matches[0];
    }
    return null;
  }

  function hydrateLoadedQuotation(record) {
    const snapshot = parseSnapshot(record.Snapshot_JSON || record);
    if (!snapshot || !snapshot.cotizacion) return null;

    return {
      quotation: {
        cotizacion: { ...snapshot.cotizacion },
        paxGlobal: snapshot.cotizacion.Pax_Global ?? snapshot.paxGlobal ?? 0,
        ajustesManuales: Array.isArray(snapshot.ajustesManuales)
          ? [...snapshot.ajustesManuales]
          : [],
        _lineSeq: Array.isArray(snapshot.lineas) ? snapshot.lineas.length : 0,
      },
      lineas: Array.isArray(snapshot.lineas) ? snapshot.lineas.map(l => ({ ...l })) : [],
      totals: snapshot.totals || { subtotal: 0, taxes: [], total: 0 },
    };
  }

  function inferTableNameFromRecord(record = {}) {
    if (!record || typeof record !== 'object') return null;

    const idFields = Object.keys(record).filter((key) => {
      const value = record[key];
      return key.startsWith('ID_') && value !== undefined && value !== null && value !== '';
    });

    if (idFields.length === 0) return null;

    for (const idField of idFields) {
      const candidates = SCHEMA_METADATA.tablesByIdField[idField] || [];
      if (candidates.length === 1) {
        return candidates[0];
      }
    }

    return null;
  }

  function resolveTableName(event, context) {
    return (
      event.tableName
      || event.modifiedData?.tableName
      || event.newRowData?.tableName
      || context.selectedRowData?._tableName
      || inferTableNameFromRecord(context.selectedRowData)
      || inferTableNameFromRecord(event.modifiedData)
      || inferTableNameFromRecord(event.newRowData)
    );
  }

  function resolvePrimaryKey(tableName, row = {}) {
    if (!tableName) return null;
    const mapped = TABLE_PRIMARY_KEY[tableName];
    if (mapped) return mapped;
    const dynamic = Object.keys(row).find(key => key.startsWith('ID_'));
    return dynamic || null;
  }

  function upsertWithSeed(store, tableName, row, primaryKey) {
    if (!store || typeof store.all !== 'function' || typeof store.seed !== 'function') return;
    const existing = store.all(tableName);
    const next = Array.isArray(existing) ? [...existing] : [];
    const rowId = row[primaryKey];
    const idx = next.findIndex(entry => String(entry[primaryKey]) === String(rowId));

    if (idx >= 0) {
      next[idx] = { ...next[idx], ...row };
    } else {
      next.push({ ...row });
    }

    store.seed(tableName, next);
  }

  function persistRowUpdate(store, tableName, row) {
    const primaryKey = resolvePrimaryKey(tableName, row);
    if (!store || !tableName || !primaryKey) return;

    if (typeof store.update === 'function') {
      try {
        store.update(tableName, row);
        return;
      } catch {
        try {
          store.update(row);
          return;
        } catch {
        }
      }
    }

    upsertWithSeed(store, tableName, row, primaryKey);
  }

  function persistRowInsert(store, tableName, row) {
    if (!store || !tableName) return;
    if (typeof store.insert === 'function') {
      try {
        store.insert(tableName, row);
        return;
      } catch {
        try {
          store.insert(row);
          return;
        } catch {
        }
      }
    }

    const primaryKey = resolvePrimaryKey(tableName, row);
    if (primaryKey) {
      upsertWithSeed(store, tableName, row, primaryKey);
    }
  }

  // --- Browse Actions ---

  const browseActions = {
    listPreviousQuotations: assign(({ context }) => {
      if (!context.store || typeof context.store.findAll !== 'function') {
        return { previousQuotations: [] };
      }

      const rows = context.store.findAll('CACHE_COTIZACION', {});
      const previousQuotations = rows
        .map((row) => {
          const snapshot = parseSnapshot(row.Snapshot_JSON);
          if (!snapshot || !snapshot.cotizacion) return null;
          return {
            cotizacionId: row.ID_Cotizacion,
            estado: snapshot.cotizacion.Estado || 'Borrador',
            clienteId: snapshot.cotizacion.ID_Cliente || null,
            fechaEvento: snapshot.cotizacion.Fecha_Evento || null,
            total: snapshot.totals?.total || 0,
            updatedAt: row.Updated_At || null,
          };
        })
        .filter(Boolean);

      return { previousQuotations };
    }),

    loadPreviousQuotation: assign(({ context, event }) => {
      const { cotizacionId } = event;
      const row = getCachedQuotation(context.store, cotizacionId);
      if (!row) {
        return {
          errors: [
            ...context.errors,
            {
              source: 'load',
              blocking: true,
              message: `Quotation not found: ${cotizacionId}`,
            },
          ],
        };
      }

      const loaded = hydrateLoadedQuotation(row);
      if (!loaded) {
        return {
          errors: [
            ...context.errors,
            {
              source: 'load',
              blocking: true,
              message: `Invalid quotation snapshot: ${cotizacionId}`,
            },
          ],
        };
      }

      return {
        ...loaded,
        messages: context.messages,
        errors: context.errors.filter(error => error.source !== 'load'),
      };
    }),
  };

  // --- Initialization Actions ---

  const initActions = {
    initializeBasketFromLoaded: assign(({ event }) => {
      const quotation = event.data; // From loaded quotation
      return {
        quotation,
        lineas: quotation.lineas || [],
        totals: quotation.totals || { subtotal: 0, taxes: [], total: 0 },
        messages: [],
        errors: [],
      };
    }),

    initializeEmptyBasket: assign(({ event }) => {
      const { paxGlobal, clienteId, fechaEvento, duracionDias, cotizacionId } =
        event;
      return {
        quotation: {
          cotizacion: {
            ID_Cotizacion: cotizacionId || `COT_${Date.now()}`,
            ID_Cliente: clienteId,
            Fecha_Evento: fechaEvento ?? null,
            Duracion_Dias: duracionDias ?? null,
            Pax_Global: paxGlobal,
            Estado: 'Borrador',
          },
          paxGlobal,
          ajustesManuales: [],
          _lineSeq: 0,
        },
        lineas: [],
        totals: { subtotal: 0, taxes: [], total: 0 },
        messages: [],
        errors: [],
      };
    }),

    captureError: assign(({ context, event }) => ({
      errors: [
        ...context.errors,
        { source: 'initialization', message: event.error?.message || 'Error' },
      ],
    })),
  };

  // --- Basket Mutation Actions (Thin adapters calling pricing module) ---

  /**
   * Update quotation-level settings (paxGlobal, fechaEvento, duracionDias).
   * Default policy: recalculateExistingLines=false (no surprise repricing of existing lines).
   */
  function applyQuotationSettingsToContext(context, event) {
    const { paxGlobal, fechaEvento, duracionDias, recalculateExistingLines = false } = event;
    const cotizacion = { ...context.quotation.cotizacion };

    if (paxGlobal !== undefined) cotizacion.Pax_Global = paxGlobal;
    if (fechaEvento !== undefined) cotizacion.Fecha_Evento = fechaEvento;
    if (duracionDias !== undefined) cotizacion.Duracion_Dias = duracionDias;

    const quotation = {
      ...context.quotation,
      cotizacion,
      ...(paxGlobal !== undefined ? { paxGlobal } : {}),
    };

    if (!recalculateExistingLines) {
      return { quotation };
    }

    const result = fullRecalculateBasket(context.lineas, quotation, context.store);
    return {
      quotation,
      lineas: result.lineas,
      totals: result.totals,
      messages: [...context.messages, ...result.messages],
      errors: result.errors,
    };
  }

  const basketActions = {
    updateQuotationSettings: assign(({ context, event }) =>
      applyQuotationSettingsToContext(context, event)
    ),

    /**
     * Add item to basket.
     * Delegates to pricing module: expandItemCompositions → resolveItemDefaults → recalculateItemPrice → applyItemRules → aggregateBasketTotals
     */
    addItem: assign(({ context, event }) => {
      const { itemId, overrides = {} } = event;
      const { store } = context;
      const quotation = { ...context.quotation };
      const selectedItem = store.findById('ITEM_CATALOGO', 'ID_Item', itemId);
      const overrideComment = overrides.Comentarios;
      const defaultComment = selectedItem && selectedItem.Default_Glosa
        ? String(selectedItem.Default_Glosa)
        : '';

      const baseLine = {
        ID_Linea: nextId(quotation),
        ID_Cotizacion: quotation.cotizacion.ID_Cotizacion,
        ID_Item: itemId,
        Nombre: selectedItem?.Nombre || itemId,
        Override_Pax: overrides.Override_Pax ?? null,
        Override_Cantidad: overrides.Override_Cantidad ?? null,
        Override_Duracion_Min: overrides.Override_Duracion_Min ?? null,
        Comentarios: overrideComment !== undefined ? overrideComment : defaultComment,
        Dia: overrides.Dia ?? null,
        Hora: overrides.Hora ?? null,
      };

      // Step 1: Expand compositions
      const expanded = expandItemCompositions(baseLine, store).map(line =>
        line === baseLine ? line : { ...line, ID_Linea: nextId(quotation) }
      );
      const newErrors = [];
      for (const linea of expanded) {
        if (linea.Comentarios === undefined || linea.Comentarios === null || linea.Comentarios === '') {
          const item = store.findById('ITEM_CATALOGO', 'ID_Item', linea.ID_Item);
          if (item && item.Default_Glosa) {
            linea.Comentarios = String(item.Default_Glosa);
          }
        }
        resolveItemDefaults(linea, quotation.paxGlobal, store);
        recalculateItemPrice(linea, store);
        const ruleResult = applyItemRules(linea, store);
        if (ruleResult.errors.length > 0) {
          newErrors.push(...ruleResult.errors);
        }
      }

      // Step 5: Update global totals
      const { totals, messages: globalMessages } = aggregateBasketTotals(
        [...context.lineas, ...expanded],
        quotation.ajustesManuales,
        store
      );

      return {
        quotation,
        lineas: [...context.lineas, ...expanded],
        totals,
        messages: [...context.messages, ...globalMessages],
        errors: [...context.errors, ...newErrors],
      };
    }),

    /**
     * Update item in basket.
     * Delegates to pricing module: resolveItemDefaults → recalculateItemPrice → applyItemRules → aggregateBasketTotals
     */
    updateItem: assign(({ context, event }) => {
      const { lineId, overrides = {} } = event;
      const { store } = context;

      // Find and update the line
      const updated = context.lineas.map(linea => {
        if (linea.ID_Linea !== lineId) return linea;
        const next = { ...linea };
        if (overrides.Override_Pax !== undefined) next.Override_Pax = overrides.Override_Pax;
        if (overrides.Override_Cantidad !== undefined)
          next.Override_Cantidad = overrides.Override_Cantidad;
        if (overrides.Override_Duracion_Min !== undefined)
          next.Override_Duracion_Min = overrides.Override_Duracion_Min;
        if (overrides.Comentarios !== undefined)
          next.Comentarios = overrides.Comentarios;
        if (overrides.Dia !== undefined) next.Dia = overrides.Dia;
        if (overrides.Hora !== undefined) next.Hora = overrides.Hora;
        return next;
      });

      // Re-price the updated line
      const targetLinea = updated.find(l => l.ID_Linea === lineId);
      if (targetLinea) {
        resolveItemDefaults(targetLinea, context.quotation.paxGlobal, store);
        recalculateItemPrice(targetLinea, store);
        applyItemRules(targetLinea, store);
      }

      // Update global totals
      const { totals, messages } = aggregateBasketTotals(
        updated,
        context.quotation.ajustesManuales,
        store
      );

      return {
        lineas: updated,
        totals,
        messages: [...context.messages, ...messages],
      };
    }),

    /**
     * Remove item from basket (soft delete).
     * Marks as removed but keeps in history for replay/recovery.
     * Delegates to pricing module: aggregateBasketTotals (with filtered display items)
     */
    removeItem: assign(({ context, event }) => {
      const { lineId } = event;

      // Mark as removed but keep in history
      const updated = context.lineas.map(linea => {
        if (linea.ID_Linea === lineId) {
          return { ...linea, _removed: true };
        }
        return linea;
      });

      // Filter out from displayed cart (but keep in history)
      const displayed = updated.filter(l => !l._removed);

      // Recalc with only displayed items
      const { totals, messages } = aggregateBasketTotals(
        displayed,
        context.quotation.ajustesManuales,
        context.store
      );

      return {
        lineas: updated, // Keep full history
        totals,
        messages: [...context.messages, ...messages],
      };
    }),

    /**
     * Discard quotation and return to browse.
     * Clears all quotation context.
     */
    discardQuotation: assign(() => ({
      quotation: null,
      lineas: [],
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages: [],
      errors: [],
    })),
  };

  // --- Validation Actions (LEVEL 2 recalculation) ---

  /**
   * Validate and save quotation.
   * Delegates to pricing module: fullRecalculateBasket (strips computed fields, runs full pipeline, validates rules)
   * Then saves to store and marks quotation as 'Guardada'.
   */
  const validationActions = {
    validateAndSave: assign(({ context }) => {
      // Full recalculation (LEVEL 2)
      const result = fullRecalculateBasket(
        context.lineas,
        context.quotation,
        context.store
      );

      // If there are blocking errors, validation fails
      if (result.errors.some(e => e.blocking)) {
        return {
          errors: result.errors,
        };
      }

      // Save to store
      const { quotation, lineas, totals, store } = context;
      const snapshot = {
        cotizacion: { ...quotation.cotizacion },
        lineas: result.lineas.map(l => ({ ...l })),
        totals: result.totals,
        ajustesManuales: [...quotation.ajustesManuales],
      };

      store.insert('CACHE_COTIZACION', {
        ID_Cotizacion: quotation.cotizacion.ID_Cotizacion,
        Snapshot_JSON: JSON.stringify(snapshot),
        Updated_At: new Date().toISOString(),
      });

      return {
        lineas: result.lineas,
        totals: result.totals,
        messages: result.messages,
        errors: result.errors,
        quotation: {
          ...quotation,
          cotizacion: { ...quotation.cotizacion, Estado: 'Guardada' },
        },
      };
    }),
  };

  // --- Context Management ---

  const contextActions = {
    clearQuotationContext: assign(() => ({
      quotation: null,
      lineas: [],
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages: [],
      errors: [],
    })),
  };

  // --- Database Management Actions ---

  const databaseActions = {
    selectRowToModify: assign(({ event }) => {
      const { rowId, rowData } = event;
      return {
        selectedRowId: rowId,
        selectedRowData: rowData,
        databaseUIState: 'modify_row',
      };
    }),

    saveRowModification: assign(({ context, event }) => {
      const { modifiedData } = event;
      const tableName = resolveTableName(event, context);
      if (context.store && tableName) {
        const base = context.selectedRowData || {};
        const row = {
          ...base,
          ...modifiedData,
        };
        delete row._tableName;
        persistRowUpdate(context.store, tableName, row);
      }

      return {
        selectedRowId: null,
        selectedRowData: null,
        databaseUIState: 'browse_database',
      };
    }),

    cancelRowModification: assign(() => ({
      selectedRowId: null,
      selectedRowData: null,
      databaseUIState: 'browse_database',
    })),

    saveNewRow: assign(({ context, event }) => {
      const { newRowData } = event;
      const tableName = resolveTableName(event, context);
      if (context.store && tableName && newRowData) {
        const row = { ...newRowData };
        delete row._tableName;
        persistRowInsert(context.store, tableName, row);
      }
      return {
        databaseUIState: 'browse_database',
      };
    }),

    cancelAddRow: assign(() => ({
      databaseUIState: 'browse_database',
    })),

    /**
     * Full recalculation when closing database.
     * Catches any price changes from database modifications (new rules, catalog updates, etc).
     * Delegates to pricing module: fullRecalculateBasket
     */
    fullRecalculateOnDatabaseClose: assign(({ context }) => {
      if (!context.quotation) {
        return { databaseOpen: false };
      }

      const result = fullRecalculateBasket(
        context.lineas,
        context.quotation,
        context.store
      );

      return {
        databaseOpen: false,
        lineas: result.lineas,
        totals: result.totals,
        messages: [...context.messages, ...result.messages],
        errors: result.errors,
      };
    }),
  };

  // --- Combine all actions ---

  const actions = {
    ...browseActions,
    ...initActions,
    ...basketActions,
    ...validationActions,
    ...contextActions,
    ...databaseActions,
  };

  // Async services (actors) for the quotation machine.
  // Each service receives the full context (passed via invoke.input in the blueprint).
  // They must return a plain result object — context mutations happen via onDone actions.
  //
  // Note: Services are not used in the current thin adapter design,
  // but are kept for future async operations (email, PDF generation, etc).

  /**
   * Save quotation to store.
   * Called when validation is complete.
   */
  async function saveQuotationService({ quotation, lineas, totals, store }) {
    if (!lineas.length) throw new Error('Cannot save empty quotation');

    const snapshot = {
      cotizacion: { ...quotation.cotizacion },
      lineas: lineas.map(l => ({ ...l })),
      totals: { ...totals },
      ajustesManuales: [...quotation.ajustesManuales],
    };

    store.insert('CACHE_COTIZACION', {
      ID_Cotizacion: quotation.cotizacion.ID_Cotizacion,
      Snapshot_JSON: JSON.stringify(snapshot),
      Updated_At: new Date().toISOString(),
    });

    return { cotizacionId: quotation.cotizacion.ID_Cotizacion };
  }

  /**
   * Send quotation via email or other channel.
   * Called after quotation is saved.
   * Stub for now — implementation depends on external system (GAS, webhook, etc).
   */
  async function sendQuotationService({ quotation }) {
    if (quotation.cotizacion.Estado !== 'Guardada') {
      throw new Error('Quotation must be saved before sending');
    }

    const payload = {
      cotizacionId: quotation.cotizacion.ID_Cotizacion,
      clienteId: quotation.cotizacion.ID_Cliente,
      fechaEvento: quotation.cotizacion.Fecha_Evento,
      estado: quotation.cotizacion.Estado,
      sentAt: new Date().toISOString(),
    };

    if (typeof quotation.sendTransport === 'function') {
      const response = await quotation.sendTransport(payload);
      return {
        cotizacionId: quotation.cotizacion.ID_Cotizacion,
        status: 'sent',
        transport: response?.transport || 'custom',
        response: response || null,
      };
    }

    return {
      cotizacionId: quotation.cotizacion.ID_Cotizacion,
      status: 'queued',
      transport: 'local-fallback',
      payload,
    };
  }

  // Assembles guards, actions, and services into the adapter object
  // expected by createQuotationXStateMachine().
  //
  // XState v5: fromPromise is available and services are wrapped as proper actors.
  // XState v4: fromPromise is undefined and services remain plain async functions.
  //
  // Adapters are thin wrappers:
  // - Guards: pure context/event predicates
  // - Actions: assign() functions that call pricing module
  // - Services: async functions for external operations (optional for now)


  // fromPromise only exists in XState v5
  const { fromPromise } = xstate;

  function wrapService(fn) {
    return fromPromise
      ? fromPromise(({ input }) => fn(input))
      : fn;
  }

  const actors = {
    saveQuotationService: wrapService(saveQuotationService),
    sendQuotationService: wrapService(sendQuotationService),
  };

  const services = {
    saveQuotationService: ctx => saveQuotationService(ctx),
    sendQuotationService: ctx => sendQuotationService(ctx),
  };

  const quotationAdapters = { guards, actions, services, actors };

  class TableInMemoryStore {
    constructor() {
      this._tables = new Map();
    }

    seed(tableName, rows) {
      this._tables.set(tableName, [...rows]);
    }

    insert(tableName, row) {
      if (!this._tables.has(tableName)) this._tables.set(tableName, []);
      this._tables.get(tableName).push(row);
    }

    all(tableName) {
      return this._tables.get(tableName) || [];
    }

    findById(tableName, pkField, id) {
      return this.all(tableName).find((row) => row[pkField] === id) || null;
    }

    findAll(tableName, filters = {}) {
      const entries = Object.entries(filters);
      if (!entries.length) return this.all(tableName);

      return this.all(tableName).filter((row) => entries.every(([key, value]) => row[key] === value));
    }

    findByFK(tableName, fkField, value) {
      return this.all(tableName).filter((row) => row[fkField] === value);
    }
  }

  /**
   * Creates a seeded InMemoryStore with the same seed data as GAS initialization.
   *
   * This ensures LOCAL and GAS have identical reference data for consistent testing.
   * Source: packages/database/src/services/initializeService.js (populateSeedData)
   *
   * For tests requiring specific pricing values, see createPricingTestStore()
   *
   * Used across all test suites to ensure consistent store state.
   */
  function createSeededStore() {
    const store = new TableInMemoryStore();
    const now = new Date().toISOString();

    // ============================================================================
    // SEED DATA: Identical to GAS initialization (initializeService.js line 62)
    // ============================================================================

    // PERFILES_PRECIO - Pricing profiles (same as GAS)
    // Source: initializeService.js lines 67-72
    store.seed('PERFILES_PRECIO', [
      {
        ID_Perfil_Precio: 'PROF_COFFEE',
        Nombre: 'Coffee Intermedio',
        Costo_Base_Fijo: 0,
        Costo_Unitario_Pax: 5500,
        Costo_Unitario_Tiempo: 0,
        Costo_Unitario_Item: 0,
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Perfil_Precio: 'PROF_SALON',
        Nombre: 'Salón Standard',
        Costo_Base_Fijo: 220000,
        Costo_Unitario_Pax: 0,
        Costo_Unitario_Tiempo: 0,
        Costo_Unitario_Item: 0,
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Perfil_Precio: 'PROF_ALMUERZOS',
        Nombre: 'Almuerzos Buffet',
        Costo_Base_Fijo: 0,
        Costo_Unitario_Pax: 15000,
        Costo_Unitario_Tiempo: 0,
        Costo_Unitario_Item: 0,
        Activo: true,
        Updated_At: now,
      },
    ]);

    // CATEGORIAS - Item categories (same as GAS)
    // Source: initializeService.js lines 76-81
    store.seed('CATEGORIAS', [
      {
        ID_Categoria: 'CAT_CAFE',
        Nombre: 'Cafés',
        ID_Perfil_Precio_Default: 'PROF_COFFEE',
        Def_Requiere_Pax: true,
        Def_Requiere_Cant: false,
        Def_Requiere_Tiempo: false,
        Def_Requiere_Hora: false,
        Def_Duracion_Min: 0,
        Def_Unidades_Por_Pax: 1,
        Icono_UI: '☕',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Categoria: 'CAT_SALONES',
        Nombre: 'Salones',
        ID_Perfil_Precio_Default: 'PROF_SALON',
        Def_Requiere_Pax: false,
        Def_Requiere_Cant: false,
        Def_Requiere_Tiempo: false,
        Def_Requiere_Hora: true,
        Def_Duracion_Min: 240,
        Def_Unidades_Por_Pax: 1,
        Icono_UI: '🏛️',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Categoria: 'CAT_COMIDAS',
        Nombre: 'Comidas',
        ID_Perfil_Precio_Default: 'PROF_ALMUERZOS',
        Def_Requiere_Pax: true,
        Def_Requiere_Cant: false,
        Def_Requiere_Tiempo: false,
        Def_Requiere_Hora: true,
        Def_Duracion_Min: 120,
        Def_Unidades_Por_Pax: 1,
        Icono_UI: '🍽️',
        Activo: true,
        Updated_At: now,
      },
    ]);

    // ITEM_CATALOGO - Catalog items (GAS + test composition pack)
    // Source: initializeService.js lines 85-90, plus pack for composition testing
    store.seed('ITEM_CATALOGO', [
      {
        ID_Item: 'ITEM_COFFEE_INT',
        Nombre: 'Coffee Intermedio',
        ID_Categoria: 'CAT_CAFE',
        ID_Perfil_Precio_Override: '',
        Def_Unidades_Por_Pax_Override: '',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Item: 'ITEM_COFFEE_BASIC',
        Nombre: 'Coffee Basico',
        ID_Categoria: 'CAT_CAFE',
        ID_Perfil_Precio_Override: 'PROF_COFFEE',
        Def_Unidades_Por_Pax_Override: '',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Item: 'ITEM_SALON_FARIO',
        Nombre: 'Salón Fario',
        ID_Categoria: 'CAT_SALONES',
        ID_Perfil_Precio_Override: 'PROF_SALON',
        Def_Unidades_Por_Pax_Override: '',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Item: 'ITEM_CHINOOK',
        Nombre: 'Salon Chinook',
        ID_Categoria: 'CAT_SALONES',
        ID_Perfil_Precio_Override: 'PROF_SALON',
        Def_Unidades_Por_Pax_Override: '',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Item: 'ITEM_ALMUERZO_PARRILLA',
        Nombre: 'Almuerzos Buffet Parrilla',
        ID_Categoria: 'CAT_COMIDAS',
        ID_Perfil_Precio_Override: 'PROF_ALMUERZOS',
        Def_Unidades_Por_Pax_Override: '',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Item: 'ITEM_ALMUERZO',
        Nombre: 'Almuerzo Basico',
        ID_Categoria: 'CAT_COMIDAS',
        ID_Perfil_Precio_Override: 'PROF_ALMUERZOS',
        Def_Unidades_Por_Pax_Override: '',
        Activo: true,
        Updated_At: now,
      },
      {
        ID_Item: 'PACK_COFFEE_COMPLETO',
        Nombre: 'Pack Café Completo',
        ID_Categoria: 'CAT_CAFE',
        ID_Perfil_Precio_Override: '',
        Def_Unidades_Por_Pax_Override: '',
        Activo: true,
        Updated_At: now,
      },
    ]);

    // CLIENTES - Seed a few for local dev/testing (users create more in production)
    store.seed('CLIENTES', [
      { ID_Cliente: 'CLI_CORP', Nombre_Empresa: 'Corporación SF', RUT: '76.100.001-1', Email_Contacto: 'contacto@sf.cl', Telefono: '+56 9 1000 0001', Updated_At: now },
      { ID_Cliente: 'CLI_DEMO', Nombre_Empresa: 'Empresa Demo SPA', RUT: '76.200.002-2', Email_Contacto: 'demo@empresa.cl', Telefono: '+56 9 2000 0002', Updated_At: now },
      { ID_Cliente: 'CLI_TEST', Nombre_Empresa: 'Test Lodge Events', RUT: '76.300.003-3', Email_Contacto: 'eventos@testlodge.cl', Telefono: '+56 9 3000 0003', Updated_At: now },
    ]);

    // COMPOSICION_KIT - Kit compositions (for testing composition expansion)
    store.seed('COMPOSICION_KIT', [
      {
        ID_Composicion: 'COMP_001',
        ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
        ID_Item_Hijo: 'ITEM_COFFEE_INT',
        Cantidad: 1,
        Tipo_Precio: 'ABSORBIDO',
        Updated_At: now,
      },
      {
        ID_Composicion: 'COMP_002',
        ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
        ID_Item_Hijo: 'ITEM_ALMUERZO_PARRILLA',
        Cantidad: 0.5,
        Tipo_Precio: 'SUMAR',
        Updated_At: now,
      },
    ]);

    // REGLAS_NEGOCIO - Core business rules for testing
    store.seed('REGLAS_NEGOCIO', [
      // Overtime surcharge: salon duration > 480 min (8h standard)
      {
        ID_Regla: 'R001_OVERTIME',
        Nombre: 'Sobreturno salón (>8h)',
        Etapa: 'AJUSTE_LINEA',
        Scope: 'CATEGORIA',
        Tipo_Accion: 'MULTIPLY',
        Condicion_JSON: JSON.stringify({
          and: [
            { '===': [{ var: '_categoriaId' }, 'CAT_SALON'] },
            { '>': [{ var: '_duracionMin' }, 480] },
          ],
        }),
        Payload_JSON: JSON.stringify({ factor: 1.25 }),
        Prioridad: 10,
        Acumulable: false,
        Activo: true,
        Updated_At: now,
      },
      // IVA 19%
      {
        ID_Regla: 'R002_IVA',
        Nombre: 'IVA 19%',
        Etapa: 'IMPUESTO',
        Scope: 'COTIZACION',
        Tipo_Accion: 'SET_TAX',
        Condicion_JSON: 'true',
        Payload_JSON: JSON.stringify({ name: 'IVA', rate: 0.19 }),
        Prioridad: 100,
        Acumulable: true,
        Activo: true,
        Updated_At: now,
      },
    ]);

    // Add version property for determinism checking
    store.version = 'STORE_v1_GAS_SEED_2025_02_19';

    return store;
  }

  function createCotizadorActor(opts = {}) {
    const machine = createQuotationXStateMachine(quotationAdapters);
    const actor = createActor(machine);

    const snap = actor.getSnapshot();
    snap.context.store = opts.store || createSeededStore();

    actor.start();

    const bootstrap = opts.bootstrap !== false;
    if (bootstrap) {
      actor.send({ type: 'START_NEW_QUOTATION' });
      actor.send({ type: 'CREATE_NEW' });
      actor.send({
        type: 'QUOTATION_INITIALIZED',
        clienteId: opts.clienteId || 'CLI_CORP',
        paxGlobal: Number.isFinite(opts.paxGlobal) ? opts.paxGlobal : 10,
        fechaEvento: opts.fechaEvento || new Date().toISOString().split('T')[0],
        duracionDias: Number.isFinite(opts.duracionDias) ? opts.duracionDias : 1,
        cotizacionId: opts.cotizacionId || `COT_BUNDLE_${Date.now()}`,
      });
    }

    // Populate window.local* so Local_GAS_Shim can serve them on localhost
    if (typeof window !== 'undefined') {
      const store = actor.getSnapshot().context.store;
      const all = (t) => store?.all ? store.all(t) : [];
      window.localClientes = all('CLIENTES');
      window.localCatalogItems = all('ITEM_CATALOGO').map(item => ({
        itemId: item.ID_Item,
        nombre: item.Nombre || item.ID_Item,
        categoria: item.ID_Categoria || 'Varios',
        precio: item.Precio_Base || 0,
        detalle: item.Default_Glosa || '',
        Default_Glosa: item.Default_Glosa || '',
      }));
      window.localPricingReferenceData = {
        PERFILES_PRECIO: all('PERFILES_PRECIO'),
        CATEGORIAS: all('CATEGORIAS'),
        ITEM_CATALOGO: all('ITEM_CATALOGO'),
        COMPOSICION_KIT: all('COMPOSICION_KIT'),
        REGLAS_NEGOCIO: all('REGLAS_NEGOCIO'),
      };
    }

    return actor;
  }

  const QuotationEngine = {
    AlpineXStateBridge,
    createCotizadorActor,
  };

  if (typeof window !== 'undefined') {
    window.QuotationEngine = QuotationEngine;
    if (typeof window.createCotizadorActor !== 'function') {
      window.createCotizadorActor = createCotizadorActor;
    }
  }

  exports.AlpineXStateBridge = AlpineXStateBridge;
  exports.QuotationEngine = QuotationEngine;
  exports.createCotizadorActor = createCotizadorActor;

  return exports;

})({});
//# sourceMappingURL=quotation-engine.iife.js.map
