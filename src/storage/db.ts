/**
 * Offline-first IndexedDB Database Service
 * Provides durable storage for the Academic Operating System
 */

import { Folder, Tag, Lecture, ResearchPaper, ExperimentalLog, ResearchProject, AcademicNote, MediaRecord } from "../types";

const DB_NAME = "academic_os_db";
const DB_VERSION = 1;

const STORES = {
  FOLDERS: "folders",
  TAGS: "tags",
  LECTURES: "lectures",
  PAPERS: "papers",
  PROJECTS: "projects",
  LOGS: "logs",
  NOTES: "notes",
  MEDIA: "media",
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Helper for atomic transaction resolution
function transaction<T>(
  db: IDBDatabase,
  storeNames: string | string[],
  mode: IDBTransactionMode,
  callback: (stores: IDBObjectStore | IDBObjectStore[]) => IDBRequest | Promise<any>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const storeObj = Array.isArray(storeNames)
      ? storeNames.map((name) => tx.objectStore(name))
      : tx.objectStore(storeNames);
    
    let request: any;
    try {
      request = callback(storeObj);
    } catch (err) {
      tx.abort();
      return reject(err);
    }

    tx.oncomplete = () => {
      resolve(request && 'result' in request ? request.result : request);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export const AcademicDB = {
  _db: null as IDBDatabase | null,

  async getDB(): Promise<IDBDatabase> {
    if (!this._db) {
      this._db = await openDB();
    }
    return this._db;
  },

  // === FOLDERS ===
  async getFolders(): Promise<Folder[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.FOLDERS, "readonly");
      const req = tx.objectStore(STORES.FOLDERS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveFolder(folder: Folder): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.FOLDERS, "readwrite", (store) => 
      (store as IDBObjectStore).put(folder)
    );
  },

  async deleteFolder(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.FOLDERS, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  },

  // === TAGS ===
  async getTags(): Promise<Tag[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TAGS, "readonly");
      const req = tx.objectStore(STORES.TAGS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveTag(tag: Tag): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.TAGS, "readwrite", (store) => 
      (store as IDBObjectStore).put(tag)
    );
  },

  async deleteTag(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.TAGS, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  },

  // === LECTURES ===
  async getLectures(): Promise<Lecture[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.LECTURES, "readonly");
      const req = tx.objectStore(STORES.LECTURES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveLecture(lecture: Lecture): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.LECTURES, "readwrite", (store) => 
      (store as IDBObjectStore).put(lecture)
    );
  },

  async deleteLecture(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.LECTURES, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  },

  // === RESEARCH PAPERS ===
  async getPapers(): Promise<ResearchPaper[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PAPERS, "readonly");
      const req = tx.objectStore(STORES.PAPERS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async savePaper(paper: ResearchPaper): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.PAPERS, "readwrite", (store) => 
      (store as IDBObjectStore).put(paper)
    );
  },

  async deletePaper(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.PAPERS, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  },

  // === EXPERIMENTAL LOGS ===
  async getLogs(): Promise<ExperimentalLog[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.LOGS, "readonly");
      const req = tx.objectStore(STORES.LOGS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveLog(log: ExperimentalLog): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.LOGS, "readwrite", (store) => 
      (store as IDBObjectStore).put(log)
    );
  },

  async deleteLog(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.LOGS, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  },

  // === RESEARCH PROJECTS ===
  async getProjects(): Promise<ResearchProject[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PROJECTS, "readonly");
      const req = tx.objectStore(STORES.PROJECTS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveProject(project: ResearchProject): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.PROJECTS, "readwrite", (store) => 
      (store as IDBObjectStore).put(project)
    );
  },

  async deleteProject(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.PROJECTS, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  },

  // === ACADEMIC NOTES ===
  async getNotes(): Promise<AcademicNote[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, "readonly");
      const req = tx.objectStore(STORES.NOTES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveNote(note: AcademicNote): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.NOTES, "readwrite", (store) => 
      (store as IDBObjectStore).put(note)
    );
  },

  async deleteNote(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.NOTES, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  },

  // === MEDIA RECORDS ===
  async getMediaRecord(id: string): Promise<MediaRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA, "readonly");
      const req = tx.objectStore(STORES.MEDIA).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async getMediaForParent(parentId: string): Promise<MediaRecord[]> {
    const db = await this.getDB();
    const all = await this.getAllMediaRecords();
    return all.filter((m) => m.parentId === parentId);
  },

  async getAllMediaRecords(): Promise<MediaRecord[]> {
    const db = await this.getDB();
    const all: MediaRecord[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEDIA, "readonly");
      const req = tx.objectStore(STORES.MEDIA).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    return all;
  },

  async saveMediaRecord(media: MediaRecord): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.MEDIA, "readwrite", (store) => 
      (store as IDBObjectStore).put(media)
    );
  },

  async deleteMediaRecord(id: string): Promise<void> {
    const db = await this.getDB();
    await transaction(db, STORES.MEDIA, "readwrite", (store) => 
      (store as IDBObjectStore).delete(id)
    );
  }
};
