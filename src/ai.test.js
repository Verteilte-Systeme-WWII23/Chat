const { getAIResponse } = require('./ai');

jest.mock('./ai', () => ({
  getAIResponse: jest.fn()
}));

describe('getAIResponse', () => {
  const mockQuery = 'Hello AI';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return AI response text when the API call is successful', async () => {
    const mockResponse = 'Hello, user!';
    getAIResponse.mockResolvedValue(mockResponse);
    
    const result = await getAIResponse(mockQuery);
    
    expect(getAIResponse).toHaveBeenCalledWith(mockQuery);
    expect(result).toBe(mockResponse);
  });
  
 

});