pragma solidity ^0.4.19;

import "./KorasomToken.sol";

/**
  * The only token you get by giving.
  *
  * Key Functions
  * -------------
  * createApplication(string name, string website, int kind, string comments) returns applicationId
  * voteOnApplication(address applicantWallet, bool voteYes)
  * getApplicationById(int applicationId) returns tuple(id, name, website, comments, kind, state)
  * getApplicationVotes() returns tuple (yays, nays)
  * getMembershipById(string memberId) returns tuple(wallet, name, website, kind, state)
  * getMemberIds() returns int[]
  * getApplicationIds() returns int[]
  * invest(address toMember)
  *
  * Kind Key
  * --------
  * 0 => NotSet
  * 1 => NonProfit
  * 2 => Corporation
  * 3 => Hybrid
  * 4 => Coalition
  * 5 => Cooperative
  * 6 => Individual
  * 7 => DAO
  * 8 => Other
  *
  * Application State Key
  * ---------
  * 0 => DoesNotExist
  * 1 => Submitted
  * 2 => Accepted
  * 3 => Rejected
  *
  * Vote Key
  * --------
  * 0 => NoVote
  * 1 => Yay
  * 2 => Nay
  */
contract KorasomGroup is KorasomToken {

    enum ApplicationState { DoesNotExist, Submitted, Accepted, Rejected }

    enum MembershipKind {
        NotSet, NonProfit, Corporation, Hybrid, Coalition, Cooperative, Individual, Dao, Other
    }

    enum MembershipState { Inactive, Active, Disabled }

    enum Vote { NoVote, Yay, Nay }

    struct application {
        uint256 id;
        address wallet;
        bytes32 name;
        bytes32 website;
        MembershipKind kind;
        bytes32 comments;
        uint yays;
        uint nays;
        ApplicationState state;
        mapping (address => Vote) votes;
    }

    struct membership {
        bytes32 id;
        address wallet;
        bytes32 name;
        bytes32 website;
        MembershipKind kind;
        MembershipState state;
    }

    event ApplicationCreated(uint256 id, address applicantWallet, bytes32 name, bytes32 website, MembershipKind kind, bytes32 comments);
    event ApplicationAccepted(address applicantWallet, bytes32 memberId, uint256 yays, uint256 nays);
    event ApplicationRejected(address applicantWallet, uint256 yays, uint256 nays);
    event MemberVoted(address memberWallet, address applicantWallet, Vote vote);
    event MemberCreated(uint256 applicationId, address memberWallet, bytes32 memberId, bytes32 name, bytes32 website, MembershipKind kind);
    event LogError(string msg);

    address public administrator;
    mapping (address => membership) private memberLookup;
    mapping (address => application) private applicationsLookup;
    mapping (bytes32 => membership) private membersById;
    mapping (uint256 => application) private applicationsById;
    bytes32[] private memberIds;
    uint256[] private applicationIds;

    function KorasomGroup(bytes32 name, bytes32 website, MembershipKind kind, bytes32 comments) public {
        administrator = msg.sender;

        // Make the creator/administrator a member because we must start with one member!
        createApplication(name, website, kind, comments);
        application storage a = applicationsLookup[administrator];
        a.state = ApplicationState.Accepted;
        createMember(a.wallet);
    }

    modifier doesNotExist {
        require(applicationsLookup[msg.sender].state == ApplicationState.DoesNotExist);
        _;
    }

    modifier isMember(address wallet) {
        require(memberLookup[wallet].state == MembershipState.Active || administrator == wallet);
        _;
    }

    function createApplication(bytes32 name, bytes32 website, MembershipKind kind,
        bytes32 comments) doesNotExist public returns (uint256 applicationId) {
        require(memberLookup[msg.sender].state != MembershipState.Active);
        require(memberLookup[msg.sender].wallet != msg.sender);

        application storage a = applicationsLookup[msg.sender];
        a.id = applicationIds.length + 1;
        a.wallet = msg.sender;
        a.name = name;
        a.website = website;
        a.kind = kind;
        a.comments = comments;
        a.state = ApplicationState.Submitted;

        applicationsById[a.id] = a;
        applicationIds.push(a.id);

        ApplicationCreated(a.id, msg.sender, name, website, kind, comments);
        return a.id;
    }

    function voteOnApplication(address applicantWallet, bool votedYes) isMember(msg.sender) public {
        application storage a = applicationsLookup[applicantWallet];

        // Application must be Submitted and Member must not have already voted
        require(a.state == ApplicationState.Submitted && a.votes[msg.sender] == Vote.NoVote);

        if (votedYes) {
            a.yays = a.yays + 1;
            a.votes[msg.sender] = Vote.Yay;
            MemberVoted(msg.sender, a.wallet, Vote.Yay);
        } else {
            a.nays = a.nays + 1;
            a.votes[msg.sender] = Vote.Nay;
            MemberVoted(msg.sender, a.wallet, Vote.Nay);
        }

        checkApplication(a.wallet);
    }

    function checkApplication(address wallet) isMember(msg.sender) private {
        application storage a = applicationsLookup[wallet];
        uint256 totalVotes = a.yays + a.nays;
        if (totalVotes > memberIds.length / 3) {
            if (a.yays > a.nays) {
                a.state = ApplicationState.Accepted;
                bytes32 memberId = createMember(a.wallet);
                ApplicationAccepted(a.wallet, memberId, a.yays, a.nays);
            } else if (a.nays > a.yays) {
                a.state = ApplicationState.Rejected;
                ApplicationRejected(a.wallet, a.yays, a.nays);
            } else {
                LogError("Application is stuck in a tie!");
            }
            applicationsById[a.id] = a;
        }
    }

    function createMember(address wallet) isMember(msg.sender) private returns (bytes32 memberId) {
        application storage a = applicationsLookup[wallet];
        require(a.state == ApplicationState.Accepted);

        memberId = keccak256(a.id, a.name, a.website, a.kind, a.comments, now);
        membership storage m = memberLookup[a.wallet];

        m.id = memberId;
        m.name = a.name;
        m.wallet = a.wallet;
        m.website = a.website;
        m.kind = a.kind;
        m.state = MembershipState.Active;

        membersById[m.id] = m;
        memberIds.push(m.id);

        MemberCreated(a.id, m.wallet, m.id, m.name, m.website, m.kind);

        if (msg.sender != m.wallet) {
            approve(m.wallet, 1);
        }
        return memberId;
    }

    function invest(address _toMemberWallet) isMember(_toMemberWallet) public payable {

        totalEthInWei = totalEthInWei + msg.value;
        uint256 amount = msg.value * unitsOneEthCanBuy;

        require(balances[fundsWallet] >= amount);

        balances[fundsWallet] = balances[fundsWallet] - amount;

        uint256 forBuyer = SafeMath.div(amount, 10);
        uint256 forMember = amount - forBuyer;

        balances[msg.sender] = balances[msg.sender] + forBuyer;
        balances[_toMemberWallet] = balances[_toMemberWallet] + forMember;

        Transfer(fundsWallet, _toMemberWallet, forMember);
        Transfer(fundsWallet, msg.sender, forBuyer);

        //Transfer ether to fundsWallet
        fundsWallet.transfer(msg.value);
    }

    function () isMember(msg.sender) public payable {
        totalEthInWei = totalEthInWei + msg.value;
        uint256 amount = msg.value * unitsOneEthCanBuy;

        require(balances[fundsWallet] >= amount);

        balances[fundsWallet] = balances[fundsWallet] - amount;

        balances[msg.sender] = balances[msg.sender] + amount;

        Transfer(fundsWallet, msg.sender, amount);

        //Transfer ether to fundsWallet
        fundsWallet.transfer(msg.value);
    }

    function getMemberVoteOnApplication(uint256 applicationId) isMember(msg.sender) view public returns (Vote vote) {
        application storage a = applicationsById[applicationId];
        return a.votes[msg.sender];
    }

    function getMembership(address wallet) view public returns (bytes32 id, bytes32 name, bytes32 website, uint kind, uint state) {
        membership storage m = memberLookup[wallet];
        return (m.id, m.name, m.website, uint(m.kind), uint(m.state));
    }

    function getMembershipById(bytes32 memberId) view public returns (address wallet, bytes32 name, bytes32 website, uint kind, uint state) {
        membership storage m = membersById[memberId];
        return (m.wallet, m.name, m.website, uint(m.kind), uint(m.state));
    }

    function getApplicationById(uint256 applicationId) view public
    returns (address wallet, bytes32 name, bytes32 website, bytes32 comments, uint kind, uint state) {
        application storage a = applicationsById[applicationId];
        return (a.wallet, a.name, a.website, a.comments, uint(a.kind), uint(a.state));
    }

    function getApplication(address wallet) view public
    returns (uint256 id, bytes32 name, bytes32 website, bytes32 comments, uint kind, uint state) {
        application storage a = applicationsLookup[wallet];
        return (a.id, a.name, a.website, a.comments, uint(a.kind), uint(a.state));
    }

    function getApplicationVotes(uint256 applicationId) view public returns (uint yays, uint nays) {
        application storage a = applicationsById[applicationId];
        return (a.yays, a.nays);
    }

    function getApplicationsCount() view public returns (uint count) {
        return applicationIds.length;
    }

    function getApplicationIds() view public returns(uint256[] appIds) {
        return applicationIds;
    }

    function getMembersCount() view public returns (uint count) {
        return memberIds.length;
    }

    function getMemberIds() view public returns(bytes32[] mIds) {
        return memberIds;
    }
}