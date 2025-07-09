// Command Registry
// Valid commands registry
export const VALID_COMMANDS = new Set([
  'setName',
  'messageTo',
  'getChat',
  'getUserChats',
  'createEmptyChat',
  'joinChatById',
]);

export const COMMAND_VALIDATIONS = {
  setName: (data) => data.name?.trim(),
  messageTo: (data) => data.chatId !== undefined && data.text?.trim(),
  // Accept 0 as a valid id but ensure no empty strings are provided
  getChat: (data) => data.chatId === 0 || (data.chatId !== undefined && !!data.chatId),
  joinChatById: (data) => data.chatId === 0 || (data.chatId !== undefined && !!data.chatId),
  getUserChats: () => true,
  createEmptyChat: () => true,
};