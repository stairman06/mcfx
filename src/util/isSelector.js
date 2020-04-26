const selectors = ["@a", "@r", "@s", "@e", "@p"];
function isSelector(string) {
  return selectors.includes(string.substring(0, 2));
}

module.exports = isSelector;
