const redis = require('redis');
const { RedisStore } = require('connect-redis');

const redisClient = redis.createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@redis-cache:6379`
});


async function connectToRedis () {

    try{
        //connect to the server
        await redisClient.connect();

        if(redisClient.isReady){
            //redis objects to store express-session data 
            const store = new RedisStore({ client: redisClient })
            return store
        } else {
            console.error("Redis client connected but is not ready. Failing startup.");
            throw new Error("Redis client is not ready after connect");
        }
        
    }catch(error){

    //callback error message if not connected
    console.warn("Redis Client Connection Failed")
    throw error

    }

}

// GitHub tokens never expire, so the latest one per user is kept outside the
// session (no TTL) where it can still be revoked after the session is gone
async function getStoredGithubToken(userId) {
    return redisClient.get(`gh_token:${userId}`);
}

async function saveGithubToken(userId, token) {
    return redisClient.set(`gh_token:${userId}`, token);
}

async function deleteStoredGithubToken(userId) {
    return redisClient.del(`gh_token:${userId}`);
}

module.exports = {
    redisClient,
    connectToRedis,
    getStoredGithubToken,
    saveGithubToken,
    deleteStoredGithubToken
};