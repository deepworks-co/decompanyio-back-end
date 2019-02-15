'use strict';
const uuidv4 = require('uuid/v4');
const { mongodb } = require('../../resources/config.js').APP_PROPERTIES();
const MongoWapper = require('decompany-common-utils').MongoWapper;
const USER_TALBE = "USER";
const connectionString = mongodb.endpoint;
const mongo = new MongoWapper(connectionString);
module.exports = class AccountService {

	async syncUserInfo(userInfo){
		
		let user = userInfo;

		const queriedUser = await mongo.findOne(USER_TALBE, {
			sub: userInfo.sub
		});

		if(queriedUser){
			console.log("saved user", queriedUser);
			user._id = queriedUser._id;
			user.id = queriedUser.id;
			console.log("update user", user);
		}  else {
			const uuid = uuidv4().replace(/-/gi, "");
			user.id = uuid;
		}
		
		const result = await mongo.save(USER_TALBE, user);
		return user;
		
	}

	async getUserInfo(user){
		
		try{
			let query = {};
			if(user.id){
				query = {id: user.id};
			} else if(user.email) {
				query = {emali: user.emaill};
			} else {
				throw new Error("getUserInfo Not enough query parameters")
			}
				
			const user = await mongo.findOne(USER_TALBE, query);

			return user;
		} catch(e) {
			console.error("getUserInfo error", e);
		}
	}

	async updateUserInfo(user){
		
		try{	
			const savedUser = await mongo.findOne(USER_TALBE, {
				id: user.id
			});

			if(savedUser){
				console.log("saved user", savedUser);
				if(user.nickname){
					savedUser.nickname = user.nickname;
				}
				
				if(user.picture){
					savedUser.picture = user.picture;
				}
				
				console.log("updated user", savedUser);
				const result = await mongo.save(USER_TALBE, savedUser);
			} 
			
			
		} catch(e) {
			console.error("updateUserInfo error", e);
		}
	}
}