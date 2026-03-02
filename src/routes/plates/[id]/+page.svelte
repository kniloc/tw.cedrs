<script>
    import LicensePlate from '$lib/components/LicensePlate.svelte';
    import Title from "$lib/components/Title.svelte";

    const {data} = $props();
    const username = $derived(data.plates[0]?.username);
    const titleText = "License plate collection!";
</script>

<Title text={titleText}/>
<main class="plates-container">
    <header>
        <h2>{username}</h2>
    </header>
    <section class="plate-grid">
        {#each data.plates as plate}
            <LicensePlate src={plate.image_url} text={plate.plate_number} color={plate.text_color}/>
        {/each}
    </section>
</main>

<style>
    header {
        text-align: center;
        font-weight: 700;
        font-size: 30px;
    }

    .plates-container {
        margin: 0 auto;
    }

    .plate-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 5px;
        padding: 10px;
    }

    @media (max-width: 1024px) {
        .plate-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 640px) {
        .plate-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
