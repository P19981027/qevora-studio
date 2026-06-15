const fs = require('fs');
const path = require('path');
const config = require('../config');

class JsonStore {
  constructor(filename) {
    this.filePath = path.join(config.dataDir, filename);
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

module.exports = JsonStore;
