import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "server", "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class MongooseModel<T extends { _id?: string }> {
  private filePath: string;

  constructor(private collectionName: string) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), "utf-8");
    }
  }

  private readData(): T[] {
    try {
      const content = fs.readFileSync(this.filePath, "utf-8");
      if (!content.trim()) return [];
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed as T[] : [];
    } catch (err) {
      console.error(`Error reading ${this.collectionName} data:`, err);
      return [];
    }
  }

  private writeData(data: T[]): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error(`Error writing ${this.collectionName} data:`, err);
    }
  }

  async find(query: Partial<T> = {}): Promise<T[]> {
    const data = this.readData();
    return data.filter((item) => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query: Partial<T> = {}): Promise<T | null> {
    const data = this.readData();
    const found = data.find((item) => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return found || null;
  }

  async findById(id: string): Promise<T | null> {
    const data = this.readData();
    const found = data.find((item) => item._id === id);
    return found || null;
  }

  async create(doc: Omit<T, "_id"> & { _id?: string }): Promise<T> {
    const data = this.readData();
    const newDoc = {
      _id: doc._id || Math.random().toString(36).substring(2, 11),
      ...doc,
    } as unknown as T;
    data.push(newDoc);
    this.writeData(data);
    return newDoc;
  }

  async findByIdAndUpdate(
    id: string,
    update: Partial<Omit<T, "_id">>,
    options: { new?: boolean } = { new: true }
  ): Promise<T | null> {
    const data = this.readData();
    const index = data.findIndex((item) => item._id === id);
    if (index === -1) return null;

    data[index] = { ...data[index], ...update };
    this.writeData(data);
    return data[index];
  }

  async deleteOne(query: Partial<T>): Promise<{ deletedCount: number }> {
    const data = this.readData();
    const initialLength = data.length;
    const index = data.findIndex((item) => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });

    if (index !== -1) {
      data.splice(index, 1);
      this.writeData(data);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query: Partial<T>): Promise<{ deletedCount: number }> {
    const data = this.readData();
    const initialLength = data.length;
    const filtered = data.filter((item) => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return true; // Keep if it doesn't match the delete query
        }
      }
      return false; // Remove if it matches the delete query
    });

    this.writeData(filtered);
    return { deletedCount: initialLength - filtered.length };
  }
}
