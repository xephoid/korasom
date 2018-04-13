let KorasomTest = artifacts.require("./KorasomGroup.sol");
import 'babel-polyfill'

var mochaAsync = (fn) => {
  return async () => {
      try {
          await fn()
      } catch (err) {
        return err
      }
  }
}
contract('KorasomTest', function (accounts) {

  let totalAccts = 5
  let otherAccts = totalAccts - 1
  
  let founder = {
    wallet: accounts[0],
    name: "Founder Name",
    website: "founder-website",
    kind: 3,
    comments: "I am the founder!"
  };

  let members = []
  for (let i = 1; i <= otherAccts; i++) {
    let member = `{
      wallet: accounts[${i}],
      name: "some-acceptable-org",
      website: "some-acceptable-website",
      kind: 1,
      comments: "I'm just here so I don't get fined!"
    }`
    members.push(member)
  }

  // NOTE: This action creates 1 user by default;
  let createTestApp = async () => {
    let app = await KorasomTest.deployed(founder.name, founder.website, founder.kind,
      founder.comments, { from: founder.wallet })
      return app
  }

  let createTestApplications = async (number) => {
    for (let n = 1; n < number; n++) {
      await app.createApplication(members[n].name, 
                                  members[n].website, 
                                  members[n].kind,
                                  members[n].comments, 
                                  { from: members[n].wallet });
                      
      let a = app.applicationsLookup[accounts[n]]
      for (let x = 0; x < n; x++) {
        await a.voteOnApplication(accounts[x], true)
      }
    }
  }

  it('should leave app in state of submitted if quorum is not reached', mochaAsync(async () => {

    // setup app & admin
    createTestApp()
    createTestMembers((otherAccts - 1))

    // create application for testing
    await app.createApplication(members[otherAccts].name, 
      members[otherAccts].website, 
      members[otherAccts].kind,
      members[otherAccts].comments, 
      { from: members[otherAccts].wallet })

    let a = await app.applicationsLookup[accounts[otherAccts]]

    for (let x = 0; x < Math.floor(otherAccts/3); x++) {
      await a.voteOnApplication(accounts[x], true)
    }
    // check vote
    let vote = await a.checkApplication(accounts[otherAccts])

    assert.equal(vote.state, 'Submitted', 'Quorum has not been reached')
  }));

  it('should put app in state of accepted or rejected if quorum is reached', mochaAsync(async () => {
    
    // setup app & admin
    createTestApp()
    createTestMembers((otherAccts - 1))

    // create application for testing
    await app.createApplication(members[otherAccts].name, 
      members[otherAccts].website, 
      members[otherAccts].kind,
      members[otherAccts].comments, 
      { from: members[otherAccts].wallet })

    // find application
    let a = await app.applicationsLookup[accounts[otherAccts]]

    for (let x = 0; x < Math.ceil(otherAccts/3); x++) {
      await a.voteOnApplication(accounts[x], true)
    }

    // check vote
    let vote = await a.checkApplication(accounts[otherAccts])

   assert.equal(vote.state, 'Accepted', 'Quorum has been reached. Welcome new member!')
  }))

  it('getApplicationsCount() should return number of Applicants', mochaAsync(async () => {

    // setup app & admin
    createTestApp()
    createTestMembers(otherAccts)

    let count = await app.getApplicationsCount()

    assert.equal(count, totalAccts, `There are ${totalAccts} applications`)
  }))

  it('getApplicationIds() should return array of Application IDs', mochaAsync(async () => {
    
// setup app & admin
    createTestApp()
    createTestMembers(otherAccts)

    let ids = await app.getApplicationIds()
    
    let testArray = []
    for (let d = 0; d <= otherAccts; d++) {
      testArray.push(d + 1)
    }
    
    assert.equal(ids, testArray)
  }))
  
  it('getMembersCount() should return number of members', mochaAsync(async () => {

    // setup app & admin
    createTestApp()
    createTestMembers(otherAccts)

    let count = await app.getMembersCount()

    assert.equal(count, totalAccts, `${$totalAccts} members`)
  }));
  
  it('getMemberIds() should return array of members IDs', mochaAsync(async () => {

    // setup app & admin
    createTestApp()
    createTestMembers(otherAccts)

    let ids = await app.getMemberIds()

    assert.equal(ids.length, totalAccts, `There array with ${totalAccts} hashed ids`)
  }))
})