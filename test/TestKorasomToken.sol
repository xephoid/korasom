pragma solidity ^0.4.19;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/KorasomToken.sol";

contract TestKorasomToken {

    function testInitialBalanceUsingDeployedContract() public {
        KorasomToken token = KorasomToken(DeployedAddresses.KorasomToken());

        uint expected = 10000000;

        Assert.equal(token.balanceOf(tx.origin), expected, "Owner should have 10000000 Korasom Tokens initially");
    }
}
