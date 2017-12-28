const fetchStdin = function() {
  return new Promise(function(resolve, reject) {
    var encoding = 'utf-8';
    var data;
    if (process.stdin.isTTY) {
      data = new Buffer(process.argv[2] || '', encoding);
      resolve(data);
    }
    else {
      data = '';
      process.stdin.setEncoding(encoding);

      process.stdin.on('readable', function() {
        var chunk;
        while (chunk = process.stdin.read()) {
          data += chunk;
        }
      });

      process.stdin.on('end', function () {
        data = data.replace(/\n$/, '');
        resolve(data);
      });
    }
  })
}
module.exports = fetchStdin
