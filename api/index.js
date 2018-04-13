const app = require('express')();
const bluebird = require('bluebird');
const Web3 = require('web3');
const contract = require('truffle-contract');
const KorasomGroup = contract(require('../build/contracts/KorasomGroup.json'));
const redis = require('redis');

// Promisify redis functions
bluebird.promisifyAll(redis.RedisClient.prototype);

// Connect to redis server
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379
});

// Handle redis errors
redisClient.on("error", function (err) {
    console.log("Redis Error: " + err);
});

// Initialize connection to the chain
if (typeof web3 !== 'undefined') {
    console.log("web3 connection exists!");
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    console.log("web3 connecting to " + (process.env.HTTP_PROVIDER || "http://localhost:8545"));
    web3 = new Web3(new Web3.providers.HttpProvider(process.env.HTTP_PROVIDER || "http://localhost:8545"));
}

// Set up DAOs
let Membership = require('./membership');
let Application = require('./application');

let kGroup;
KorasomGroup.setProvider(web3.currentProvider);
KorasomGroup.deployed().then(function(group) {
    kGroup = group;
    Membership = new Membership(redisClient, web3, kGroup);
    Application = new Application(redisClient, web3, kGroup);

    Membership.populate();
    Application.populate();
});

app.get('/getMembershipIds', async function(req, res, next) {
    return res.json(await Membership.ids());
});

app.get('/getMembership/:id', async function(req, res, next) {
    return res.json(await Membership.get(req.params.id));
});

app.get('/getApplicationIds', async function(req, res, next) {
    return res.json(await Application.ids());
});

app.get('/getApplication/:id', async function(req, res, next) {
    return res.json(await Application.get(req.params.id));
});

//
// app.get('/invest');
//
// app.get('/voteOnApplication');
// app.get('/getApplicationIds');
// app.get('/getApplicationById');
// app.get('/getMemberVoteOnApplication');
// app.get('/getMembership');
// app.get('/getMembershipById');
// app.get('/getMembersCount');
// app.get('/getMemberIds');
//
// app.get('/createApplication');
// app.get('/getApplicationById');
// app.get('/getApplication');
// app.get('/getApplicationVotes');
// app.get('/getApplicationsCount');
// app.get('/getApplicationIds');


module.exports = app;