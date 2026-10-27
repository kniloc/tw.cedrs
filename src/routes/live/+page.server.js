import {redirect} from "@sveltejs/kit";

export function load() {
    redirect(301, "https://twitch.tv/colinahscopy_", { external: true });
}
