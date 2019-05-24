const {utils} = require("../index.js");

test=(str)=>console.log(">", str);

test(utils.toSeoFriendly("맥북 프로로 개발 잘하는법 준비 됐나?"));
test(utils.toSeoFriendly("macbook pro로 개발 잘하는법 r u ready?"));
test(utils.toSeoFriendly(12312312));
