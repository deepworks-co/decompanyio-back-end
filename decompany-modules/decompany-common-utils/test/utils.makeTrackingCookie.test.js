const utils = require('../src/utils');

test('https://www.polarishare.com', () => {
    const origin = 'https://www.polarishare.com'
    const result = utils.makeTrackingCookie({
        _sid: 'test_sid',
        _cid: 'test_cid',
        _did: 'test_did'
    }, origin)
    expect(result['Access-Control-Allow-Origin']).toBe("polarishare.com");
});


test('https://share.decompany.io', () => {
    const origin = 'https://share.decompany.io'
    const result = utils.makeTrackingCookie({
        _sid: 'test_sid',
        _cid: 'test_cid',
        _did: 'test_did'
    }, origin)
    expect(result['Access-Control-Allow-Origin']).toBe("share.decompany.io");
});