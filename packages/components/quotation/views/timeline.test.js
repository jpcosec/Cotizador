import { describe, expect, it, vi } from 'vitest';
import { createTimeline } from './Timeline.js';

describe('TimelineController', () => {
  it('calculates Y coordinates correctly', () => {
    const timeline = createTimeline();
    // 8:00 should be 0px (START_H = 8)
    expect(timeline.minuteToY(8 * 60)).toBe(0);
    // 9:00 should be 64px (HOUR_H = 64)
    expect(timeline.minuteToY(9 * 60)).toBe(64);
  });

  it('converts relative Y to start minutes', () => {
    const timeline = createTimeline();
    // 0px relative to grid start should be 8:00 (480 mins)
    expect(timeline.yToStartMin(0)).toBe(480);
    // 64px relative to grid start should be 9:00 (540 mins)
    expect(timeline.yToStartMin(64)).toBe(540);
    // 32px should snap to 8:30 (510 mins)
    expect(timeline.yToStartMin(32)).toBe(510);
  });

  it('formats minutes correctly', () => {
    const timeline = createTimeline();
    expect(timeline.fmtMin(540)).toBe('09:00');
    expect(timeline.fmtMin(615)).toBe('10:15');
  });

  it('calculates block style correctly', () => {
    const timeline = createTimeline();
    const entry = { hora: '09:00', duracionMin: 60 };
    const style = timeline.blockStyle(entry);
    expect(style).toContain('top:64px');
    expect(style).toContain('height:64px');
  });

  it('emits BASKET_ENTRY_UPDATED on drop if movingId is set', () => {
    const timeline = createTimeline();
    const emitSpy = vi.spyOn(timeline, 'emit');
    
    // Set moving state
    timeline.movingId = 'entry-1';
    
    // Mock event
    const event = {
      currentTarget: {
        getBoundingClientRect: () => ({ top: 0, left: 0 })
      },
      clientY: 64 // 9:00
    };
    
    timeline.onGridDrop(event);
    
    expect(emitSpy).toHaveBeenCalledWith('BASKET_ENTRY_UPDATED', {
      entryId: 'entry-1',
      key: 'hora',
      value: '09:00'
    });
  });

  it('emits ITEM_DROPPED on drop if no movingId but draggedItemId is provided', () => {
    const timeline = createTimeline();
    const emitSpy = vi.spyOn(timeline, 'emit');
    
    const event = {
      currentTarget: {
        getBoundingClientRect: () => ({ top: 0, left: 0 })
      },
      clientY: 64 // 9:00
    };
    
    timeline.onGridDrop(event, 'item-abc');
    
    expect(emitSpy).toHaveBeenCalledWith('ITEM_DROPPED', {
      itemId: 'item-abc',
      hora: '09:00'
    });
  });

  it('manages resize state', () => {
    const timeline = createTimeline();
    const emitSpy = vi.spyOn(timeline, 'emit');
    
    const entry = { entryId: 'entry-1', duracionMin: 60 };
    timeline.startResize(entry, { clientY: 100 });
    
    expect(timeline.resizeId).toBe('entry-1');
    expect(timeline.resizeStartY).toBe(100);
    
    timeline.doResize({ clientY: 164 }); // Moved 64px = 60 mins
    
    expect(emitSpy).toHaveBeenCalledWith('BASKET_ENTRY_UPDATED', {
      entryId: 'entry-1',
      key: 'duracionMin',
      value: 120
    });
    
    timeline.endResize();
    expect(timeline.resizeId).toBeNull();
  });

  it('provides methods and state via toDisplayObject', () => {
    const timeline = createTimeline();
    const display = timeline.toDisplayObject();
    
    expect(display.HOUR_H).toBe(64);
    expect(typeof display.yToStartMin).toBe('function');
    expect(typeof display.onGridDrop).toBe('function');
    
    // Test that bound methods work
    expect(display.fmtMin(480)).toBe('08:00');
  });
});
