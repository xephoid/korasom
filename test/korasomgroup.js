// TODO: figure out why I can't use async / await

var KorasomGroup = artifacts.require("./KorasomGroup.sol");

contract('KorasomGroup', function(accounts) {

    var founder = {
        wallet: accounts[0],
        name: "Founder Name",
        website: "founder-website",
        kind: 3,
        comments: "I am the founder!"
    };

    var toAccept = {
        wallet: accounts[1],
        name: "some-acceptable-org",
        website: "some-acceptable-website",
        kind: 1,
        comments: "You should accept this one!"
    };

    var toReject = {
        wallet: accounts[2],
        name: "some-rejectable-org",
        website: "some-rejectable-website",
        kind: 2,
        comments: "Reject me!"
    };

    var donor = {
        wallet: accounts[3]
    };

    it("should not create another application for an existing member", function() {
        var group;

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;

            return group.createApplication(founder.name, founder.website, founder.kind, founder.comments, {
                from: founder.wallet
            });
        }).then(function(e) {
            assert.fail("Member creating an application should fail.");
        }, function(r) {
            // success!
        });
    });

    it("should create an application correctly", function() {
        var group;

        return KorasomGroup.deployed().then(function(_instance) {
            group = _instance;
            return group.createApplication(toAccept.name, toAccept.website,
                toAccept.kind, toAccept.comments, { from: toAccept.wallet }
            );
        }).then(function() {
            return group.getApplication.call(toAccept.wallet);
        }).then(function(a) {
            assert.notEqual(a[0].toNumber(), 0, "Application was not created with a valid ID!");
            assert.equal(web3.toAscii(a[1]).replace(/\u0000/g, ''), toAccept.name, "Application name was not set correctly");
            assert.equal(web3.toAscii(a[2]).replace(/\u0000/g, ''), toAccept.website, "Application website was not set correctly");
            assert.equal(web3.toAscii(a[3]).replace(/\u0000/g, ''), toAccept.comments, "Application comments was not set correctly");
            assert.equal(a[4].toNumber(), toAccept.kind, "Application was not created with the correct kind!");
            assert.equal(a[5].toNumber(), 1, "Application was not created with the correct state!");
        });
    });

    it("should not let anyone vote on an application that is approved", function() {
        var group;

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;
            return group.voteOnApplication.call(founder.wallet, true);
        }).then(function() {
            assert.fail("Vote should have failed because application is already approved");
        }, function() {
            // success!
        });
    });

    it("should not allow non-members to vote on an application", function() {
        var group;

        return KorasomGroup.deployed().then(function(_instance) {
            group = _instance;
            return group.createApplication(toReject.name, toReject.website,
                toReject.kind, toReject.comments, { from: toReject.wallet }
            );
        }).then(function() {
            return group.voteOnApplication(toReject.wallet, true, { from: toReject.wallet });
        }).then(function() {
            assert.fail("Applicant should not be able to vote on their own application!");
        }, function() {
            return group.getMembersCount.call();
        }).then(function(count) {
            assert.equal(count.toNumber(), 1, "New membership was added when it should not have been!");
        });
    });

    it("should allow members to reject an application", function() {
        var group;

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;
            return group.voteOnApplication(toReject.wallet, false);
        }).then(function() {
            return group.getApplicationVotes.call(toReject.wallet);
        }, function() {
            assert.fail("Member was not allowed to vote on application!");
        }).then(function(a) {
            assert.equal(a[1].toNumber(), 1, "Application should have 1 nay vote");
            return group.getApplication.call(toReject.wallet);
        }).then(function(a) {
            assert.equal(a[5].toNumber(), 3, "Application state should be Rejected");
        });
    });

    it("should allow members to accept an application", function() {
        var group;

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;
            return group.voteOnApplication(toAccept.wallet, true);
        }).then(function() {
            return group.getApplicationVotes.call(toAccept.wallet);
        }).then(function(votes) {
            assert.equal(votes[0], 1, "Application should have 1 yay vote");
            return group.getApplication.call(toAccept.wallet);
        }).then(function(a) {
            assert.equal(a[5], 2, "Application should be approved");
            return group.getMembership.call(toAccept.wallet);
        }).then(function(m) {
            assert.equal(web3.toAscii(m[1]).replace(/\u0000/g, ''), toAccept.name, "New membership has the wrong name");
            assert.equal(web3.toAscii(m[2]).replace(/\u0000/g, ''), toAccept.website, "New membership has the wrong website");
            assert.equal(m[3].toNumber(), toAccept.kind, "New membership is the wrong kind");
            assert.equal(m[4].toNumber(), 1, "New membership is not active!");
        });
    });

    it("should accept an investment from a non-member donor", function() {
        var group;

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;
            return group.invest(toAccept.wallet, { from: donor.wallet, value: 50 });
        }).then(function() {
            return group.balanceOf.call(donor.wallet);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 500, "Donor did not receive the correct amount");
            return group.balanceOf.call(toAccept.wallet);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 4500, "Member did not receive the correct amount");
        });
    });

    it("should not allow non-members to buy tokens directly", function() {
        return KorasomGroup.deployed().then(function(instance) {
            return instance.sendTransaction({
                from: donor.wallet,
                value: 50
            }).then(function() {
                assert.fail();
            }, function(e) {
                // success!
            });
        });
    });

    it("should allow members to buy tokens directly", function() {
        var group;
        return KorasomGroup.deployed().then(function(instance) {
            group = instance;
            return group.sendTransaction({ from: toAccept.wallet, value: 1 });
        }).then(function() {
            return group.balanceOf.call(toAccept.wallet);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 4600, "Member balance was not increased after direct purchase");
        });
    });
});