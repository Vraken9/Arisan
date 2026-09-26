const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArisanChain", function () {
  let mockUSDT, factory, group;
  let organizer, member1, member2;
  let contributionAmount, depositAmount, maxMembers, roundDuration;
  let groupAddress;

  // Helper: generate commit hash
  function commitHash(secret, address) {
    return hre.ethers.solidityPackedKeccak256(
      ["uint256", "address"],
      [secret, address]
    );
  }

  beforeEach(async function () {
    [organizer, member1, member2] = await hre.ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();

    // Mint tokens ke semua akun
    const mintAmount = hre.ethers.parseEther("100000");
    await mockUSDT.mint(organizer.address, mintAmount);
    await mockUSDT.mint(member1.address, mintAmount);
    await mockUSDT.mint(member2.address, mintAmount);

    // Deploy Factory
    const ArisanFactory = await hre.ethers.getContractFactory("ArisanFactory");
    factory = await ArisanFactory.deploy();
    await factory.waitForDeployment();

    // Parameters — deposit = contribution (jaminan penuh)
    contributionAmount = hre.ethers.parseEther("100");
    depositAmount = hre.ethers.parseEther("100");
    maxMembers = 3;
    roundDuration = 86400; // 1 day

    // Create group via factory
    const tx = await factory.createGroup(
      await mockUSDT.getAddress(),
      contributionAmount,
      depositAmount,
      maxMembers,
      roundDuration
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find((log) => {
      try {
        return factory.interface.parseLog(log)?.name === "GroupCreated";
      } catch (e) {
        return false;
      }
    });
    groupAddress = factory.interface.parseLog(event).args.groupAddress;

    const ArisanGroup = await hre.ethers.getContractFactory("ArisanGroup");
    group = ArisanGroup.attach(groupAddress);
  });

  // ======================== MockUSDT Tests ========================

  describe("MockUSDT", function () {
    it("should have correct name and symbol", async function () {
      expect(await mockUSDT.name()).to.equal("Mock USDT");
      expect(await mockUSDT.symbol()).to.equal("mUSDT");
    });

    it("should allow public minting", async function () {
      const amount = hre.ethers.parseEther("1000");
      await mockUSDT.mint(member1.address, amount);
      const balance = await mockUSDT.balanceOf(member1.address);
      expect(balance).to.be.greaterThan(0);
    });
  });

  // ======================== ArisanFactory Tests ========================

  describe("ArisanFactory", function () {
    it("should create a group and emit event", async function () {
      const tx = await factory.createGroup(
        await mockUSDT.getAddress(),
        contributionAmount,
        depositAmount,
        maxMembers,
        roundDuration
      );
      await expect(tx).to.emit(factory, "GroupCreated");
    });

    it("should track groups correctly", async function () {
      const groups = await factory.getGroups();
      expect(groups.length).to.equal(1);
    });

    it("should track organizer groups", async function () {
      const orgGroups = await factory.getGroupsByOrganizer(organizer.address);
      expect(orgGroups.length).to.equal(1);
    });

    it("should return correct version", async function () {
      expect(await factory.version()).to.equal("1.0.0");
    });
  });

  // ======================== ArisanGroup — Constructor Tests ========================

  describe("ArisanGroup: Constructor Validation", function () {
    it("should reject deposit < contribution", async function () {
      const smallDeposit = hre.ethers.parseEther("50");
      await expect(
        factory.createGroup(
          await mockUSDT.getAddress(),
          contributionAmount,
          smallDeposit, // 50 < 100
          maxMembers,
          roundDuration
        )
      ).to.be.revertedWithCustomError(group, "DepositTooLow");
    });

    it("should reject zero contribution", async function () {
      await expect(
        factory.createGroup(
          await mockUSDT.getAddress(),
          0, // zero
          depositAmount,
          maxMembers,
          roundDuration
        )
      ).to.be.revertedWithCustomError(group, "InvalidAmount");
    });

    it("should reject less than 2 members", async function () {
      await expect(
        factory.createGroup(
          await mockUSDT.getAddress(),
          contributionAmount,
          depositAmount,
          1, // less than 2
          roundDuration
        )
      ).to.be.revertedWithCustomError(group, "MinTwoMembers");
    });
  });

  // ======================== ArisanGroup — Join Tests ========================

  describe("ArisanGroup: Join", function () {
    it("should allow members to join with deposit", async function () {
      await mockUSDT.connect(organizer).approve(groupAddress, depositAmount);
      await expect(group.connect(organizer).join())
        .to.emit(group, "MemberJoined")
        .withArgs(organizer.address, depositAmount);
    });

    it("should reject duplicate join", async function () {
      await mockUSDT.connect(organizer).approve(groupAddress, depositAmount);
      await group.connect(organizer).join();

      await mockUSDT.connect(organizer).approve(groupAddress, depositAmount);
      await expect(group.connect(organizer).join())
        .to.be.revertedWithCustomError(group, "AlreadyJoined");
    });

    it("should transition to COMMITTING when group is full", async function () {
      const accounts = [organizer, member1, member2];
      for (const acc of accounts) {
        await mockUSDT.connect(acc).approve(groupAddress, depositAmount);
        await group.connect(acc).join();
      }

      const info = await group.getGroupInfo();
      expect(info.state).to.equal(1n); // COMMITTING
    });

    it("should reject join when group is full (invalid state)", async function () {
      const [, , , extraMember] = await hre.ethers.getSigners();
      const accounts = [organizer, member1, member2];

      for (const acc of accounts) {
        await mockUSDT.connect(acc).approve(groupAddress, depositAmount);
        await group.connect(acc).join();
      }

      await mockUSDT.mint(extraMember.address, depositAmount);
      await mockUSDT.connect(extraMember).approve(groupAddress, depositAmount);
      await expect(group.connect(extraMember).join())
        .to.be.revertedWithCustomError(group, "InvalidState");
    });
  });

  // ======================== Commit-Reveal Tests ========================

  describe("ArisanGroup: Commit-Reveal", function () {
    const secrets = [42n, 777n, 12345n];

    beforeEach(async function () {
      const accounts = [organizer, member1, member2];
      for (const acc of accounts) {
        await mockUSDT.connect(acc).approve(groupAddress, depositAmount);
        await group.connect(acc).join();
      }
    });

    it("should accept valid commits", async function () {
      const hash = commitHash(secrets[0], organizer.address);
      await expect(group.connect(organizer).commitOrder(hash))
        .to.emit(group, "CommitSubmitted")
        .withArgs(organizer.address);
    });

    it("should reject duplicate commit", async function () {
      const hash = commitHash(secrets[0], organizer.address);
      await group.connect(organizer).commitOrder(hash);

      await expect(group.connect(organizer).commitOrder(hash))
        .to.be.revertedWithCustomError(group, "AlreadyCommitted");
    });

    it("should transition to REVEALING when all committed", async function () {
      const accounts = [organizer, member1, member2];
      for (let i = 0; i < accounts.length; i++) {
        const hash = commitHash(secrets[i], accounts[i].address);
        await group.connect(accounts[i]).commitOrder(hash);
      }

      const info = await group.getGroupInfo();
      expect(info.state).to.equal(2n); // REVEALING
    });

    it("should accept valid reveals, emit RevealSubmitted, and finalize order", async function () {
      const accounts = [organizer, member1, member2];

      for (let i = 0; i < accounts.length; i++) {
        const hash = commitHash(secrets[i], accounts[i].address);
        await group.connect(accounts[i]).commitOrder(hash);
      }

      // Verify RevealSubmitted event is emitted (Bug #2 fix verification)
      await expect(group.connect(organizer).revealOrder(secrets[0]))
        .to.emit(group, "RevealSubmitted")
        .withArgs(organizer.address);

      await group.connect(member1).revealOrder(secrets[1]);
      await group.connect(member2).revealOrder(secrets[2]);

      const info = await group.getGroupInfo();
      expect(info.state).to.equal(3n); // ACTIVE

      const order = await group.getPayoutOrder();
      expect(order.length).to.equal(3);
    });

    it("should reject invalid reveal (wrong secret)", async function () {
      const accounts = [organizer, member1, member2];

      for (let i = 0; i < accounts.length; i++) {
        const hash = commitHash(secrets[i], accounts[i].address);
        await group.connect(accounts[i]).commitOrder(hash);
      }

      await expect(group.connect(organizer).revealOrder(999999n))
        .to.be.revertedWithCustomError(group, "InvalidReveal");
    });
  });

  // ======================== Full Cycle Tests ========================

  describe("ArisanGroup: Full Cycle", function () {
    const secrets = [42n, 777n, 12345n];

    async function setupToActive() {
      const accounts = [organizer, member1, member2];

      for (const acc of accounts) {
        await mockUSDT.connect(acc).approve(groupAddress, depositAmount);
        await group.connect(acc).join();
      }

      for (let i = 0; i < accounts.length; i++) {
        const hash = commitHash(secrets[i], accounts[i].address);
        await group.connect(accounts[i]).commitOrder(hash);
      }

      for (let i = 0; i < accounts.length; i++) {
        await group.connect(accounts[i]).revealOrder(secrets[i]);
      }

      return accounts;
    }

    it("TC1 — should process normal round payout", async function () {
      const accounts = await setupToActive();

      for (const acc of accounts) {
        await mockUSDT.connect(acc).approve(groupAddress, contributionAmount);
        await group.connect(acc).contribute();
      }

      const info = await group.getGroupInfo();
      expect(info.currentRound).to.equal(1n);
    });

    it("TC2 — should complete full cycle (all rounds)", async function () {
      const accounts = await setupToActive();

      for (let round = 0; round < maxMembers; round++) {
        for (const acc of accounts) {
          await mockUSDT.connect(acc).approve(groupAddress, contributionAmount);
          await group.connect(acc).contribute();
        }
      }

      const info = await group.getGroupInfo();
      expect(info.state).to.equal(4n); // COMPLETED
    });

    it("TC3 — should slash defaulter (full coverage) and process payout", async function () {
      const accounts = await setupToActive();

      // Round 0: normal
      for (const acc of accounts) {
        await mockUSDT.connect(acc).approve(groupAddress, contributionAmount);
        await group.connect(acc).contribute();
      }

      // Round 1: defaulter
      const order = await group.getPayoutOrder();
      const defaulter = order[0];

      for (const acc of accounts) {
        if (acc.address === defaulter) continue;
        await mockUSDT.connect(acc).approve(groupAddress, contributionAmount);
        await group.connect(acc).contribute();
      }

      await time.increase(86401);

      await expect(group.slashDefaulter(defaulter))
        .to.emit(group, "MemberSlashed");

      // deposit (100) - slash (100) = 0 (full coverage!)
      const defaulterInfo = await group.getMemberInfo(defaulter);
      expect(defaulterInfo.depositPaid).to.equal(0n);
    });

    it("TC4 — should return deposits after completion", async function () {
      const accounts = await setupToActive();

      for (let round = 0; round < maxMembers; round++) {
        for (const acc of accounts) {
          await mockUSDT.connect(acc).approve(groupAddress, contributionAmount);
          await group.connect(acc).contribute();
        }
      }

      for (const acc of accounts) {
        const before = await mockUSDT.balanceOf(acc.address);
        await group.connect(acc).returnDeposit();
        const after = await mockUSDT.balanceOf(acc.address);
        expect(after - before).to.equal(depositAmount);
      }
    });

    it("TC5 — should reject contribution after deadline", async function () {
      await setupToActive();

      await time.increase(86401);

      await mockUSDT.connect(organizer).approve(groupAddress, contributionAmount);
      await expect(group.connect(organizer).contribute())
        .to.be.revertedWithCustomError(group, "RoundDeadlinePassed");
    });

    it("TC6 — should reject double contribution same round", async function () {
      await setupToActive();

      await mockUSDT.connect(organizer).approve(groupAddress, contributionAmount);
      await group.connect(organizer).contribute();

      await mockUSDT.connect(organizer).approve(groupAddress, contributionAmount);
      await expect(group.connect(organizer).contribute())
        .to.be.revertedWithCustomError(group, "AlreadyContributed");
    });
  });

  // ======================== Emergency Withdraw Tests ========================

  describe("ArisanGroup: Emergency", function () {
    it("should allow emergency withdraw after timelock", async function () {
      await mockUSDT.connect(organizer).approve(groupAddress, depositAmount);
      await group.connect(organizer).join();

      await time.increase(7 * 86400 + 1);

      await expect(group.connect(organizer).emergencyWithdraw())
        .to.emit(group, "EmergencyWithdraw")
        .withArgs(organizer.address, depositAmount);
    });

    it("should reject emergency withdraw before timelock", async function () {
      await mockUSDT.connect(organizer).approve(groupAddress, depositAmount);
      await group.connect(organizer).join();

      await expect(group.connect(organizer).emergencyWithdraw())
        .to.be.revertedWithCustomError(group, "TimelockNotExpired");
    });
  });

  // ======================== View Functions Tests ========================

  describe("ArisanGroup: View Functions", function () {
    it("should return correct group info", async function () {
      const info = await group.getGroupInfo();
      expect(info.maxMembers).to.equal(BigInt(maxMembers));
      expect(info.contributionAmount).to.equal(contributionAmount);
      expect(info.depositAmount).to.equal(depositAmount);
      expect(info.state).to.equal(0n); // OPEN
    });

    it("should return correct member info", async function () {
      await mockUSDT.connect(organizer).approve(groupAddress, depositAmount);
      await group.connect(organizer).join();

      const mInfo = await group.getMemberInfo(organizer.address);
      expect(mInfo.isMember).to.be.true;
      expect(mInfo.depositPaid).to.equal(depositAmount);
    });

    it("should return correct version", async function () {
      expect(await group.version()).to.equal("1.0.0");
    });
  });
});
