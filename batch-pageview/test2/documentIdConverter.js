
const Web3 = require('web3');
const web3 = new Web3('https://rinkeby.infura.io/v3/43132d938aaa4d96a453fd1c708b7f6c');

const bytes32DocIds = ['0x3562616230396466373065643433303761616436363733303066633063393563', '0x3833343465363738343531343463336138333735353763393735646532653562']
console.log(bytes32DocIds.map((bytes32Id)=>{
    return web3.utils.hexToAscii(bytes32Id);
}));

