let KorasomTest = artifacts.require("./KorasomGroup.sol");
import 'babel-polyfill'

contract('KorasomTest', function (accounts) {

  let members = [accounts[1], accounts[2], accounts[3], accounts[4]];

  var mochaAsync = (fn) => {
    return async () => {
        try {
            await fn();
        } catch (err) {
          return err;
        }
    };
  };

  it('should leave app in state of submitted if quorum is not reached', mochaAsync(async () => {

    // create application
    let app = await KorasomTest.deployed();

    // // create members
    // for (let i = 0; i < members.length; i++) {
    //    await app.createMember(accounts[1]);
    // }

    // create applications
    for (let i = 0; i < members.length; i++) {
      await app.createApplication(accounts[1]);
    }

    let a = app.applicationsLookup[accounts[0]];

    // Setup (vote)   number of votes must equal +33% number of members
    await a.voteOnApplication(accounts[1], true)

    // check vote
    let vote = await a.checkApplication(accounts[0])

    assert.equal(vote.state, 'Submitted', 'Quorum has not been reached');
  }));

  it('should put app in state of accepted or rejected if quorum is reached', mochaAsync(async () => {
    
    // create application
    let app = await KorasomTest.deployed();

    // create members
    for (let i = 0; i < members.length; i++) {
      await app.createMember(accounts[1]);
   }

   let a = app.applicationsLookup[accounts[0]];

   // Setup (vote)   number of votes must equal +33% number of members
   await a.voteOnApplication(accounts[1], true)
   await a.voteOnApplication(accounts[2], true)
   await a.voteOnApplication(accounts[3], false)

   // check vote
   let vote = await a.checkApplication(accounts[0])

   assert.equal(vote.state, 'Accepted', 'Quorum has been reached. Welcome new member!');
  }));

  it('getApplicationsCount() should return number of Applicants', mochaAsync(async () => {
    let app = await KorasomTest.deployed();

    // find app
    let a = await app.applicationsLookup[accounts[0]];
    let count = await a.getApplicationsCount(accounts[0]);

    assert.equal(count, 1, "Num of applications");
  })); 

  it('getApplicationIds() should return array of Application IDs', mochaAsync(async () => {
    let app = await KorasomTest.deployed();

    // find app
    let a = await app.applicationsLookup[accounts[0]];
    let ids = await a.getApplicationIds(accounts[0]);
    console.log(ids);

    assert.equal(ids, [1], "These are the app IDs");
  }));
  
  it('getMembersCount() should return number of members', mochaAsync(async () => {
    // create application
    let app = await KorasomTest.deployed();

    // find app
    let a = await app.applicationsLookup[accounts[0]];
    let count = await a.getMembersCount(accounts[0]);

    assert.equal(count, 1, "You're the only member!");
  }));
  
  it('getMemberIds() should return array of members IDs', mochaAsync(async () => {
    
    // create application
    let app = await KorasomTest.deployed();

    // find app
    let a = await app.applicationsLookup[accounts[0]];
    let ids = await a.getMemberIds(accounts[0]);
    console.log(ids);

    assert.equal(ids, [1], "Here are the member id(s)");
    // keccak256(a.id, a.name, a.website, a.kind, a.comments, now)
  }));  
});