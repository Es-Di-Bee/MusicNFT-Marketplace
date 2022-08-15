const { expect } = require("chai");
const { ethers } = require("hardhat");

const ethToWei = (num) => ethers.utils.parseEther(num.toString()); // string => bigNumber
const weiToEth = (num) => ethers.utils.formatEther(num);          // bigNumber => string

describe("Music-NFT Marketplace Testing", function () {
  let nftMarketplace;
  let deployer, artist, user1, user2, users;  
  let royaltyFee = ethToWei(0.01);
  let URI = "https://bafybeidhjjbjonyqcahuzlpt7sznmh4xrlbspa3gstop5o47l6gsiaffee.ipfs.nftstorage.link/";
  let prices = [ethToWei(1), ethToWei(2), ethToWei(3), ethToWei(4), ethToWei(5), ethToWei(6), ethToWei(7), ethToWei(8)];
  let deploymentFees = ethToWei(prices.length * 0.01);

  beforeEach(async function () {
    const NFTMarketplaceFactory = await ethers.getContractFactory("MusicNFTMarketplace");
    [deployer, artist, user1, user2, ...users] = await ethers.getSigners();

    nftMarketplace = await NFTMarketplaceFactory.deploy(
      royaltyFee,
      artist.address,
      prices,
      {value: deploymentFees}
    );
  });

  describe("Deployment", function () {

    it("Updated Name, Symbol, URI, Royalty Fee and Artist", async function () {
      const nftName = "MusicNFTs"
      const nftSymbol = "MNS"
      expect(await nftMarketplace.name()).to.equal(nftName);
      expect(await nftMarketplace.symbol()).to.equal(nftSymbol);
      expect(await nftMarketplace.baseURI()).to.equal(URI);
      expect(await nftMarketplace.royaltyFee()).to.equal(royaltyFee);
      expect(await nftMarketplace.artist()).to.equal(artist.address);
    });

    it("Minted all the music NFTs", async function () {
      expect(await nftMarketplace.balanceOf(nftMarketplace.address)).to.equal(prices.length);
    });

    it ("Listed all the Music NFTs", async function() {
      await Promise.all(prices.map(async function (i, indx) {
        const item = await nftMarketplace.marketItems(indx);

        expect(item.tokenId).to.equal(indx);
        expect(item.seller).to.equal(deployer.address);
        expect(item.price).to.equal(i);
      }));

    });

    it("Ether Balance equals to Deployment Fees", async function () {
      expect(await ethers.provider.getBalance(nftMarketplace.address)).to.equal(deploymentFees);
    });

  });

  describe("Updated Royalty Fee", function () {
    const fee = ethToWei(0.02); 

    it("Third person CAN NOT update the Royalty Fee", async function () {
      await expect(nftMarketplace.connect(user1).updateRoyaltyFee(fee)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it ("Developer CAN update the Royalty Fee", async function() {
      await nftMarketplace.updateRoyaltyFee(fee); 
      expect(await nftMarketplace.royaltyFee()).to.equal(fee);
    });

  });

  describe("Purchase of Tokens", function () {

    // NOTES:
    // solidity can easily handle large numbers with uint256, but js can not handle it with safe math
    // that's why we need BigNumber in js. For doing calculation of BigNumber, 
    // we need to invoke the functions of BigNumber like BigNumber.add(value), etc.
    // But for avoiding that, and for doing the calculation using normal safe math of js,
    // we are converting every BigNumber wei to ether (which safe math can handle)

    it("Seller & Artist Received the Payment", async function() {
      const sellerInitialBalance = +weiToEth(await deployer.getBalance());  // "+" is a unary operator which converts the value to a number
      const artistInitialBalance = +weiToEth(await artist.getBalance());

      await nftMarketplace.connect(user1).buyToken(0, {value: prices[0]});

      const sellerUpdatedBalance = +weiToEth(await deployer.getBalance());
      const artistUpdatedBalance = +weiToEth(await artist.getBalance());

      expect(sellerUpdatedBalance).to.equal(sellerInitialBalance + +weiToEth(prices[0])); 
      expect(artistUpdatedBalance).to.equal(artistInitialBalance + +weiToEth(royaltyFee));
    });

    it("Buyer is the New Owner", async function() {
      await nftMarketplace.connect(user1).buyToken(0, {value: prices[0]});

      expect(await nftMarketplace.ownerOf(0)).to.equal(user1.address);
    });

    it("Seller Address Updated to Zero", async function() {
      await nftMarketplace.connect(user1).buyToken(0, {value: prices[0]});

      expect((await nftMarketplace.marketItems(0)).seller).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Emitted an event of Buying a Token", async function() {
      await expect(nftMarketplace.connect(user1).buyToken(0, { value: prices[0] }))
        .to.emit(nftMarketplace, "MarketItemBought")
        .withArgs(0, deployer.address, user1.address, prices[0]
      )
    });

    it("Transaction Rejected when Ether amount sent does not equal Asking Price", async function () {
      await expect(
        nftMarketplace.connect(user1).buyToken(1, { value: prices[2] })
      ).to.be.revertedWith("Please send the asking price in order to complete the purchase");
    });
    
  })

  describe("Resell of Tokens", function () {
    beforeEach(async function () {
      await nftMarketplace.connect(user1).buyToken(0, { value: prices[0] })
    })

    const resalePrice = ethToWei(2);

    it("Smart Contract Wallet Balance is updated", async function() {
      const smartWalletInitialBalance = +weiToEth(await ethers.provider.getBalance(nftMarketplace.address));
      await nftMarketplace.connect(user1).resellToken(0, resalePrice, {value: royaltyFee});
      const smartWalletUpdatedBalance = +weiToEth(await ethers.provider.getBalance(nftMarketplace.address));

      expect(smartWalletUpdatedBalance).to.equal(smartWalletInitialBalance + +weiToEth(royaltyFee));
    });

    it("Smart Contract is the New Owner", async function() {
      await nftMarketplace.connect(user1).resellToken(0, resalePrice, {value: royaltyFee});

      expect(await nftMarketplace.ownerOf(0)).to.equal(nftMarketplace.address);
    });

    it("Data Integrity of the Token in the Marketplace", async function() {
      await nftMarketplace.connect(user1).resellToken(0, resalePrice, {value: royaltyFee});
      const item = await nftMarketplace.marketItems(0); 

      expect(item.tokenId).to.equal(0);                 
      expect(item.seller).to.equal(user1.address);      
      expect(item.price).to.equal(resalePrice);         
    });

    it("Emitted an event of Selling a Token", async function() {
      await expect(nftMarketplace.connect(user1).resellToken(0, resalePrice, { value: royaltyFee }))
        .to.emit(nftMarketplace, "MarketItemRelisted")
        .withArgs(0, user1.address, resalePrice
      )
    });

    it("Transaction Rejected when Price is set to Zero", async function () {
      await expect(
        nftMarketplace.connect(user1).resellToken(0, 0, { value: royaltyFee })
        ).to.be.revertedWith("Please set a Positive Number as the price of the item");
    });

    it("Transaction Rejected when required Royalty Fee is not Paid", async function () {
      await expect(
        nftMarketplace.connect(user1).resellToken(0, resalePrice, { value: 0 })
      ).to.be.revertedWith("Please send the required Royalty Fee in order to relist the item on Marketplace");
    });

  });


  describe("Getter functions", function () {
    let soldItems = [3, 5, 7];
    let ownedByUser1 = [3, 5];
    let ownedByUser2 = [7];

    beforeEach(async function () {
      await nftMarketplace.connect(user1).buyToken(3, { value: prices[3] });
      await nftMarketplace.connect(user1).buyToken(5, { value: prices[5] });
      await nftMarketplace.connect(user2).buyToken(7, { value: prices[7] });
    })

    it("Fetched the Unsold Marketplace Items", async function () {
      const unsoldItems = await nftMarketplace.getAllUnsoldTokens();
      expect(
        unsoldItems.every(
          (i) => !soldItems.some(
            (j) => j === i.tokenId.toNumber()
          )
        ) 
      )
      .to.equal(true);
      expect(unsoldItems.length === prices.length - soldItems.length).to.equal(true)
    });

    it("Fetched the User Owned Items", async function () {
      let myTokens = await nftMarketplace.connect(user1).getMyTokens();

      expect(
        myTokens.every(
          (i) => ownedByUser1.some(
            (j) => j === i.tokenId.toNumber()
          )
        )
      )
      .to.equal(true);
      expect(ownedByUser1.length === myTokens.length).to.equal(true);

      myTokens = await nftMarketplace.connect(user2).getMyTokens()

      expect(
        myTokens.every(
          (i) => ownedByUser2.some(
            (j) => j === i.tokenId.toNumber()
          )
        )
      )
      .to.equal(true);
      expect(ownedByUser2.length === myTokens.length).to.equal(true);
    });

  });

});
