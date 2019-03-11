'use strict';
const uuidv4 = require('uuid/v4');
const { mongodb } = require('../../resources/config.js').APP_PROPERTIES();
const {MongoWapper} = require('decompany-common-utils');
const USER_TALBE = "USER";
const connectionString = mongodb.endpoint;

module.exports = class AccountService {

	async syncUserInfo(userInfo){
		
		let user = userInfo;

		const mongo = new MongoWapper(connectionString);
		try{
			const queriedUser = await mongo.findOne(USER_TALBE, {
				sub: userInfo.sub
			});
	
			if(queriedUser){
				console.log("saved user", queriedUser);
				user._id = queriedUser._id;
				console.log("update user", user);
			}  else {
				const uuid = uuidv4().replace(/-/gi, "");
				user._id = uuid;
			}
			
			const result = await mongo.save(USER_TALBE, user);
			return user;
		}catch(err){
			throw err;
		} finally {
			mongo.close();
		}

	}

	async getUserInfo(user){
		const mongo = new MongoWapper(connectionString);
		try{
			let query = {};
			if(user.id){
				query = {_id: user.id};
			} else if(user.email) {
				query = {emali: user.emaill};
			} else {
				throw new Error("getUserInfo Not enough query parameters")
			}
				
			const user = await mongo.findOne(USER_TALBE, query);

			return user;
		} catch(e) {
			throw e;
		} finally{
			mongo.close();
		}
	}

	async updateUserInfo(user){
		const mongo = new MongoWapper(connectionString);
		try{	
			if(!user || !user.id){
				throw new Error("user id is invalid!!");
			}

			const savedUser = await mongo.findOne(USER_TALBE, {
				_id: user.id
			});

			if(savedUser){
				console.log("saved user", savedUser);
				if(user.nickname){
					savedUser.nickname = user.nickname;
				}
				
				if(user.picture){
					savedUser.picture = user.picture;
				}

				if(user.username){
					savedUser.username = user.username;
				}
				
				console.log("updated user", savedUser);
				const result = await mongo.save(USER_TALBE, savedUser);
				return result;
			} else {
				console.info("user is not exist", user.id);
			}

		} catch(e) {
			throw e;
		} finally{
			mongo.close();
		}
	}
}