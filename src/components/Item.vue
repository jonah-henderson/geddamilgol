<template>
  <div class="item">
    <div class="wrapper">
      <div class="description">
        <div class="header">
          <p class="descName">{{ definition.description.name }}</p>
          <span class="spacer"></span>
          <p class="inUse">{{ ownedQty || 0}}</p>
        </div>
        <p class="descDetail">{{ definition.description.detail }}</p>
        <p class="descEffect">{{ this.effectStr }}</p>
      </div>
      <div class="actions">
        <button @click="buy">Buy for {{ this.currentCostStr }}</button>
        <button v-if="ownedQty > 0" @click="sell">Sell for {{ this.prevCostStr }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { store } from "@/store";
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Cost, ItemDef } from '@/App.vue';

@Component
export default class Item extends Vue {
  @Prop() private definition!: ItemDef;
  @Prop() private ownedQty!: number;

  buy()
  {
    store.purchaseItem(this.definition.id, this.currentCost);
  }

  sell()
  {
    store.sellItem(this.definition.id, this.prevCost);
  }

  get effectStr()
  {
    let str = [];

    if (this.definition.runningCost)
      for (let [resource, amount] of Object.entries(this.definition.runningCost))
        str.push(`-${amount} ${resource}/sec`);

    if (this.definition.effect.gainResource)
      for (let [resource, amount] of Object.entries(this.definition.effect.gainResource))
        str.push(`+${amount} ${resource}/sec`);

    if (this.definition.effect.gainResourceChance)
      for (let [resource, chance] of Object.entries(this.definition.effect.gainResourceChance))
        str.push(`${chance.toFixed(2)}% chance of ${resource}/sec`);

    return str.join(", ");
  }

  get currentCost()
  {
    let cost = Object.assign({}, this.definition.cost);

    for (let resource of Object.keys(cost))
    {
      for (let i = 0; i < this.ownedQty; i++)
        cost[resource] = Math.pow(cost[resource], this.definition.costFactor);

      cost[resource] = Math.floor(cost[resource]);
    }

    return cost;
  }

  get currentCostStr()
  {
    let currentCost = this.currentCost;

    return Object.entries(currentCost).map(([resource, amt]) => `${amt} ${resource}`).join(', ');
  }

  get prevCost()
  {
    let cost = Object.assign({}, this.definition.cost);

    for (let resource of Object.keys(cost))
    {
      for (let i = 0; i < this.ownedQty - 1; i++)
        cost[resource] = Math.pow(cost[resource], this.definition.costFactor);

      cost[resource] = Math.floor(cost[resource]);
    }

    return cost;
  }

  get prevCostStr()
  {
    let prevCost = this.prevCost;

    return Object.entries(prevCost).map(([resource, amt]) => `${amt} ${resource}`).join(', ');
  }
}
</script>

<style scoped>
  .item {
    display: flex;
    flex-flow: column;
    background-color: #7699f2;
    color: #222;
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
    font-weight: bold;
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
