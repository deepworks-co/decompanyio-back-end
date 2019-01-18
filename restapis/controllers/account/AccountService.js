'use strict';
const MongoWapper = require('../../libs/mongo/MongoWapper.js');

const USER_TALBE = "USER";
const connectionString = 'mongodb://decompany:decompany1234@localhost:27017/decompany';
const mongo = new MongoWapper(connectionString);
module.exports = class AccountService {

	async syncUserInfo(userInfo){
		
		try{
			let user = userInfo;

			const queriedUser = await mongo.findOne(USER_TALBE, {
				id: userInfo.id
			});

			if(queriedUser){
				console.log("saved user", queriedUser);
				user._id = queriedUser._id;
				console.log("update user", user);
			} 
			
			const result = await mongo.save(USER_TALBE, user);
			return true;
		} catch(e) {
			console.error("syncUserInfo error", e);
			return false;
		}
	}
}