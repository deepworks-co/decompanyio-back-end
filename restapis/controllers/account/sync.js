'use strict';
const { mongodb, tables } = require('decompany-app-properties');
const {MongoWrapper, utils} = require('decompany-common-utils');
const uuidv4 = require('uuid/v4');
const USER_TALBE = tables.USER;
const connectionString = mongodb.endpoint;

const mongo = new MongoWrapper(mongodb.endpoint);

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  const {principalId, body} = event;
  if(!principalId || !body ){
    throw new Error(JSON.stringify({
      success: false,
      message: 'principalId or parameters is invalid!'
    }));
  }

  const provider = body.sub?body.sub.split("|")[0]:null;
  const claims = {
    email: body.email,
    name: body.name,
    picture: body.picture,
    nickname: body.nickname,
    family_name: body.family_name,
    locale: body.locale,
    sub: body.sub,
    provider: provider
  }
  const result = await syncUserInfo(principalId, claims);
  
  return JSON.stringify({
    success: true,
    result: result
  });
  
}

async function syncUserInfo(principalId, claims){
  try{
    const queriedUser = await mongo.findOne(USER_TALBE, {
      _id: claims.sub
    });
    let result;
    if(queriedUser){
      //existing user
      result = await mongo.update(USER_TALBE, {_id: queriedUser._id}, {
        $set: {
          connected: Date.now()
        }
      });
    } else {
      //new user
      const user = Object.assign({
        _id: claims.sub, 
        connected: Date.now()
      }, claims);
      result = await mongo.insert(USER_TALBE, user);
      console.log("new user", JSON.stringify({user, result}));

      
      /*
       * 초기 가입시 welcome 이메일 보내기
      await mongo.save(tables.SEND_EMAIL, {
        email: user.email,
        emailType: "WELCOME",
        created: Date.now()
      });
      */
    }
    const {success, profileId} = await updateProfile(claims)

    if(!queriedUser.profileId){
      await mongo.update(USER_TALBE, {_id: claims.sub}, {$set: {profileId: profileId}})
    }
    

    return Promise.resolve(result);
  }catch(err){
    throw err;
  } 
  
}

async function updateProfile(claims){

  const {id, isNew, profile} = await getProfileIdFromUserId(claims.sub)

  if(!id){
    throw new Error('Error get profile id');
  }

  if(profile && profile.userIds && profile.userIds.includes(claims.sub)){
    //이미 해당 유저가 포함되어 있음
    console.log("userId already include");
    return Promise.resolve({success: true})
  }
  
  await mongo.save(tables.USER_PROFILE, Object.assign(claims, { _id: id }))
 
  await mongo.update(tables.USER_PROFILE, { _id: id }, {
    $push: { userIds: claims.sub }
  }, {upsert: true})

  return Promise.resolve({success: true, profileId: id})
}

async function getProfileIdFromUserId(userId){

  if(!userId){
    throw Error('userId is null');
  }
  
  const profiles = await mongo.find(tables.USER_PROFILE, {$in: {userIds: userId}})

  if(profiles && profiles[0]){
    const id = profiles[0]._id
    return Promise.resolve({id, isNew: false, profile: profiles[0]});
  } else {
    const id = await generateProfileId(1)
    return Promise.resolve({id, isNew: true});
  }

}

async function generateProfileId(cnt){
  
  if(cnt > 10) {
    return Promise.reject(new Error(`profile id crash in generating : ${cnt}`))
  }

  const id = uuidv4().replace(/-/gi, "");

  const profiles = await mongo.find(tables.USER_PROFILE, {_id: id})

  if(profiles && profiles[0]){
    return generateProfileId(cnt + 1)
  } else {
    return Promise.resolve(id);
  }
}