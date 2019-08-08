const assert = require('assert');
const fileWrapper = require('../src/file-wrapper')

describe('file wrapper', () => {
    it('base 64 test', async () => {
        const filepath = "/Users/jay/Documents/test/rsa.pdf";
        const destPath = "/Users/jay/Documents/test/rsa.pdf.base64";
        const stream = fileWrapper.readFile(filepath);
        const base64 = await fileWrapper.encodeBase64(stream);
        fileWrapper.writeFile(destPath, base64);
        assert.equal(typeof(base64) === "string", true);
    });
});
