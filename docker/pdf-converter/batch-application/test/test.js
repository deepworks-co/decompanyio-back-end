const assert = require('assert');
const fileWrapper = require('../src/file-wrapper')

describe('pdf -> base64 -> gzip compress', () => {
    it('base 64 test', async () => {
        const filepath = "/Users/jay/Documents/test/c64bfec0add949e280de9db670f43331.pdf";
        const destPath = "/Users/jay/Documents/test/c64bfec0add949e280de9db670f43331.pdf.base64";
        const stream = fileWrapper.readFile(filepath);
        const base64 = await fileWrapper.encodeBase64(stream);
        const zipBase64 = await fileWrapper.gzip(base64);
        fileWrapper.writeFile(destPath, zipBase64);
        assert.equal(typeof(base64) === "string", true);
    });
});


describe('decompress', () => {
    it('base 64 test', async () => {
        const filepath = "/Users/jay/Documents/test/c64bfec0add949e280de9db670f43331.pdf.base64";
        const destPath = "/Users/jay/Documents/test/c64bfec0add949e280de9db670f43331.pdf.base64.decompressed";
        const stream = fileWrapper.readFile(filepath);
        const base64Buffer = await fileWrapper.unzip(stream);
        const base64String = base64Buffer.toString("utf-8")
        fileWrapper.writeFile(destPath, base64String);
        assert.equal(typeof(base64String) === "string", true);
    });
});