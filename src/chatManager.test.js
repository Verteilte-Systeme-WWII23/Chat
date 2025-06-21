import {beforeEach, jest} from '@jest/globals';

jest.unstable_mockModule('uuid', ()=> ({
    v4: () => '123456789'
}));

jest.unstable_mockModule('./userManager.js', ()=> ({
    getUserName: (id) => ({name: "Default_1234", id: id})
}));

describe("chatManager", ()=>{
    let chatManager;
    let chats;
    let messages;

    const TEST_UUID1 = "123456789";
    const TEST_UUID2 = "987654321";
    const TEST_AI_ID ="AI";
    const TEST_CHAT_ID = "Chat123"

    beforeEach(async () => {
        chatManager = await import('./chatManager');
        chats = chatManager._TEST_USE_ONLY_getChats();
        messages = chatManager._TEST_USE_ONLY_getMessages();
        chats.clear();
        messages.clear();
    });

    test("Test for the createEmptyChatForUser function", () => {
        const chatId = chatManager.createEmptyChatForUser(TEST_UUID1);
        expect(chats.has(chatId)).toBe(true);
        expect(chats.get(chatId)).toMatchObject({
            id: chatId,
            participants: [TEST_UUID1]
        });
        expect(messages.has(chatId)).toBe(true);
        expect(messages.get(chatId)).toHaveLength(0);
    });

    test("Test for the createAIChatForUser function", () => {
        const chatId = chatManager.createAIChatForUser(TEST_UUID1);
        expect(chats.get(chatId)).toMatchObject({
            id: chatId,
            participants: expect.arrayContaining([TEST_UUID1, TEST_AI_ID])
        });
        expect(messages.get(chatId)).toEqual([]);
    });

    test("Test for the joinChatById function", () => {
        chats.set(TEST_CHAT_ID, {
            id: TEST_CHAT_ID,
            participants: [TEST_UUID1],
            createdAt: new Date().toISOString(),
          });
        messages.set(TEST_CHAT_ID, []);
        const joinedChat = chatManager.joinChatById(TEST_CHAT_ID, TEST_UUID2);
        expect(joinedChat).toBe(true);
        expect(chats.get(TEST_CHAT_ID).participants).toContain(TEST_UUID2);

        let participantsAfterOneMethodCall = chats.get(TEST_CHAT_ID).participants;
        const joinedChatSecondTime = chatManager.joinChatById(TEST_CHAT_ID, TEST_UUID2);
        expect(joinedChatSecondTime).toBe(true);
        expect(chats.get(TEST_CHAT_ID).participants).toEqual(participantsAfterOneMethodCall);

        expect(chatManager.joinChatById("NonExistingID", TEST_UUID1)).toBe(false);
    });

    test("Test for the addMessageToChat function", () => {
        chats.set(TEST_CHAT_ID, {
            id: TEST_CHAT_ID,
            participants: [TEST_UUID1],
            createdAt: new Date().toISOString(),
          });
        messages.set(TEST_CHAT_ID, []);
        const msg = chatManager.addMessageToChat(TEST_CHAT_ID, TEST_UUID1, "Hello");
        expect(msg).toMatchObject({
            id: "123456789",
            from: TEST_UUID1,
            text: "Hello"
        });
        expect(messages.get(TEST_CHAT_ID)).toContainEqual(msg);

        const nonExistingChatId = "Chat987";
        expect(messages.has(nonExistingChatId)).toBe(false);
        const msgInPreviouslyNonExistingChat = chatManager.addMessageToChat(nonExistingChatId, TEST_UUID1, "Hello");
        expect(messages.has(nonExistingChatId)).toBe(true);
        expect(messages.get(nonExistingChatId)).toHaveLength(1);
        expect(msgInPreviouslyNonExistingChat).toMatchObject({
            text: "Hello"
        });
    });

    test("Test for the getUserChats function", () => {
        const aiTestChatId = "ChatAI";
        const secondTestChatId = "Chat987";
        chats.set(TEST_CHAT_ID, {
            id: TEST_CHAT_ID,
            participants: [TEST_UUID1],
            createdAt: new Date().toISOString(),
          });
        messages.set(TEST_CHAT_ID, []);
        chats.set(aiTestChatId, {
            id: aiTestChatId,
            participants: [TEST_UUID1, TEST_AI_ID],
            createdAt: new Date().toISOString(),
          });
        messages.set(aiTestChatId, []);
        chats.set(secondTestChatId, {
            id: secondTestChatId,
            participants: [TEST_UUID2],
            createdAt: new Date().toISOString(),
          });
        messages.set(secondTestChatId, []);

        messages.get(aiTestChatId).push({
            id: "123",
            from: TEST_UUID1,
            text: "HelloAI",
            timestamp: new Date().toISOString(),
          });
        
        const userChats = chatManager.getUserChats(TEST_UUID1);
        expect(userChats.length).toBe(2);
        expect(userChats.map(c=>c.chatId)).toContain(TEST_CHAT_ID);
        expect(userChats.map(c=>c.chatId)).toContain(aiTestChatId);

        const successfulMessage = userChats.find(c => c.chatId === aiTestChatId);
        expect(successfulMessage.lastMessage.text).toBe("HelloAI");
    });

    test("Test for the getChat function", () => {
        chats.set(TEST_CHAT_ID, {
            id: TEST_CHAT_ID,
            participants: [TEST_UUID1],
            createdAt: "2025-01-01T12:00:00.000Z"
          });
        messages.set(TEST_CHAT_ID, []);

        chats.get(TEST_CHAT_ID).participants.push(TEST_UUID2);

        messages.get(TEST_CHAT_ID).push({
            id: "123",
            from: TEST_UUID1,
            text: "Hello User2",
            timestamp: "2025-01-02T12:00:00.000Z"
          });
          messages.get(TEST_CHAT_ID).push({
            id: "456",
            from: TEST_UUID2,
            text: "Hello User1",
            timestamp: "2025-01-03T12:00:00.000Z"
          });

          const chat = chatManager.getChat(TEST_CHAT_ID, 1);
          expect(chat.id).toBe(TEST_CHAT_ID);
          expect(chat.participants[0]).toMatchObject({
            id: TEST_UUID1
          });
          expect(chat.participants[1]).toMatchObject({
            id: TEST_UUID2
          });
          expect(chat.messages).toHaveLength(1);
          expect(chat.messages[0]).toMatchObject({
            id: "456",
            from: TEST_UUID2,
            text: "Hello User1",
            timestamp: "2025-01-03T12:00:00.000Z"
          });

          const completeChat = chatManager.getChat(TEST_CHAT_ID);
          expect(completeChat.messages).toHaveLength(2);
          expect(chat.messages[0]).toMatchObject(
            {
                id: "456",
                from: TEST_UUID2,
                text: "Hello User1",
                timestamp: "2025-01-03T12:00:00.000Z"
              },
            {            id: "123",
                from: TEST_UUID1,
                text: "Hello User2",
                timestamp: "2025-01-02T12:00:00.000Z"}
        );
    });
});