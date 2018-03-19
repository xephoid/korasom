pragma solidity ^0.4.19;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/KorasomGroup.sol";

contract TestKorasomGroup {

    function testCreatorIsMember() public {
        KorasomGroup group = KorasomGroup(DeployedAddresses.KorasomGroup());
        Assert.isTrue(group.checkMember(tx.origin), "Contract creator is not a member!");
        var (id, name, website, kind, state) = group.getMembership(tx.origin);
        uint expected = 1; // 1 => MembershipState.Active
        address noAddress;
        Assert.notEqual(bytes32(id), bytes32(noAddress), "Contract creater membership id is invalid!");
        Assert.equal(state, expected, "Contract created membership is not the correct state!");

        var (aId, aName, aWebsite, aComments, aKind, aState) = group.getApplication(tx.origin);
        Assert.equal(state, 1, "Initial application is not activated!");
    }

}