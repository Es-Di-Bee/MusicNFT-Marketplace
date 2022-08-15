import Identicon from 'identicon.js';

export async function LoadResales(props) {
  let filter = props[0].filters.MarketItemRelisted(null, props[1], null);
  let results = await props[0].queryFilter(filter);

  const listedItems = await Promise.all(results.map(async i => {
    i = i.args;
    const uri = await props[0].tokenURI(i.tokenId);
    const response = await fetch(uri + ".json");
    const metadata = await response.json();
    const identicon = `data:image/png;base64,${new Identicon(metadata.name + metadata.price, 330).toString()}`;

    let purchasedItem = {
      price: i.price,
      itemId: i.tokenId,
      name: metadata.name,
      audio: metadata.audio,
      identicon
    }

    return purchasedItem;

  }))

  props[6](listedItems);

  filter = props[0].filters.MarketItemBought(null, props[1], null, null);
  results = await props[0].queryFilter(filter);
  const soldItems = listedItems.filter(i => results.some(j => i.itemId.toString() === j.args.tokenId.toString()));

  props[8](soldItems);
  props[4](false);
}