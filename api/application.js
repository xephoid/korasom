const ALL = "ids";

class Application {
    constructor(redis, web3, kGroup) {
        this.redis = redis;
        this.web3 = web3;
        this.kGroup = kGroup;
        this.prefix = "KSM:application:";

        this.prepopulate();
    }

    async prepopulate() {
        let self = this;
        let applicationIds = await this.ids(true);
        applicationIds.forEach(function (id) {
            self.get(id, true);
        });
    }

    normalize(id, raw) {
        return {
            id: id,
            wallet: raw[0],
            name: web3.toAscii(raw[1]).replace(/\u0000/g, ''),
            website: web3.toAscii(raw[2]).replace(/\u0000/g, ''),
            comments: web3.toAscii(raw[3]).replace(/\u0000/g, ''),
            kind: raw[4].toNumber(),
            state: raw[5].toNumber(),
            yays: raw[6].toNumber(),
            nays: raw[7].toNumber()
        };
    }

    async get(id, force) {
        if (!force && await this.redis.existsAsync(this.prefix + id)) {
            // pull it from redis
            return JSON.parse(await this.redis.getAsync(this.prefix + id));
        } else {
            // grab it from the chain
            let raw = await this.kGroup.getApplicationById.call(id);
            let rawVotes = await this.kGroup.getApplicationVotes.call(id);
            raw[6] = rawVotes[0];
            raw[7] = rawVotes[1];

            // cache it!
            this.set(id, raw);
            return this.normalize(id, raw);
        }
    }

    set(id, raw) {
        return this.redis.setAsync(this.prefix + id, JSON.stringify(this.normalize(id, raw))); // TODO: handle failure
    }
    
    async ids(force) {
        let applicationIds = [];
        if (!force && await this.redis.existsAsync(this.prefix + ALL)) {
            // Get Ids from the cache
            applicationIds = JSON.parse(await this.redis.getAsync(this.prefix + ALL));
        } else {
            // Get Ids from the chain
            let aIds = await this.kGroup.getApplicationIds.call();
            aIds.forEach(function(i) {
                applicationIds.push(i.toNumber());
            });

            // Repopulate the cache
            this.redis.setAsync(this.prefix + ALL, JSON.stringify(applicationIds));
        }
        return applicationIds;
    }
}

module.exports = Application;