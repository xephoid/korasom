pragma solidity ^0.4.19;

import "./KorasomToken.sol";

/**
  *
  */
contract KorasomGroup {

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
    mapping (address => membership) public memberLookup;
    application[] public applications;
    membership[] public memberships;

    mapping (address => application) applicationsLookup;
    KorasomToken tokenMGMT;

    function KorasomGroup(bytes32 name, bytes32 website, MembershipKind kind, bytes32 comments) public {
        tokenMGMT = new KorasomToken();
        tokenMGMT.setGroup(this);

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

    modifier isMember {
        if (memberLookup[msg.sender].state != MembershipState.Active && administrator != msg.sender) {
            LogError("Non-member called member only function");
        }
        require(memberLookup[msg.sender].state == MembershipState.Active || administrator == msg.sender);
        _;
    }

    function checkMember(address wallet) view public returns (bool isTrue) {
        require(memberLookup[wallet].state == MembershipState.Active || administrator == wallet);
        return true;
    }

    function getMembership(address wallet) view public returns (bytes32 id, bytes32 name, bytes32 website, uint kind, uint state) {
        membership storage m = memberLookup[wallet];
        return (m.id, m.name, m.website, uint(m.kind), uint(m.state));
    }

    function getApplication(address wallet) view public
    returns (uint256 id, bytes32 name, bytes32 website, bytes32 comments, uint kind, uint state) {
        application storage a = applicationsLookup[wallet];
        return (a.id, a.name, a.website, a.comments, uint(a.kind), uint(a.state));
    }

    function getApplicationVotes(address wallet) view public returns (uint yays, uint nays) {
        application storage a = applicationsLookup[wallet];
        return (a.yays, a.nays);
    }

    function createApplication(bytes32 name, bytes32 website, MembershipKind kind,
        bytes32 comments) doesNotExist public returns (uint256 applicationId) {
        if (memberLookup[msg.sender].state == MembershipState.Active) {
            LogError("Active member attempted to apply");
        }
        require(memberLookup[msg.sender].state != MembershipState.Active);
        if (memberLookup[msg.sender].wallet == msg.sender) {
            LogError("Applicant is already a member");
        }
        require(memberLookup[msg.sender].wallet != msg.sender);

        application storage a = applicationsLookup[msg.sender];
        a.id = applications.length + 1;
        a.wallet = msg.sender;
        a.name = name;
        a.website = website;
        a.kind = kind;
        a.comments = comments;
        a.state = ApplicationState.Submitted;

        applications.push(a);

        ApplicationCreated(a.id, msg.sender, name, website, kind, comments);
        return a.id;
    }

    function voteOnApplication(address applicantWallet, bool votedYes) isMember public returns (bool success) {
        application storage a = applicationsLookup[applicantWallet];
        if (a.state != ApplicationState.Submitted) {
            LogError("Attempt to vote on application that is not Submitted");
        }
        if (a.votes[msg.sender] != Vote.NoVote) {
            LogError("Member attempted to vote even though they already voted");
        }
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

        return checkApplication(a.wallet);
    }

    function checkApplication(address wallet) isMember public returns (bool success) {
        application storage a = applicationsLookup[wallet];
        uint256 totalVotes = a.yays + a.nays;
        if (totalVotes > memberships.length / 3) {
            if (a.yays > a.nays) {
                a.state = ApplicationState.Accepted;
                bytes32 memberId = createMember(a.wallet);
                ApplicationAccepted(a.wallet, memberId, a.yays, a.nays);
            } else if (a.nays > a.yays) {
                a.state = ApplicationState.Rejected;
                ApplicationRejected(a.wallet, a.yays, a.nays);
            } else {
                LogError("Application is stuck in a tie!");
                return false;
            }
        }
        return true; // TODO: this return value is overloaded by the voteOnApplication function
    }

    function createMember(address wallet) isMember public returns (bytes32 memberId) {
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

        memberships.push(m);

        MemberCreated(a.id, m.wallet, m.id, m.name, m.website, m.kind);

//        if (msg.sender != m.wallet) {
//            tokenMGMT.approve(m.wallet, 1);
//        }
        return memberId;
    }

    function buy(address toMember) public payable {
        tokenMGMT.buy(toMember);
    }

    function getApplicationsCount() public returns (uint count) {
        return applications.length;
    }

    function getMembersCount() public returns (uint count) {
        return memberships.length;
    }
}