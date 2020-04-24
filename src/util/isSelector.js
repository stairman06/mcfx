const selectors = ["@a", "@r", "@s", "@e"];
function isSelector(string) {
  return selectors.includes(string.substring(0, 2));
}

module.exports = isSelector;
