/* eslint-disable linebreak-style */
const fs = require('fs');
const path = require('path');

/* Helper function to check if error code is being returned */
const checkErrors = (err, response) => {
  if (err) {
    if (err.code === 'ENOENT') {
      response.writeHead(404);
    }
    return response.end(err);
  } return null;
};

/* Writes head and returns the created stream */
const writeHead = (request, response, stats, file, contentType) => {
  let { range } = request.headers;
  if (!range) {
    /*
        * header range comes from 0000-0001
        Numbers vary depending on the byte range requested
        */
    range = 'bytes=0-';
  }

  const positions = range.replace(/bytes=/, '').split('-');

  let start = parseInt(positions[0], 10);

  const total = stats.size; // gives us total file size in bytes
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  if (start > end) {
    start = end - 1;
  }

  const chunksize = (end - start) + 1;

  response.writeHead(206, {
    'Content-Range': `bytes  ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': contentType,
  });

  return fs.createReadStream(file, { start, end });
};

/* Sorts the stream depending on if its open or returning an error */
const sortStream = (stream, response) => {
  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

/* Passes everything into all the helper functions it calls */
const loadFile = (request, response, filePath, mediaType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    checkErrors(err, response);
    const stream = writeHead(request, response, stats, file, mediaType);
    sortStream(stream, response);
  });
};

/* Gets the video file and passes in request and response */
const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

/* Loads the mp3 file */
const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

/* loads the other video file */
const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
