const parseChatString = require("../util/chatStringParser");
function commandSendChat(keys, variables) {
  keys.shift();
  const selector = keys[0];
  keys.shift();
  return parseChatString(keys.join(" "), variables, selector);
}

module.exports = { commandSendChat };
