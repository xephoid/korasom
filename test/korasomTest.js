let KorasomTest = artifacts.require("./KorasomGroup.sol");
import 'babel-polyfill'

contract('KorasomTest', function (accounts) {

  let founder = {
    wallet: accounts[0],
    name: "Founder Name",
    website: "founder-website",
    kind: 3,
    comments: "I am the founder!"
  };

  let members = []

  for (let i = 1; i < 5; i++) {
    let member = `{
      wallet: accounts[${i}],
      name: "some-acceptable-org",
      website: "some-acceptable-website",
      kind: 1,
      comments: "I'm just here so I don't get fined!"
    }`
    members.push(member)
  }
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

    // setup members
    let app = await KorasomTest.deployed(founder.name, founder.website, founder.kind,
      founder.comments, { from: founder.wallet });

    for (let n = 1; n < 4; n++) {
      await app.createApplication(members[n].name, 
                                  members[n].website, 
                                  members[n].kind,
                                  members[n].comments, 
                                  { from: members[n].wallet });
                      
      let a = app.applicationsLookup[accounts[n]];
      for (let x = 0; x < n; x++) {
        await a.voteOnApplication(accounts[x], true)
      }
    }

    // create testing application
    await app.createApplication(members[4].name, 
      members[4].website, 
      members[4].kind,
      members[4].comments, 
      { from: members[4].wallet });

    let a = await app.applicationsLookup[accounts[4]];

    await a.voteOnApplication(accounts[0], true)

    // check vote
    let vote = await a.checkApplication(accounts[4])

    assert.equal(vote.state, 'Submitted', 'Quorum has not been reached');
  }));

  it('should put app in state of accepted or rejected if quorum is reached', mochaAsync(async () => {
    
    // setup members
    let app = await KorasomTest.deployed(founder.name, founder.website, founder.kind,
      founder.comments, { from: founder.wallet });

    for (let n = 1; n < 4; n++) {
      await app.createApplication(members[n].name, 
                                  members[n].website, 
                                  members[n].kind,
                                  members[n].comments, 
                                  { from: members[n].wallet });
                      
      let a = app.applicationsLookup[accounts[n]];
      for (let x = 0; x < n; x++) {
        await a.voteOnApplication(accounts[x], true)
      }
    }

    // create testing application
    await app.createApplication(members[4].name, 
      members[4].website, 
      members[4].kind,
      members[4].comments, 
      { from: members[4].wallet });

    let a = await app.applicationsLookup[accounts[4]];

    await a.voteOnApplication(accounts[0], true)
    await a.voteOnApplication(accounts[1], true)
    await a.voteOnApplication(accounts[2], true)

    // check vote
    let vote = await a.checkApplication(accounts[4])

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

    assert.equal(ids, !null, "There's Ids here");
    // keccak256(a.id, a.name, a.website, a.kind, a.comments, now)
  }));  
});