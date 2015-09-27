/*
Requires all files specified from src to ensure proper coverage reporting.
 */

var
  wrench = require('wrench'),
  src;

src = [
  'dist'
];

src.forEach(readRecursive);

function readRecursive(dir) {
  var
    files = wrench.readdirSyncRecursive(dir);

  files.forEach(requireJsFiles);

  function requireJsFiles(file) {
    if (isValidFile(file)) {
      require('../../' + dir + '/' + file);
    }
  }

  function isValidFile(file) {
    return file.indexOf('.js') >= 0;
  }
}