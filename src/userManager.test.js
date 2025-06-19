import {users} from './userManager';
import {v4 as uuidv4} from 'uuid';
import WS from "jest-websocket-mock";

jest.mock('uuid', ()=> ({
    v4: jest.fn()
}));

describe("userManager", () => {

    let server;
    const TEST_UUID = "1234567890";
    const TEST_IP = "1.2.3.4";

    beforeEach( () => {
        server = new WS(`ws://localhost:4433`);
        users.clear();
//       users.set("AI", null);
        uuidv4.mockReturnValue(TEST_UUID);
    });

    afterEach( () => {
        WS.clean();
    });

    test("Neuen User anlegen", async ()=> {
        const ws = new WebSocket(`ws://localhost:4433`);
        await server.connected;

        const userId = addUser(ws, TEST_IP);
        expect(userId).toBe(TEST_UUID);
        
        expect(users.has(userId)).toBe(true);
        const user = users.get(userId);

        expect(user).toMatchObject({
            ws,
            name: "Default_1234",
            ip: TEST_IP
        });
    });
    

});