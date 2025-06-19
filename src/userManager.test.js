import {jest} from '@jest/globals';
import {WS} from "jest-websocket-mock";
jest.unstable_mockModule('uuid', ()=> ({
    v4: () => '1234567890'
}));

let userManager;

describe("userManager", () => {

    let server;
    const TEST_UUID = "1234567890";
    const TEST_IP = "1.2.3.4";

    beforeEach( async () => {
        userManager = await import('./userManager');
        server = new WS(`ws://localhost:4433`);
        userManager.users.set("AI", null);
    });

    afterEach( () => {
        WS.clean();
    });

    test("Neuen User anlegen", async ()=> {
        const ws = new WebSocket(`ws://localhost:4433`);
        await server.connected;

        const userId = userManager.addUser(ws, TEST_IP);
        expect(userId).toBe(TEST_UUID);
        expect(userManager.users.has(userId)).toBe(true);
        const user = userManager.users.get(userId);

        expect(user).toMatchObject({
            ws,
            name: "Default_1234",
            ip: TEST_IP
        });
    });
    

});