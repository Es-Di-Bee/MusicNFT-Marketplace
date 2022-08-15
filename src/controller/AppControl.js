import { ethers } from "ethers"
import MusicNFTMarketplaceAbi from '../contractsData/MusicNFTMarketplace.json'
import MusicNFTMarketplaceAddress from '../contractsData/MusicNFTMarketplace-address.json'

export async function ConnectWallet (props) {
    var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    props[3](accounts[0]);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(MusicNFTMarketplaceAddress.address, MusicNFTMarketplaceAbi.abi, signer);

    props[5](contract);
    props[1](false);
}

export async function DisconnectWallet (props) {
    props[3](null);
    props[1](true);
}