import { UIContainerBase } from '../../../common/base/ui/UIContainerBase.js';

/**
 * TimelineController manages the logic for the quotation timeline,
 * including drag and drop, resizing, and grid coordinate calculations.
 */
export class TimelineController extends UIContainerBase {
  constructor(runtime) {
    super();
    this.runtime = runtime;
    this.HOUR_H = 64;
    this.N_HOURS = 16;
    this.START_H = 8;
    this.dropIndicatorY = null;
    this.dropIndicatorTime = '';
    this.movingId = null;
    this.dragOffsetMin = 0;
    this.resizeId = null;
    this.resizeStartY = 0;
    this.resizeOrigDur = 0;
    this.mainTab = 'timeline';
    this.settings = {};
    this.basket = { basketEntries: [] };
    this.selectedClient = null;
    this.validation = { totals: { subtotal: 0, total: 0 } };
    this.draggingCatalogItemId = null;
    this.hours = Array.from({ length: this.N_HOURS }, (_, i) =>
      `${String(i + this.START_H).padStart(2, '0')}:00`
    );
  }

  onActorUpdate(snapshot) {
    this.settings = snapshot.settings;
    this.basket = snapshot.basket;
    this.selectedClient = snapshot.selectedClient;
    this.validation = snapshot.validation;
    this.draggingCatalogItemId = snapshot.draggingCatalogItemId;
  }

  /**
   * Converts relative Y coordinate to starting minute, snapped to 15-min intervals.
   */
  yToStartMin(relY, offsetMin = 0) {
    const raw = (relY / this.HOUR_H) * 60 + (this.START_H * 60) - offsetMin;
    const snapped = Math.round(raw / 15) * 15;
    const minStart = this.START_H * 60;
    const maxStart = (this.START_H + this.N_HOURS) * 60 - 15;
    return Math.max(minStart, Math.min(maxStart, snapped));
  }

  /**
   * Converts minute to Y coordinate relative to the grid start.
   */
  minuteToY(m) {
    return ((m - (this.START_H * 60)) / 60) * this.HOUR_H;
  }

  /**
   * Formats minutes as HH:mm.
   */
  fmtMin(totalMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Calculates the style for an entry block.
   */
  blockStyle(entry) {
    const hora = entry.hora || '09:00';
    const [h, m] = hora.split(':').map(Number);
    const startMin = h * 60 + m;
    const top = this.minuteToY(startMin);
    const dur = Number(entry.duracionMin || entry.state?.quantities?.duracionMin || 60);
    const height = (dur / 60) * this.HOUR_H;
    return `top:${top}px; height:${Math.max(48, height)}px; left: 70px; right: 8px;`;
  }

  // --- Event Handlers ---

  onGridDragOver(event, isDraggingCatalogItem) {
    if (!isDraggingCatalogItem) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relY = event.clientY - rect.top;
    const startMin = this.yToStartMin(relY, this.dragOffsetMin);
    this.dropIndicatorY = this.minuteToY(startMin);
    this.dropIndicatorTime = this.fmtMin(startMin);
  }

  onGridDragLeave(event) {
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
      this.dropIndicatorY = null;
      this.dropIndicatorTime = '';
    }
  }

  onGridDrop(event, draggedItemId) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relY = event.clientY - rect.top;
    const startMin = this.yToStartMin(relY, this.dragOffsetMin);
    const time = this.fmtMin(startMin);

    if (this.movingId) {
      this.emit('BASKET_ENTRY_UPDATED', { entryId: this.movingId, key: 'hora', value: time });
    } else if (draggedItemId) {
      this.emit('ITEM_DROPPED', { itemId: draggedItemId, hora: time });
    }

    this.endDrag();
    this.dropIndicatorY = null;
    this.dropIndicatorTime = '';
  }

  startMovePlaced(entry, event) {
    this.movingId = entry.entryId;
    this.dragOffsetMin = (event.offsetY / this.HOUR_H) * 60;
    this.emit('MOVE_STARTED', { entry, event });
  }

  startResize(entry, event) {
    this.resizeId = entry.entryId;
    this.resizeStartY = event.clientY;
    this.resizeOrigDur = entry.duracionMin || 60;
  }

  doResize(event) {
    if (!this.resizeId) return;
    const deltaY = event.clientY - this.resizeStartY;
    const deltaMins = (deltaY / this.HOUR_H) * 60;
    const newDuration = Math.max(15, Math.round((this.resizeOrigDur + deltaMins) / 15) * 15);
    this.emit('BASKET_ENTRY_UPDATED', { entryId: this.resizeId, key: 'duracionMin', value: newDuration });
  }

  endResize() {
    this.resizeId = null;
  }

  endDrag() {
    this.emit('DRAG_ENDED');
    this.movingId = null;
    this.dragOffsetMin = 0;
  }

  /**
   * Returns the state required by the Timeline UI.
   */
  toDisplayObject() {
    const snapshot = this.runtime?.getSnapshot?.() || {
      settings: this.settings,
      basket: this.basket,
      selectedClient: this.selectedClient,
      validation: this.validation,
      draggingCatalogItemId: this.draggingCatalogItemId,
    };
    return {
      HOUR_H: this.HOUR_H,
      N_HOURS: this.N_HOURS,
      START_H: this.START_H,
      hours: this.hours,
      dropIndicatorY: this.dropIndicatorY,
      dropIndicatorTime: this.dropIndicatorTime,
      movingId: this.movingId,
      dragOffsetMin: this.dragOffsetMin,
      resizeId: this.resizeId,
      mainTab: this.mainTab,
      settings: snapshot.settings,
      basket: snapshot.basket,
      selectedClient: snapshot.selectedClient,
      validation: snapshot.validation,
      draggingCatalogItemId: snapshot.draggingCatalogItemId,
      yToStartMin: (relY, offsetMin) => this.yToStartMin(relY, offsetMin),
      minuteToY: (m) => this.minuteToY(m),
      fmtMin: (totalMin) => this.fmtMin(totalMin),
      blockStyle: (entry) => this.blockStyle(entry),
      onGridDragOver: (event, isDragging) => this.onGridDragOver(event, isDragging),
      onGridDragLeave: (event) => this.onGridDragLeave(event),
      onGridDrop: (event, draggedId) => this.onGridDrop(event, draggedId),
      startMovePlaced: (entry, event) => this.startMovePlaced(entry, event),
      startResize: (entry, event) => this.startResize(entry, event),
      doResize: (event) => this.doResize(event),
      endResize: () => this.endResize(),
      endDrag: () => this.endDrag()
    };
  }
}

export function createTimeline(runtime) {
  return new TimelineController(runtime);
}
