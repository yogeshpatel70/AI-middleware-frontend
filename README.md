# greetingTool.js

A Node.js module to fetch a greeting from a remote API.

## How to Use

1. Place `greetingTool.js` in your project (already present in this workspace).
2. Import and call the function as shown below:

```js
const { getGreeting } = require('./greetingTool');

getGreeting()
  .then(greeting => {
    console.log('Greeting from API:', greeting);
  })
  .catch(err => {
    console.error('Failed to fetch greeting:', err);
  });
```

## Notes
- This module uses Node.js's built-in `https` package (no external dependencies).
- Useful for backend/server-side code. If you want to make the greeting available to a browser frontend, expose it via your server's API and call that from the client.
- The API endpoint used: https://flow.sokt.io/func/scriQCNeLV1a
