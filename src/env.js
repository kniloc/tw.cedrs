import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PLATEIMG_READ_WRITE_TOKEN: { static: true },
	X_POSTGRES_URL: { static: true }
});
