const https = require('https');

/**
 * Fetch greeting from the API (https://flow.sokt.io/func/scriQCNeLV1a).
 * @returns {Promise<string>} Resolves to the greeting string from the API.
 */
function getGreeting() {
  return new Promise((resolve, reject) => {
    https.get('https://flow.sokt.io/func/scriQCNeLV1a', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          // Try to parse as JSON, otherwise fall back to a string
          const parsed = JSON.parse(data);
          // If greeting is a field, use it, else return the whole object
          if (parsed && parsed.greeting) {
            resolve(parsed.greeting);
          } else {
            resolve(data);
          }
        } catch (e) {
          // Not JSON; return the raw data
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  getGreeting,
};
