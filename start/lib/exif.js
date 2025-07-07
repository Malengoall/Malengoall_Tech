const fs = require('fs');
const path = require('path');

function getExifData(filePath) {
  // Hii ni function ya mfano - inarudisha EXIF dummy data
  if (!fs.existsSync(filePath)) {
    throw new Error('File haipo: ' + filePath);
  }

  return {
    camera: 'Sony A7 III',
    resolution: '6000x4000',
    dateTaken: '2025-07-07',
  };
}

module.exports = {
  getExifData
};
