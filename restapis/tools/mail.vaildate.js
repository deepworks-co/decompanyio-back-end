const { utils } = require('decompany-common-utils');

function test (email){
    const result = utils.validateEmail(email);
    console.log(`${email} is vaildate ${result}`);
}

test("jay@decompany.io");
test("테스트@decompany.io");
test("jay@decompany");
test("jay@123.123");
test("jay@$%^ㄴㅇㄹㅇㄴㄹㄴ");
test("나야나@메일닷컴");
test("abc@abc.abcd");
