import {error} from "@sveltejs/kit";
import {getCollection, getLicensePlateImages} from "$lib/server/plateUtils.js";

export async function load({params}) {
    const userCollection = await getCollection(params.id);

    if (!userCollection.length) {
        error(404, 'Collection not found');
    }

    const regions = [...new Set(userCollection.map(p => p.plate_region))];
    const imageMap = await getLicensePlateImages(regions);

    const plates = userCollection.map(plate => ({
        ...plate,
        image_url: imageMap[plate.plate_region]
    }));

    return {plates};
}