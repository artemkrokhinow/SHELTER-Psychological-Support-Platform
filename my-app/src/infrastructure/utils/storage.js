

class SafeStorage {
    constructor() {
        this.isAvailable = this.checkStorageAvailability();
        this.memoryStorage = {};
    }

    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    setItem(key, value) {
        try {
            if (this.isAvailable) {
                localStorage.setItem(key, value);
            } else {
                this.memoryStorage[key] = value;
            }
        } catch (e) {
            this.memoryStorage[key] = value;
        }
    }

    getItem(key) {
        try {
            if (this.isAvailable) {
                return localStorage.getItem(key);
            } else {
                return this.memoryStorage[key] || null;
            }
        } catch (e) {
            return this.memoryStorage[key] || null;
        }
    }

    removeItem(key) {
        try {
            if (this.isAvailable) {
                localStorage.removeItem(key);
            } else {
                delete this.memoryStorage[key];
            }
        } catch (e) {
            delete this.memoryStorage[key];
        }
    }

    clear() {
        try {
            if (this.isAvailable) {
                localStorage.clear();
            } else {
                this.memoryStorage = {};
            }
        } catch (e) {
            this.memoryStorage = {};
        }
    }

    
    isLocalStorageAvailable() {
        return this.isAvailable;
    }
}

const safeStorage = new SafeStorage();

export default safeStorage;
