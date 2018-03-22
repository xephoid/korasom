pragma solidity ^0.4.19;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/KorasomGroup.sol";

contract TestKorasomGroup {

    function testCreatorIsMember() public {
        KorasomGroup group = KorasomGroup(DeployedAddresses.KorasomGroup());
        var (id, name, website, kind, state) = group.getMembership(tx.origin);
        uint expected = 1; // 1 => MembershipState.Active
        address noAddress;
        Assert.notEqual(bytes32(id), bytes32(noAddress), "Contract creator membership id is invalid!");
        Assert.equal(state, expected, "Contract created membership is not the correct state!");
        Assert.notEqual(name, "", "Initial member has no name!");
        Assert.notEqual(website, "", "Initial member has no website!");
        Assert.notEqual(kind, 0, "Initial member kind is not set!");

        var (aId, aName, aWebsite, aComments, aKind, aState) = group.getApplication(tx.origin);
        Assert.notEqual(aId, 0, "Initial application has invalid ID!");
        Assert.equal(aState, 2, "Initial application is not Accepted!");
        Assert.notEqual(aName, "", "Initial application has no name!");
        Assert.notEqual(aWebsite, "", "Initial application has no website!");
        Assert.notEqual(aComments, "", "Initial application has no comments!");
        Assert.notEqual(aKind, 0, "Initial application has no kind!");
    }

}