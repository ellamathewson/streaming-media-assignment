/* eslint-disable linebreak-style */
const fs = require('fs');
const path = require('path');

const checkErrors = (err, response) => {
  if (err) {
    if (err.code === 'ENOENT') {
      response.writeHead(404);
    }
    return response.end(err);
  } return null;
};

const writeHead = (request, stats, response, file, contentType) => {
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

const sortStream = (stream, response) => {
  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

const loadFile = (response, request, filePath, mediaType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    checkErrors(err, response);
    const stream = writeHead(request, stats, response, file, mediaType);
    sortStream(stream, response);
  });
};

const getParty = (request, response) => {
  loadFile(response, request, '../client/party.mp4', 'video/mp4');
  /*
    * asynchronous function. Takes a file object
    and a callback function of waht to do next
    When stat function loads the file, it will
    then call the callback function that has been
    passed in.
    The callback of this function receives an err field
    and a stats object. If the err field is not null,
    then there was an error.
    If the error code is ENOENT (Error No Entry), then the file
    could not be found
  */
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
