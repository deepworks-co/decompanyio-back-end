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
				console.log("user exists", queriedUser);
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

	async getUserInfo(user, projection){
		const mongo = new MongoWapper(connectionString);
		try{
			let query = {};
			if(user.id){
				query = {_id: user.id};
			} else if(user.email) {
				query = {email: {"$eq": user.email}};
			} else if(user.username) { 
				query = {username: {"$eq": user.username}};
			} else {
				throw new Error("getUserInfo Not enough query parameters" + JSON.stringify(user));
			}
			console.log("query", query);
			const result = await mongo.findOne(USER_TALBE, query, projection);

			console.log("get user", result);

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


	async updateUserEthAccount(userid, ethAccount) {
		const wapper = new MongoWapper(connectionString);
		try{
			return await wapper.update(USER_TALBE, {_id: userid}, {$set:{ethAccount: ethAccount}});
		} catch (e) {
			throw e
		} finally {
			wapper.close();
		}
	}


	async getDocuments(params) {
		const wapper = new MongoWapper(connectionString);

		try{
			let {accountId, pageSize, skip} = params;

			let pipeline = [{
				$match: { accountId: accountId}
			}, {
				$sort:{ created: -1}
			}, {
				$skip: skip
			}, {
				$limit: pageSize
			}, {
				$lookup: {
					from: tables.DOCUMENT_POPULAR,
					localField: "_id",
					foreignField: "_id",
					as: "popularAs"
				}
			}, {
				$lookup: {
					from: tables.USER,
					localField: "accountId",
					foreignField: "_id",
					as: "userAs"
				}
			}, {
				$lookup: {
					from: tables.DOCUMENT_FEATURED,
					localField: "_id",
					foreignField: "_id",
					as: "featuredAs"
				}
				}, {
				$project: {_id: 1, title: 1, created: 1, documentId: 1, documentName: 1, seoTitle: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, seoTitle: 1,   popular: { $arrayElemAt: [ "$popularAs", 0 ] }, featured: { $arrayElemAt: [ "$featuredAs", 0 ] }, author: { $arrayElemAt: [ "$userAs", 0 ] }}
				}, {
				$addFields: {
					latestVoteAmount: "$featured.latestVoteAmount",
					latestPageview: "$popular.latestPageview",
					latestPageviewList: "$popular.latestPageviewList"

				}
				}, {
				$project: {featured: 0, popular: 0}
			}];



			console.log("pipeline", JSON.stringify(pipeline));
			return await wapper.aggregate(tables.DOCUMENT, pipeline);
		} catch (e) {
			throw e
		} finally {
			wapper.close();
		}
	}
}
