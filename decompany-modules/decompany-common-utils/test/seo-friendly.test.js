const {utils} = require("../index.js");

test('seo friend test 1', () => {

    const s = utils.toSeoFriendly("맥북 프로로 개발 잘하는법 준비 됐나?")
    console.log(s);

});

test('seo friend test 2', () => {

    const s = utils.toSeoFriendly("macbook pro로 개발 잘하는법 r u ready?");
    console.log(s);
});

test('seo friend test 3', () => {

    const s = utils.toSeoFriendly(12312312);
    console.log(s);
});