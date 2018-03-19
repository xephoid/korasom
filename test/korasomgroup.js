var KorasomGroup = artifacts.require("./KorasomGroup.sol");

contract('KorasomGroup', function(accounts) {

    var tName = "some-application-name";
    var tWebsite = "some-website";
    var tComments = "some-comments";
    var tKind = 3;

    it("should not create another application for an existing member", function() {
        var group;

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;

            var tName = "some-application-name";
            var tWebsite = "some-website";
            var tComments = "some-comments";

            return group.createApplication(tName, tWebsite, 3, tComments, {
                from: accounts[0]
            });
        }).then(function(e) {
            assert.fail("Member creating an application should fail.");
        }, function(r) {
            // success!
        });
    });

    it("should create an application correctly", function() {
        var group;

        var applicant = accounts[1];

        return KorasomGroup.deployed().then(function(_instance) {
            group = _instance;
            return group.createApplication(tName, tWebsite, tKind, tComments, {
                from: applicant
            });
        }).then(function(r) {
            return group.getApplication.call(applicant);
        }).then(function(a) {
            assert.notEqual(a[0].toNumber(), 0, "Application was not created with a valid ID!");
            assert.equal(web3.toAscii(a[1]).replace(/\u0000/g, ''), tName, "Application name was not set correctly");
            assert.equal(web3.toAscii(a[2]).replace(/\u0000/g, ''), tWebsite, "Application website was not set correctly");
            assert.equal(web3.toAscii(a[3]).replace(/\u0000/g, ''), tComments, "Application comments was not set correctly");
            assert.equal(a[4].toNumber(), 3, "Application was not created with the correct kind!");
            assert.equal(a[5].toNumber(), 1, "Application was not created with the correct state!");
        });
    });

    it("should not let anyone vote on an application that is approved", function() {
        var group;

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;
            return group.voteOnApplication.call(accounts[0], true);
        }).then(function(success) {
            assert.fail("Vote should have failed because application is already approved");
        }, function() {
            // success!
        });
    });

    it("should not allow non-members to vote on an application", function() {
        var group;

        var applicant = accounts[2];

        return KorasomGroup.deployed().then(function(_instance) {
            group = _instance;
            return group.createApplication(tName, tWebsite, tKind, tComments, {
                from: applicant
            });
        }).then(function(r) {
            return group.voteOnApplication(applicant, true, { from: applicant });
        }).then(function(a) {
            assert.fail("Applicant should not be able to vote on their own application!");
        }, function() {
            return group.getMembersCount.call();
        }).then(function(count) {
            assert.equal(count.toNumber(), 1, "New membership was added when it should not have been!");
        });
    });

    it("should allow members to reject an application", function() {
        var group;

        var applicant = accounts[2];

        return KorasomGroup.deployed().then(function(instance) {
            group = instance;
            return group.voteOnApplication(applicant, false);
        }).then(function(success) {
            return group.getApplicationVotes.call(applicant);
        }, function(e) {
            assert.fail("Member was not allowed to vote on application!");
        }).then(function(a) {
            assert.equal(a[1].toNumber(), 1, "Application should have 1 nay vote");
            return group.getApplication.call(applicant);
        }).then(function(a) {
            assert.equal(a[5].toNumber(), 3, "Application state should be Rejected");
        });
    });
});