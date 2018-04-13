const ALL = "ids";

class Membership {
    constructor(redis, web3, kGroup) {
        this.redis = redis;
        this.web3 = web3;
        this.kGroup = kGroup;
        this.prefix = "KSM:member:";

        this.prepopulate();
    }

    async prepopulate() {
        let self = this;
        let memberIds = await this.ids(true);
        memberIds.forEach(function (id) {
            self.get(id, true);
        });
    }
    /*
     * Do all the conversion stuff to turn it into an easy to use json object.
     */
    normalize(id, raw) {
        return {
            id: id,
            wallet: raw[0],
            name: this.web3.toAscii(raw[1]).replace(/\u0000/g, ''),
            website: this.web3.toAscii(raw[2]).replace(/\u0000/g, ''),
            kind: raw[3].toNumber(),
            state: raw[4].toNumber()
        };
    }

    async get(id, force) {
        if (!force && await this.redis.existsAsync(this.prefix + id)) {
            // pull it from redis
            return JSON.parse(await this.redis.getAsync(this.prefix + id));
        } else {
            // grab it from the chain
            let raw = await this.kGroup.getMembershipById.call(id);
            
            // cache it!
            this.set(id, raw);
            return this.normalize(id, raw);
        }
    }

    set(id, raw) {
        return this.redis.setAsync(this.prefix + id, JSON.stringify(this.normalize(id, raw))); // TODO: handle failure
    }

    async ids(force) {
        let memberIds = [];
        if (!force && await this.redis.existsAsync(this.prefix + ALL)) {
            // Get Ids from the cache
            memberIds = JSON.parse(await this.redis.getAsync(this.prefix + ALL));
        } else {
            // Get Ids from the chain
            memberIds = await this.kGroup.getMemberIds.call();

            // Repopulate the cache
            this.redis.setAsync(this.prefix + ALL, JSON.stringify(memberIds));
        }
        return memberIds;
    }
}

module.exports = Membership;