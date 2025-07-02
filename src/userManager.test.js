import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as userManager from './userManager.js';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid to return predictable values
vi.mock('uuid', () => ({
    v4: vi.fn()
}));

describe('User Manager', () => {
    let mockWs;
    
    beforeEach(() => {
        // Reset mocks and clear users between tests
        vi.clearAllMocks();
        mockWs = {
            close: vi.fn(),
            send: vi.fn()
        };
        
        // Clear existing users (except AI)
        const users = userManager.getAllUsers();
        for (const userId of users.keys()) {
            if (userId !== 'AI') userManager.removeUser(userId);
        }
        
        // Clear banned IPs
        const bannedIps = userManager.getBannedIps();
        bannedIps.forEach(ip => userManager.unBanIp(ip));
    });

    test('addUser should add a new user and return userId', () => {
        const testUuid = '1234-5678-9abc-def0';
        uuidv4.mockReturnValue(testUuid);
        
        const userId = userManager.addUser(mockWs, '192.168.1.1');
        
        expect(userId).toBe(testUuid);
        expect(userManager.getUser(userId)).toEqual({
            ws: mockWs,
            name: `Default_${testUuid.slice(0, 4)}`,
            ip: '192.168.1.1'
        });
    });

    test('removeUser should delete a user', () => {
        const testUuid = '1234-5678-9abc-def0';
        uuidv4.mockReturnValue(testUuid);
        
        const userId = userManager.addUser(mockWs, '192.168.1.1');
        expect(userManager.getUser(userId)).toBeTruthy();
        
        userManager.removeUser(userId);
        expect(userManager.getUser(userId)).toBeUndefined();
    });

    test('setUserName should update a user\'s name', () => {
        const testUuid = '1234-5678-9abc-def0';
        uuidv4.mockReturnValue(testUuid);
        
        const userId = userManager.addUser(mockWs, '192.168.1.1');
        userManager.setUserName(userId, 'TestUser');
        
        expect(userManager.getUser(userId).name).toBe('TestUser');
    });

    test('getUserName should return name and id for existing user', () => {
        const testUuid = '1234-5678-9abc-def0';
        uuidv4.mockReturnValue(testUuid);
        
        const userId = userManager.addUser(mockWs, '192.168.1.1');
        userManager.setUserName(userId, 'TestUser');
        
        expect(userManager.getUserName(userId)).toEqual({
            name: 'TestUser',
            id: userId
        });
    });

    test('getUserName should return null name for non-existent user', () => {
        expect(userManager.getUserName('non-existent')).toEqual({
            name: null,
            id: 'non-existent'
        });
    });

    test('banIp should add IP to banned list and close connections', () => {
        const testUuid1 = '1111-1111-1111-1111';
        const testUuid2 = '2222-2222-2222-2222';
        uuidv4.mockReturnValueOnce(testUuid1).mockReturnValueOnce(testUuid2);
        
        const mockWs1 = { close: vi.fn(), send: vi.fn() };
        const mockWs2 = { close: vi.fn(), send: vi.fn() };
        
        userManager.addUser(mockWs1, '192.168.1.1');
        userManager.addUser(mockWs2, '192.168.1.2');
        
        userManager.banIp('192.168.1.1');
        
        expect(userManager.isBanned('192.168.1.1')).toBe(true);
        expect(userManager.isBanned('192.168.1.2')).toBe(false);
        expect(mockWs1.close).toHaveBeenCalled();
        expect(mockWs2.close).not.toHaveBeenCalled();
    });

    test('unBanIp should remove IP from banned list', () => {
        userManager.banIp('192.168.1.1');
        expect(userManager.isBanned('192.168.1.1')).toBe(true);
        
        userManager.unBanIp('192.168.1.1');
        expect(userManager.isBanned('192.168.1.1')).toBe(false);
    });

    test('getAllUsers should return the users map', () => {
        const users = userManager.getAllUsers();
        expect(users).toBeInstanceOf(Map);
        expect(users.has('AI')).toBe(true);
    });

    test('getBannedIps should return the banned IPs set', () => {
        userManager.banIp('192.168.1.1');
        const bannedIps = userManager.getBannedIps();
        
        expect(bannedIps).toBeInstanceOf(Set);
        expect(bannedIps.has('192.168.1.1')).toBe(true);
    });
});