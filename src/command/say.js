const parseChatString = require("../util/chatStringParser");

function commandSay(keys, variables) {
  keys.shift();
  return parseChatString(
    keys.join(" "),
    variables,
    "@a",
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
