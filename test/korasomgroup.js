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

    it("should not create another application for an existing member", async function() {
        var group = await KorasomGroup.deployed();

        try {
            await group.createApplication(founder.name, founder.website, founder.kind,
                founder.comments, { from: founder.wallet });
        } catch(e) {
            return true; // succes!
        }
        assert.fail("Should never get here!");
    });

    it("should create an application correctly", async function() {
        var group = await KorasomGroup.deployed();

        await group.createApplication(toAccept.name, toAccept.website,
            toAccept.kind, toAccept.comments, { from: toAccept.wallet });

        var a = await group.getApplication.call(toAccept.wallet);

        assert.notEqual(a[0].toNumber(), 0, "Application was not created with a valid ID!");
        assert.equal(web3.toAscii(a[1]).replace(/\u0000/g, ''), toAccept.name, "Application name was not set correctly");
        assert.equal(web3.toAscii(a[2]).replace(/\u0000/g, ''), toAccept.website, "Application website was not set correctly");
        assert.equal(web3.toAscii(a[3]).replace(/\u0000/g, ''), toAccept.comments, "Application comments was not set correctly");
        assert.equal(a[4].toNumber(), toAccept.kind, "Application was not created with the correct kind!");
        assert.equal(a[5].toNumber(), 1, "Application was not created with the correct state!");
    });

    it("should not let anyone vote on an application that is approved", async function() {
        var group = await KorasomGroup.deployed();

        try {
            await group.voteOnApplication.call(founder.wallet, true);
        } catch(e) {
            return true; // success!
        }
        assert.fail("Vote should have failed because application is already approved");
    });

    it("should not allow non-members to vote on an application", async function() {
        var group = await KorasomGroup.deployed();

        await group.createApplication(toReject.name, toReject.website,
            toReject.kind, toReject.comments, { from: toReject.wallet });

        try {
            await group.voteOnApplication(toReject.wallet, true, { from: toReject.wallet });
        } catch(e) {
            return true; // success!
        }
        assert.fail("Applicant should not be able to vote on their own application!");
    });

    it("should allow members to reject an application", async function() {
        var group = await KorasomGroup.deployed();

        await group.voteOnApplication(toReject.wallet, false);

        var votes = await group.getApplicationVotes.call(toReject.wallet);
        assert.equal(votes[1].toNumber(), 1, "Application should have 1 nay vote");

        var a = await group.getApplication.call(toReject.wallet);
        assert.equal(a[5].toNumber(), 3, "Application state should be Rejected");

    });

    it("should allow members to accept an application", async function() {
        var group = await KorasomGroup.deployed();

        await group.voteOnApplication(toAccept.wallet, true);
        var votes = await group.getApplicationVotes.call(toAccept.wallet);
        assert.equal(votes[0], 1, "Application should have 1 yay vote");
        var m = await group.getMembership.call(toAccept.wallet);

        assert.equal(web3.toAscii(m[1]).replace(/\u0000/g, ''), toAccept.name, "New membership has the wrong name");
        assert.equal(web3.toAscii(m[2]).replace(/\u0000/g, ''), toAccept.website, "New membership has the wrong website");
        assert.equal(m[3].toNumber(), toAccept.kind, "New membership is the wrong kind");
        assert.equal(m[4].toNumber(), 1, "New membership is not active!");
    });

    it("should accept an investment from a non-member donor", async function() {
        var group = await KorasomGroup.deployed();

        await group.invest(toAccept.wallet, { from: donor.wallet, value: 50 });

        var donorBalance = await group.balanceOf.call(donor.wallet);
        assert.equal(donorBalance.toNumber(), 500, "Donor did not receive the correct amount");

        var memberBalance = await group.balanceOf.call(toAccept.wallet);
        assert.equal(memberBalance.toNumber(), 4500, "Member did not receive the correct amount");
    });

    it("should not allow non-members to buy tokens directly", async function() {
        var group = await KorasomGroup.deployed();

        try {
            await group.sendTransaction({from: donor.wallet, value: 50});
        } catch(e) {
            return true; //success
        }
        assert.fail();
    });

    it("should allow members to buy tokens directly", async function() {
        var group = await KorasomGroup.deployed();

        await group.sendTransaction({ from: toAccept.wallet, value: 1 });

        var balance = await group.balanceOf.call(toAccept.wallet);
        assert.equal(balance.toNumber(), 4600, "Member balance was not increased after direct purchase");
    });
});