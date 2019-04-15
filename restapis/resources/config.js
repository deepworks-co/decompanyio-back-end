
module.exports.APP_PROPERTIES = (serverless) => {
    //console.log("APP_PROPERTIES init stage", process.env.stage);
    try{
        const stage = process.env.stage?process.env.stage:"local";
        let json;
        if(stage == "local") {
            json = require('./app-properties.local.json');    
        } else {
            json = require(stage?'./app-properties.'+ stage + '.json':'./app-properties.json');
        }

        return json;
    } catch(e){
        console.error(e);
    }


}