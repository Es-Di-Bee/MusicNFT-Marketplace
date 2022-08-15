import Identicon from 'identicon.js';

export async function LoadMarketplaceItems(props) {
  const results = await props[0].getAllUnsoldTokens();

  const marketItems = await Promise.all(results.map(async i => {
    const uri = await props[0].tokenURI(i.tokenId)

    const response = await fetch(uri + ".json")
    const metadata = await response.json()
    const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`

    let item = {
      price: i.price,
      itemId: i.tokenId,
      name: metadata.name,
      audio: metadata.audio,
      identicon
    }

    return item;
  }));

  props[9](marketItems)
  props[3](false)

}

export async function BuyMarketItem(props, item) {
  await (await props[0].buyToken(item.itemId, { value: item.price })).wait();
  LoadMarketplaceItems(props);
}

export async function SkipSong(props, forwards) {
  if (forwards) {
    props[7](() => {
      let index = props[6];
      index++
      if (index > props[8].length - 1) {
        index = 0;
      }
      return index
    })
  } else {
    props[7](() => {
      let index = props[6];
      index--
      if (index < 0) {
        index = props[8].length - 1;
      }
      return index
    })
  }
}