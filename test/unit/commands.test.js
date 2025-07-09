import { describe, test, expect } from 'vitest';
import { VALID_COMMANDS, COMMAND_VALIDATIONS } from '../../src/server/websocket/commands.js';

describe('WebSocket Commands Tests', () => {
  test('sollte alle erwarteten Befehle im VALID_COMMANDS Set enthalten', () => {
    const expectedCommands = [
      'setName', 
      'messageTo', 
      'getChat', 
      'getUserChats',
      'createEmptyChat',
      'joinChatById'
    ];
    
    for (const cmd of expectedCommands) {
      expect(VALID_COMMANDS.has(cmd)).toBe(true);
    }
    
    expect(VALID_COMMANDS.size).toBe(expectedCommands.length);
  });
});

describe('Command Validations Tests', () => {
  test('setName-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.setName;
    
    // Gültige Namen
    expect(validation({ name: 'TestUser' })).toBeTruthy();
    expect(validation({ name: '  John Doe  ' })).toBeTruthy();
    
    // Ungültige Namen
    expect(validation({ name: '' })).toBeFalsy();
    expect(validation({ name: '   ' })).toBeFalsy();
    expect(validation({})).toBeFalsy();
    expect(validation({ otherField: 'value' })).toBeFalsy();
  });
  
  test('messageTo-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.messageTo;
    
    // Gültige Nachrichten
    expect(validation({ chatId: 'chat-123', text: 'Hello World' })).toBeTruthy();
    expect(validation({ chatId: 'chat-123', text: '  Hello  ' })).toBeTruthy();
    expect(validation({ chatId: 0, text: 'Hello' })).toBeTruthy();
    
    // Ungültige Nachrichten
    expect(validation({ chatId: 'chat-123', text: '' })).toBeFalsy();
    expect(validation({ chatId: 'chat-123', text: '   ' })).toBeFalsy();
    expect(validation({ chatId: 'chat-123' })).toBeFalsy();
    expect(validation({ text: 'Hello' })).toBeFalsy();
    expect(validation({})).toBeFalsy();
  });
  
  test('getChat-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.getChat;
    
    // Gültige Chat-IDs
    expect(validation({ chatId: 'chat-123' })).toBeTruthy();
    expect(validation({ chatId: 0 })).toBeTruthy();
    expect(validation({ chatId: 42 })).toBeTruthy();
    
    // Ungültige Chat-IDs
    expect(validation({ chatId: '' })).toBeFalsy();
    expect(validation({ otherField: 'value' })).toBeFalsy();
    expect(validation({})).toBeFalsy();
  });
  
  test('joinChatById-Validierung sollte korrekt funktionieren', () => {
    const validation = COMMAND_VALIDATIONS.joinChatById;
    
    // Gültige Chat-IDs
    expect(validation({ chatId: 'chat-123' })).toBeTruthy();
    expect(validation({ chatId: 0 })).toBeTruthy();
    expect(validation({ chatId: 42 })).toBeTruthy();
    
    // Ungültige Chat-IDs
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
  
  test('sollte für jeden Befehl in VALID_COMMANDS eine Validierungsfunktion haben', () => {
    for (const cmd of VALID_COMMANDS) {
      expect(COMMAND_VALIDATIONS).toHaveProperty(cmd);
      expect(typeof COMMAND_VALIDATIONS[cmd]).toBe('function');
    }
  });
  
  test('sollte keine überflüssigen Validierungsfunktionen haben', () => {
    for (const validationKey in COMMAND_VALIDATIONS) {
      expect(VALID_COMMANDS.has(validationKey)).toBe(true);
    }
  });
});