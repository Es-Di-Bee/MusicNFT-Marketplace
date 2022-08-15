// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MusicNFTMarketplace is ERC721("MusicNFTs", "MNS"), Ownable {

    string public baseURI = "https://bafybeidhjjbjonyqcahuzlpt7sznmh4xrlbspa3gstop5o47l6gsiaffee.ipfs.nftstorage.link/";
    address public artist;
    uint256 public royaltyFee;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        uint256 price;
    }

    MarketItem[] public marketItems;

    event MarketItemBought (
        uint256 indexed tokenId, 
        address indexed seller,
        address buyer,
        uint256 price
    );

    event MarketItemRelisted (
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    constructor(uint256 _royaltyFee, address _artist, uint256[] memory _prices) payable { 
        require(msg.value >= _prices.length * _royaltyFee, "Please pay the required Royalty Fee for all the Tokens listed on the Marketplace");

        royaltyFee = _royaltyFee;
        artist = _artist;

        for(uint8 i = 0; i < _prices.length; i++) {
            require(_prices[i] > 0, "Prices must be greater than Zero");
            _mint(address(this), i);
            MarketItem memory music_nft = MarketItem(i, payable(msg.sender), _prices[i]);
            marketItems.push(music_nft);
        }
    }

    function updateRoyaltyFee(uint256 _royaltyFee) external onlyOwner {
        royaltyFee = _royaltyFee;
    }

    function buyToken(uint256 _tokenId) external payable {
        uint256 price = marketItems[_tokenId].price;
        address seller = marketItems[_tokenId].seller;

        require(msg.value == price, "Please send the asking price in order to complete the purchase");
        payable(artist).transfer(royaltyFee);
        payable(seller).transfer(msg.value);
    
        _transfer(address(this), msg.sender, _tokenId);
        marketItems[_tokenId].seller = payable(address(0));
        emit MarketItemBought(_tokenId, seller, msg.sender, price);
    }

    function resellToken(uint256 _tokenId, uint256 _price) external payable {
        require(msg.value == royaltyFee, "Please send the required Royalty Fee in order to relist the item on Marketplace");
        require(_price > 0, "Please set a Positive Number as the price of the item");
        _transfer(msg.sender, address(this), _tokenId);

        marketItems[_tokenId].price = _price;
        marketItems[_tokenId].seller = payable(msg.sender);
        emit MarketItemRelisted(_tokenId, msg.sender, _price);
    }

    function getAllUnsoldTokens() external view returns(MarketItem[] memory) {
        uint256 unsoldCount = balanceOf(address(this));
        MarketItem[] memory unsoldTokens = new MarketItem[] (unsoldCount); 
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < marketItems.length; ++i) {
            if (marketItems[i].seller != address(0)) {
                unsoldTokens[currentIndex] = marketItems[i];
                ++currentIndex;
            }
        }

        return unsoldTokens;
    }

    function getMyTokens() external view returns(MarketItem[] memory) {
        uint256 myTokenCount = balanceOf(msg.sender);
        MarketItem[] memory myTokens = new MarketItem[] (myTokenCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < marketItems.length; ++i) {
            if (ownerOf(i) == msg.sender) {
                myTokens[currentIndex] = marketItems[i];
                ++currentIndex;
            }
        }

        return myTokens;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

}
