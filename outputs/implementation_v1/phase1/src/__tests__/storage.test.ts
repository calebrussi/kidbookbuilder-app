import path from 'path';
import fs from 'fs';
import { Storage } from '../utils/storage';

// Create a temporary test directory
const testDir = path.join(__dirname, '../../temp-test-storage');

describe('Storage Utility', () => {
  let storage: Storage;

  beforeAll(() => {
    // Set up the storage with test directory
    storage = new Storage(testDir);
  });

  afterAll(() => {
    // Clean up test directory after tests
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create the base directory if it does not exist', () => {
    expect(fs.existsSync(testDir)).toBe(true);
  });

  it('should write a file and read it back correctly', () => {
    const testContent = 'Hello, this is test content';
    const testFilePath = 'test-file.txt';

    // Write test file
    const fullPath = storage.writeFile(testFilePath, testContent);
    expect(fs.existsSync(fullPath)).toBe(true);

    // Read test file
    const content = storage.readFile(testFilePath);
    expect(content).not.toBeNull();
    expect(content?.toString()).toBe(testContent);
  });

  it('should create subdirectories as needed', () => {
    const nestedPath = 'nested/directory/test-file.txt';
    const testContent = 'Content in nested directory';

    const fullPath = storage.writeFile(nestedPath, testContent);
    expect(fs.existsSync(fullPath)).toBe(true);

    const nestedDir = path.join(testDir, 'nested/directory');
    expect(fs.existsSync(nestedDir)).toBe(true);
  });

  it('should delete files', () => {
    const testFilePath = 'file-to-delete.txt';
    storage.writeFile(testFilePath, 'This file will be deleted');

    const fullPath = path.join(testDir, testFilePath);
    expect(fs.existsSync(fullPath)).toBe(true);

    const result = storage.deleteFile(testFilePath);
    expect(result).toBe(true);
    expect(fs.existsSync(fullPath)).toBe(false);
  });

  it('should list files in a directory', () => {
    // Create multiple files
    storage.writeFile('list-test/file1.txt', 'File 1');
    storage.writeFile('list-test/file2.txt', 'File 2');
    storage.writeFile('list-test/file3.txt', 'File 3');

    const files = storage.listFiles('list-test');
    expect(files.length).toBe(3);
    expect(files).toContain('file1.txt');
    expect(files).toContain('file2.txt');
    expect(files).toContain('file3.txt');
  });
});
