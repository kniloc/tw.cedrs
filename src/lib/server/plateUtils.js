import {list} from "@vercel/blob";
import {Pool} from "pg";
import {PLATEIMG_READ_WRITE_TOKEN, X_POSTGRES_URL} from "$env/static/private";

const dbPool = new Pool({
    connectionString: X_POSTGRES_URL
})

async function getImagesFromBlob() {
    try {
        const {blobs} = await list({token: PLATEIMG_READ_WRITE_TOKEN, prefix: "plates/"});
        return blobs;
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getCollection(userID) {
    const query = await dbPool.query("SELECT username, plate_region, plate_number, text_color FROM license_plates where user_id = $1", [userID]);
    return query.rows;
}

export async function getLicensePlateImages(regions) {
    const blobs = await getImagesFromBlob();
    return Object.fromEntries(
        regions.map(region => [
            region,
            blobs.find(blob => blob.pathname === `plates/${region}.png`)?.url ?? null
        ])
    );
}