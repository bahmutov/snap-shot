const fs = require('fs')

module.exports = {
  readFileSync: fs.readFileSync,
  existsSync: fs.existsSync,
  mkdirSync: fs.mkdirSync,
  writeFileSync: fs.writeFileSync
}
