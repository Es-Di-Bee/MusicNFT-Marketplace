import Identicon from 'identicon.js';
import { ethers } from "ethers"

export async function LoadTokens(props) {
  const results = await props[0].getMyTokens()
  const myTokens = await Promise.all(results.map(async i => {
    const uri = await props[0].tokenURI(i.tokenId)
    const response = await fetch(uri + ".json")
    const metadata = await response.json()
    const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`

    let item = {
      price: i.price,
      itemId: i.tokenId,
      name: metadata.name,
      audio: metadata.audio,
      identicon,
      resellPrice: null
    }

    return item
  }))

  props[7](myTokens);
  props[5](false);
}

export async function ResellItem(props, item) {
  if (props[14] === "0" || item.itemId !== props[12] || !props[14]) {
    return;
  }

  const fee = await props[0].royaltyFee();
  const price = ethers.utils.parseEther(props[14].toString());
  await (await props[0].resellToken(item.itemId, price, { value: fee })).wait();
  LoadTokens(props);
}