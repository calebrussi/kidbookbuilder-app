import fs from 'fs';
import path from 'path';

/**
 * Storage utility class for file operations
 */
export class Storage {
  private basePath: string;

  /**
   * Creates a storage utility instance
   * @param basePath Base directory for storage operations
   */
  constructor(basePath: string) {
    this.basePath = basePath;
    this.ensureDirectory(this.basePath);
  }

  /**
   * Ensures a directory exists
   * @param dirPath Directory path to check/create
   */
  public ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Gets the full path for a relative path
   * @param relativePath Relative path within the base directory
   * @returns Full path
   */
  public getFullPath(relativePath: string): string {
    return path.join(this.basePath, relativePath);
  }

  /**
   * Writes data to a file
   * @param relativePath Relative path within the base directory
   * @param data Data to write
   * @returns Full path to the written file
   */
  public writeFile(relativePath: string, data: string | Buffer): string {
    const fullPath = path.join(this.basePath, relativePath);
    const dirPath = path.dirname(fullPath);
    this.ensureDirectory(dirPath);
    fs.writeFileSync(fullPath, data);
    return fullPath;
  }

  /**
   * Reads data from a file
   * @param relativePath Relative path within the base directory
   * @returns File content or null if the file doesn't exist
   */
  public readFile(relativePath: string): Buffer | null {
    const fullPath = path.join(this.basePath, relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
    return null;
  }

  /**
   * Deletes a file
   * @param relativePath Relative path within the base directory
   * @returns True if the file was deleted, false otherwise
   */
  public deleteFile(relativePath: string): boolean {
    const fullPath = path.join(this.basePath, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  /**
   * Lists files in a directory
   * @param relativePath Relative path within the base directory
   * @returns Array of file names or empty array if the directory doesn't exist
   */
  public listFiles(relativePath: string = ''): string[] {
    const fullPath = path.join(this.basePath, relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readdirSync(fullPath);
    }
    return [];
  }
} 