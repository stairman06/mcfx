const parseChatString = require("../util/chatStringParser");
function commandTell(keys, variables) {
  keys.shift();
  const selector = keys[0];
  keys.shift();
  return [
    parseChatString(keys.join(" "), variables, selector, [
      {
        selector,
        italic: true,
        color: "gray",
      },
      {
        text: " whispers to you: ",
        italic: true,
        color: "gray",
      },
    ]),
    parseChatString(
      keys.join(" "),
      variables,
      "@s",
      [
        {
          text: "You whisper to ",
          italic: true,
          color: "gray",
        },
        {
          selector,
          italic: true,
          color: "gray",
        },
        {
          text: ": ",
          italic: true,
          color: "gray",
        },
      ],
      "tell"
    ),
  ].join("\n");
}

module.exports = { commandTell };
