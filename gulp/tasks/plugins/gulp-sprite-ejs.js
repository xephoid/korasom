const { Transform } = require('stream');

const processFileContent = (file) => {
  const fileSplitToChars = file._contents.toString().split('');
  const fileJoinedAndFiltered = fileSplitToChars.reduce((acu, currentChar, index, array) => {
    let { next } = acu;
    const { whole } = acu;

    next.push(currentChar);

    if (currentChar === '>') {
      whole.push(acu.next.join(''));
      next = [];
    }

    if (index === array.length - 1) {
      const fileSplitToSegments = whole.slice(2);
      const fileSegmentsFiltered = fileSplitToSegments.map((segment, segmentIndex) => {
        let segmentSections;
        if (segment.substr(0, 4) === '<svg') {
          segmentSections = segment.split(' ');
          if (segmentIndex === 0) {
            segmentSections
              .splice(1, 0, 'style="display: none"');
          } else {
            segmentSections = segmentSections
              .filter(section => section.substr(0, 3) !== 'y="' && section.substr(0, 3) !== 'x="');
          }
          segmentSections = segmentSections.join(' ');
        }
        return segmentSections || segment;
      });
      return Buffer.from(fileSegmentsFiltered.join(''), 'utf8');
    }
    return { whole, next };
  }, { whole: [], next: [] });

  file._contents = fileJoinedAndFiltered;
  return file;
};

module.exports = () => {
  const transformStream = new Transform({ objectMode: true });
  transformStream._transform = (file, encoding, callback) => {
    const output = processFileContent(file);
    callback(null, output);
  };

  return transformStream;
};
