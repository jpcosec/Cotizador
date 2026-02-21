import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XStateable } from '../../../src/mixins/XStateable.js';

describe('XStateable Mixin', () => {
  let XStateableItem;

  beforeEach(() => {
    class Base {}
    XStateableItem = class extends XStateable(Base) {};
  });

  describe('initial state', () => {
    it('_actorRef should start as null', () => {
      const item = new XStateableItem();
      expect(item._actorRef).toBeNull();
    });

    it('hasActorRef should return false initially', () => {
      const item = new XStateableItem();
      expect(item.hasActorRef).toBe(false);
    });
  });

  describe('setActorRef', () => {
    it('should store the actor ref', () => {
      const item = new XStateableItem();
      const mockActorRef = { send: () => {} };
      item.setActorRef(mockActorRef);
      expect(item._actorRef).toBe(mockActorRef);
    });

    it('should return this for chaining', () => {
      const item = new XStateableItem();
      const mockActorRef = { send: () => {} };
      const result = item.setActorRef(mockActorRef);
      expect(result).toBe(item);
    });

    it('hasActorRef should return true after setActorRef', () => {
      const item = new XStateableItem();
      const mockActorRef = { send: () => {} };
      item.setActorRef(mockActorRef);
      expect(item.hasActorRef).toBe(true);
    });

    it('should be chainable', () => {
      const item = new XStateableItem();
      const mockActorRef = { send: () => {} };
      const result = item.setActorRef(mockActorRef).hasActorRef;
      expect(result).toBe(true);
    });
  });

  describe('sendEvent', () => {
    it('should call actorRef.send with { type, ...payload }', () => {
      const item = new XStateableItem();
      const sendMock = { send: vi.fn() };
      item.setActorRef(sendMock);

      item.sendEvent('MY_EVENT', { foo: 'bar' });

      expect(sendMock.send).toHaveBeenCalledWith({
        type: 'MY_EVENT',
        foo: 'bar',
      });
    });

    it('should send { type } when no payload provided', () => {
      const item = new XStateableItem();
      const sendMock = { send: vi.fn() };
      item.setActorRef(sendMock);

      item.sendEvent('MY_EVENT');

      expect(sendMock.send).toHaveBeenCalledWith({
        type: 'MY_EVENT',
      });
    });

    it('should do nothing when _actorRef is null', () => {
      const item = new XStateableItem();
      // No error should be thrown
      expect(() => {
        item.sendEvent('MY_EVENT', { foo: 'bar' });
      }).not.toThrow();
    });

    it('should do nothing when _actorRef has no .send method', () => {
      const item = new XStateableItem();
      const brokenRef = { noSendMethod: true };
      item.setActorRef(brokenRef);

      // No error should be thrown
      expect(() => {
        item.sendEvent('MY_EVENT', { foo: 'bar' });
      }).not.toThrow();
    });

    it('should handle multiple events sequentially', () => {
      const item = new XStateableItem();
      const sendMock = { send: vi.fn() };
      item.setActorRef(sendMock);

      item.sendEvent('EVENT_1', { a: 1 });
      item.sendEvent('EVENT_2', { b: 2 });

      expect(sendMock.send).toHaveBeenCalledTimes(2);
      expect(sendMock.send).toHaveBeenNthCalledWith(1, {
        type: 'EVENT_1',
        a: 1,
      });
      expect(sendMock.send).toHaveBeenNthCalledWith(2, {
        type: 'EVENT_2',
        b: 2,
      });
    });
  });
});
