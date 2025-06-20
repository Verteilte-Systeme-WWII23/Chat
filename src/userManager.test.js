import {jest} from '@jest/globals';
import {WS} from "jest-websocket-mock";
jest.unstable_mockModule('uuid', ()=> ({
    v4: () => '1234567890'
}));



describe("userManager", () => {

    let server;
    let userManager;
    let users;
    let ws;
    const TEST_UUID = "1234567890";
    const TEST_IP = "1.2.3.4";
    const TEST_NAME = "Default_1234";

    beforeEach( async () => {
        userManager = await import('./userManager');
        server = new WS(`ws://localhost:4433`);
        users = userManager._TEST_USE_ONLY_getUserMap();
        users.set("AI", null);
        ws = new WebSocket(`ws://localhost:4433`);
        await server.connected;
    });

    afterEach( () => {
        WS.clean();
    });

    test("Test for the addUser function", ()=> {
        const userId = userManager.addUser(ws, TEST_IP);
        expect(userId).toBe(TEST_UUID);
        expect(users.has(userId)).toBe(true);
        const user = users.get(userId);

        expect(user).toMatchObject({
            ws,
            name: TEST_NAME,
            ip: TEST_IP
        });
    });

    test("Test for the removeUser function", ()=> {
        users.set(TEST_UUID, {ws, name: TEST_NAME, ip: TEST_IP});
        expect(users.has(TEST_UUID)).toBe(true);

        userManager.removeUser(TEST_UUID);
        expect(users.has(TEST_UUID)).toBe(false);
        expect(users.get(TEST_UUID)).toBeUndefined();
        expect(users.has("AI")).toBe(true);
    });
    
    test("Test for the setUserName function", ()=> {
        users.set(TEST_UUID, {ws, name: TEST_NAME, ip: TEST_IP});
        expect(users.has(TEST_UUID)).toBe(true);

        const newUserName = "TestName";
        userManager.setUserName(TEST_UUID, newUserName);
        const user = users.get((TEST_UUID));
        expect(user).toMatchObject({
            ws,
            name: newUserName,
            ip: TEST_IP
        });
    });

    test("Test for the getUser function", ()=>{
        users.set(TEST_UUID, {ws, name: TEST_NAME, ip: TEST_IP});
        expect(users.has(TEST_UUID)).toBe(true);

        const user = userManager.getUser(TEST_UUID);
        expect(user).toMatchObject({
            ws,
            name: TEST_NAME,
            ip: TEST_IP
        });

        const notExistingUser = userManager.getUser("IAmANonExistingID");
        expect(notExistingUser).toBeUndefined();
    });

    test("Test for the getAllUsers function", ()=>{
        users.clear();
        const clearUserMap = userManager.getAllUsers();
        expect(clearUserMap).toBe(users);
        expect(clearUserMap.size).toBe(0);

        users.set(TEST_UUID, {ws, name: TEST_NAME, ip: TEST_IP});
        users.set("IAmAnID", {ws, name: "Guest", ip: "4.3.2.1"});
        const filledUserMap = userManager.getAllUsers();
        expect(filledUserMap.size).toBe(2);
        expect(filledUserMap.has(TEST_UUID)).toBe(true);
        expect(filledUserMap.has("IAmAnID")).toBe(true);

        expect(filledUserMap.get(TEST_UUID)).toMatchObject({
            ws,
            name: TEST_NAME,
            ip: TEST_IP
        });
        expect(filledUserMap.get("IAmAnID")).toMatchObject({
            ws,
            name: "Guest",
            ip: "4.3.2.1"
        });
    });

    test("Test for the getUserName function", ()=>{
        users.set(TEST_UUID, {ws, name: TEST_NAME, ip: TEST_IP});
        expect(users.has(TEST_UUID)).toBe(true);

        const user = userManager.getUserName(TEST_UUID);
        expect(user).toMatchObject({
            name: TEST_NAME,
            id: TEST_UUID
        });

        const notExistingUser = userManager.getUserName("IDoNotExist");
        expect(notExistingUser).toMatchObject({
            name: null,
            id: "IDoNotExist"
        });
    });

    test("Test for the getBannedIps function", ()=>{
        const bannedIps = userManager._TEST_USE_ONLY_getBannedIps();
        bannedIps.clear();
        const clearBannedIpsSet = userManager.getBannedIps();
        expect(clearBannedIpsSet).toBe(bannedIps);
        expect(clearBannedIpsSet.size).toBe(0);

        bannedIps.add(TEST_IP);
        bannedIps.add("4.3.2.1");
        const filledBannedIpsSet = userManager.getBannedIps();
        expect(filledBannedIpsSet.size).toBe(2);
        expect(filledBannedIpsSet.has(TEST_IP)).toBe(true);
        expect(filledBannedIpsSet.has("4.3.2.1")).toBe(true);
    });

    test("Test for the banIp function", ()=>{
        const bannedIps = userManager._TEST_USE_ONLY_getBannedIps();
        bannedIps.clear();
        users.clear();

        const ws1 = ws;
        const ws2 = new WebSocket(`ws://localhost:4433`);

        users.set(TEST_UUID, {ws: ws1, name: TEST_NAME, ip: TEST_IP});
        users.set("IAmAnID", {ws: ws2, name: "Default_IAmA", ip: "4.3.2.1"});

        const closeSpy1 = jest.spyOn(ws1, "close");
        const closeSpy2 = jest.spyOn(ws2, "close");

        userManager.banIp(TEST_IP);
        expect(bannedIps.has(TEST_IP)).toBe(true);

        expect(closeSpy1).toHaveBeenCalledTimes(1);
        expect(closeSpy2).not.toHaveBeenCalled();
        expect(users.get(TEST_UUID).ws).toBeNull();
        expect(users.get("IAmAnID").ws).toBe(ws2);

        closeSpy1.mockClear();
        userManager.banIp(TEST_IP);
        expect(closeSpy1).not.toHaveBeenCalled();
    });

    test("Test for the isBanned function", ()=>{
        const bannedIps = userManager._TEST_USE_ONLY_getBannedIps();
        bannedIps.clear();

        bannedIps.add(TEST_IP);

        const iPIsBanned = userManager.isBanned(TEST_IP);
        expect(iPIsBanned).toBe(true);

        const iPIsNotBanned = userManager.isBanned("4.3.2.1");
        expect(iPIsNotBanned).toBe(false);
    });

    test("Test for the unBanIp function", ()=>{
        const bannedIps = userManager._TEST_USE_ONLY_getBannedIps();
        bannedIps.clear();

        bannedIps.add(TEST_IP);
        bannedIps.add("4.3.2.1");

        userManager.unBanIp(TEST_IP);
        expect(bannedIps.has(TEST_IP)).toBe(false);
        expect(bannedIps.has("4.3.2.1")).toBe(true);
        expect(bannedIps.size).toBe(1);

        userManager.unBanIp("NonExistingIp");
        expect(bannedIps.has("4.3.2.1")).toBe(true);
        expect(bannedIps.size).toBe(1);
    });
});