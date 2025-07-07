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
  messageTo: (data) => data.chatId && data.text?.trim(),
  getChat: (data) => data.chatId,
  joinChatById: (data) => data.chatId,
  getUserChats: () => true,
  createEmptyChat: () => true,
};