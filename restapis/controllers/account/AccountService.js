'use strict';
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {MongoWapper} = require('decompany-common-utils');
const USER_TALBE = tables.USER;
const connectionString = mongodb.endpoint;

module.exports = class AccountService {

	async syncUserInfo(userInfo){
		const mongo = new MongoWapper(connectionString);
		try{
			const queriedUser = await mongo.findOne(USER_TALBE, {
				_id: userInfo.sub
			});
			let result;
			if(queriedUser){
				console.log("user is exists", queriedUser);
				queriedUser.connected = Date.now();
				console.log("update connected time", queriedUser);
				result = await mongo.save(USER_TALBE, queriedUser);
			} else {
				const user = Object.assign({
					_id: userInfo.sub, 
					connected: Date.now()
				}, userInfo);
				result = await mongo.save(USER_TALBE, user);
				console.log("new user", user, result);
			}
			return result;
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
				throw new Error("getUserInfo Not enough query parameters" + JSON.stringify(user));
			}
			
			const result = await mongo.findOne(USER_TALBE, query);

			console.log(result, USER_TALBE, query);

			return result;
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