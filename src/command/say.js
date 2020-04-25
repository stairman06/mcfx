const parseChatString = require("../util/chatStringParser");

function commandSay(keys, variables, fileName) {
  keys.shift();
  return parseChatString(
    keys.join(" "),
    variables,
    "@a",
    fileName,
    [
      {
        text: "[",
      },
      {
        selector: "@s",
      },
      {
        text: "] ",
      },
    ],
    "say",
    false
  );
}

module.exports = { commandSay };
