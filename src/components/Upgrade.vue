<template>
  <div class="upgrade">
    <div class="wrapper">
      <div class="header">
        <p>{{ definition.description.name }}</p>
      </div>
      <p class="descEffect">{{ definition.description.effect }}</p>
      <div class="actions">
        <button @click="buy">Buy for {{ this.costStr }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { store } from "@/store";
import { Component, Prop, Vue } from 'vue-property-decorator';
import { UpgradeDef } from '@/App.vue';

@Component
export default class Upgrade extends Vue {
  @Prop() private definition!: UpgradeDef;

  buy()
  {
    store.purchaseUpgrade(this.definition.id, this.definition.cost);
  }

  get costStr()
  {
    return Object.entries(this.definition.cost).map(([resource, amount]) => `${amount} ${resource}`).join(", ");
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .upgrade {
    display: flex;
    flex-flow: column;
    background-color: #EF756B;
    color: black;
    border-radius: 8px;
    min-width: 300px;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
    margin-bottom: 16px;
    width: 100%;
  }

  .wrapper {
    margin: 8px;
  }

  .header {
    display: flex;
    flex-flow: row;
    font-size: larger;
    font-weight: bold;
  }

  .spacer {
    flex: 1 1 auto;
  }

  .description {
    display: flex;
    flex-flow: column;
    text-align: left;
  }

  .descDetail {
    font-style: italic;
  }

  .descEffect {
    text-align: center;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .actions {
    display: flex;
    flex-flow: row;
  }

  .actions button {
    flex: 1 1 auto;
  }

</style>
