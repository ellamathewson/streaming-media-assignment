/* eslint-disable linebreak-style */
const fs = require('fs');
const path = require('path');

const getParty = (request, response) => {
  const file = path.resolve(__dirname, '../client/party.mp4');

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
  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }
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

    /* for streaming need to send back 206 success code
    Tells browser that it can request other ranges (before and after)
    but it has not received the entire file

    Content-Range means how much we are sending out of the total
    Accept-Ranges tells the browser what type of data to expect the range in
    Content-Length tells browser how big this chunk is in bytes
    Content-Type tells browser the encoding type so it can resemble the byte correctly
    */
    const chunksize = (end - start) + 1;

    response.writeHead(206, {
      'Content-Range': `bytes  ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });

    /*
    File streams take a File object and an object containing the start and end
    points in bytes. This way we only load the amount of the file necessary.
    {start, end} creates an object with the variable names set to the same
    as the ones passed in.
    Since streams are asynchronous, we'll need to provide callback functions
    for when the stream is in the open or error states
    Pipe function is a stream function in node that will set the output of
    a stream to another stream. Key to keeping it lightweight
    */
    const stream = fs.createReadStream(file, { start, end });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};

module.exports.getParty = getParty;
