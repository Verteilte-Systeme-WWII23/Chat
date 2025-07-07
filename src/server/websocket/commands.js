// Command Registry - einfach erweiterbar
export const COMMANDS = new Map([
  ['setName', 'setName'],
  ['messageTo', 'messageTo'],
  ['getChat', 'getChat'],
  ['getUserChats', 'getUserChats'],
  ['createEmptyChat', 'createEmptyChat'],
  ['joinChatById', 'joinChatById'],
]);

// Command-Validierungen
export const COMMAND_VALIDATIONS = {
  setName: (data) => data.name?.trim(),
  messageTo: (data) => data.chatId !== undefined && data.text?.trim(),
  // Sonderbehandlung für 0 als gültige ID, aber leere Strings ablehnen
  getChat: (data) => data.chatId === 0 || (data.chatId !== undefined && !!data.chatId),
  joinChatById: (data) => data.chatId === 0 || (data.chatId !== undefined && !!data.chatId),
  getUserChats: () => true,
  createEmptyChat: () => true,
};