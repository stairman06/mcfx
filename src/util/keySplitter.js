// TODO: make this a regex
function keySplitter(line) {
  let definedExpressions = 0;
  const out = [];
  let word = '';
  let lastCharacter = '';
  for (let i = 0; i < line.length; i++) {
    let char = line[i];
    if (/\s/.test(char) && definedExpressions === 0) {
      if (word.trim()) out.push(word);
      word = '';
    } else {
      if (definedExpressions === 0 && char !== '$' && char !== '}' && char !== '{') {
        word += char;
      } else {
        word += char;
        if (lastCharacter === '$' && char === '{') {
          definedExpressions++;
        } else if (char === '}') {
          definedExpressions--;
        }

        if (definedExpressions === 0 && char !== '$') {
          out.push(word);
          word = '';
        }
      }
    }
    lastCharacter = char;

    if (i === line.length - 1) {
      out.push(word);
    }
  }

  return out;
}

module.exports = keySplitter;
