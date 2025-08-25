<script>
  import Input from "./Input.svelte";

  let { value = $bindable() } = $props();

  const type = $derived(typeof value);
</script>

{#snippet keys(value)}
	{@const str = Object.keys(value).join(", ")}
	<p>Keys: {str}</p>
{/snippet}

{#if Array.isArray(value)}
	{@render keys(value)}
  {#each value, i}
    <Input bind:value={value[i]} />
  {/each}
{:else if type === "object" && value !== null}
	{@render keys(value)}
  {#each Object.keys(value) as key (key)}
    <Input bind:value={value[key]} />
  {/each}
{:else}
  <input bind:value />
{/if}
