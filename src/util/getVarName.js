function getVarName(variable) {
  return variable.replace(/\s+/g, "").substring(2, variable.length - 1);
}

module.exports = getVarName;
