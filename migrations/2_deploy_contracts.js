var SafeMath = artifacts.require("./SafeMath.sol");
var KorasomGroup = artifacts.require("./KorasomGroup.sol");
var KorasomToken = artifacts.require("./KorasomToken.sol");

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, KorasomToken);
  deployer.deploy(KorasomToken, {gas: 6700000});
  deployer.link(KorasomToken, KorasomGroup);
  deployer.deploy(KorasomGroup, "CodeWalker Institute", "http://codewalker.institute", 1, "Tech to the People!", {gas: 6700000});
};