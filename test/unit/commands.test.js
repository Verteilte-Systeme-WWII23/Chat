import { describe, test, expect } from 'vitest';
import { COMMANDS, COMMAND_VALIDATIONS } from '../../src/server/websocket/commands.js';

describe('WebSocket Commands Tests', () => {
  test('sollte alle erwarteten Befehle in der COMMANDS Map enthalten', () => {
    
    const expectedCommands = [
      'setName', 
      'messageTo', 
      'getChat', 
      'getUserChats',
      'createEmptyChat',
      'joinChatById'
    ];
    
    
    for (const cmd of expectedCommands) {
      expect(COMMANDS.has(cmd)).toBe(true);
    }
    
    
    expect(COMMANDS.size).toBe(expectedCommands.length);
  });
  
  test('sollte Werte der COMMANDS Map auf die entsprechenden Befehlsnamen gesetzt haben', () => {
    
    for (const [key, value] of COMMANDS.entries()) {
      expect(value).toBe(key);
    }
  });
});

describe('Command Validations Tests', () => {
  test('setName-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.setName;
    
    
    expect(validation({ name: 'TestUser' })).toBeTruthy();
    expect(validation({ name: '  John Doe  ' })).toBeTruthy();
    
    
    expect(validation({ name: '' })).toBeFalsy();
    expect(validation({ name: '   ' })).toBeFalsy();
    expect(validation({})).toBeFalsy();
    expect(validation({ otherField: 'value' })).toBeFalsy();
  });
  
  test('messageTo-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.messageTo;
    
    
    expect(validation({ chatId: 'chat-123', text: 'Hello World' })).toBeTruthy();
    expect(validation({ chatId: 'chat-123', text: '  Hello  ' })).toBeTruthy();
    
    
    expect(validation({ chatId: 'chat-123', text: '' })).toBeFalsy();
    expect(validation({ chatId: 'chat-123', text: '   ' })).toBeFalsy();
    expect(validation({ chatId: 'chat-123' })).toBeFalsy();
    expect(validation({ text: 'Hello' })).toBeFalsy();
    expect(validation({})).toBeFalsy();
  });
  
  test('getChat-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.getChat;
    
    
    expect(validation({ chatId: 'chat-123' })).toBeTruthy();
    expect(validation({ chatId: 0 })).toBeTruthy(); // Auch numerische IDs sollten gültig sein
    
    
    expect(validation({ chatId: '' })).toBeFalsy();
    expect(validation({ otherField: 'value' })).toBeFalsy();
    expect(validation({})).toBeFalsy();
  });
  
  test('joinChatById-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.joinChatById;
    
    
    expect(validation({ chatId: 'chat-123' })).toBeTruthy();
    expect(validation({ chatId: 0 })).toBeTruthy();
    
    
    expect(validation({ chatId: '' })).toBeFalsy();
    expect(validation({ otherField: 'value' })).toBeFalsy();
    expect(validation({})).toBeFalsy();
  });
  
  test('getUserChats-Validierung sollte immer true zurückgeben', () => {
    const validation = COMMAND_VALIDATIONS.getUserChats;
    
    
    expect(validation({})).toBe(true);
    expect(validation({ someField: 'value' })).toBe(true);
    expect(validation()).toBe(true);
    expect(validation(null)).toBe(true);
  });
  
  test('createEmptyChat-Validierung sollte immer true zurückgeben', () => {
    const validation = COMMAND_VALIDATIONS.createEmptyChat;
    
    
    expect(validation({})).toBe(true);
    expect(validation({ someField: 'value' })).toBe(true);
    expect(validation()).toBe(true);
    expect(validation(null)).toBe(true);
  });
  
  test('sollte für jeden Befehl in COMMANDS eine Validierungsfunktion haben', () => {
    
    for (const cmd of COMMANDS.keys()) {
      expect(COMMAND_VALIDATIONS).toHaveProperty(cmd);
      expect(typeof COMMAND_VALIDATIONS[cmd]).toBe('function');
    }
  });
  
  test('sollte keine überflüssigen Validierungsfunktionen haben', () => {
    
    for (const validationKey in COMMAND_VALIDATIONS) {
      expect(COMMANDS.has(validationKey)).toBe(true);
    }
  });
});