// Command Registry
export const COMMANDS = new Map([
  ['setName', 'setName'],
  ['messageTo', 'messageTo'],
  ['getChat', 'getChat'],
  ['getUserChats', 'getUserChats'],
  ['createEmptyChat', 'createEmptyChat'],
  ['joinChatById', 'joinChatById'],
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