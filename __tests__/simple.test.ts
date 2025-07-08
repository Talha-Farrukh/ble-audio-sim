// Simple test to verify Jest setup
describe('Simple Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    expect('hello world').toContain('world');
  });

  it('should work with objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name', 'test');
    expect(obj.value).toBe(42);
  });
}); 