import { Action, ActionVO } from '../../../src/domain/value-objects/Action.js';

describe('Action', () => {
  describe('ActionVO.create', () => {
    it('should create ActionVO with valid action', () => {
      const actionVO = ActionVO.create(Action.CREATE);
      expect(actionVO.getValue()).toBe(Action.CREATE);
    });

    it('should create ActionVO with all valid actions', () => {
      Object.values(Action).forEach(action => {
        const actionVO = ActionVO.create(action);
        expect(actionVO.getValue()).toBe(action);
      });
    });

    it('should throw error for invalid action', () => {
      expect(() => ActionVO.create('INVALID_ACTION')).toThrow('Invalid action: INVALID_ACTION');
      expect(() => ActionVO.create('')).toThrow('Invalid action: ');
      expect(() => ActionVO.create('create')).toThrow('Invalid action: create');
    });

    it('should accept string action values', () => {
      const actionVO = ActionVO.create('CREATE');
      expect(actionVO.getValue()).toBe(Action.CREATE);
    });
  });

  describe('ActionVO.getValue', () => {
    it('should return the action value', () => {
      const actionVO = ActionVO.create(Action.UPDATE);
      expect(actionVO.getValue()).toBe(Action.UPDATE);
    });
  });

  describe('Action enum', () => {
    it('should have all expected action values', () => {
      expect(Action.CREATE).toBe('CREATE');
      expect(Action.UPDATE).toBe('UPDATE');
      expect(Action.DELETE).toBe('DELETE');
      expect(Action.READ).toBe('READ');
      expect(Action.LOGIN).toBe('LOGIN');
      expect(Action.LOGOUT).toBe('LOGOUT');
      expect(Action.REGISTER).toBe('REGISTER');
      expect(Action.ACTIVATE).toBe('ACTIVATE');
      expect(Action.DEACTIVATE).toBe('DEACTIVATE');
    });
  });
});
