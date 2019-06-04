import Vue from 'vue';
import { ActionDef, Cost, Effect, ItemDef, Prereqs, ResourceGain, UpgradeDef, UpgradeEffects } from '@/App.vue';
import items from "@/data/items.json";
import upgrades from "@/data/upgrades.json";
import actions from "@/data/actions.json";

const actionDefs: {[key: string]: ActionDef} = actions;
const itemDefs: {[key: string]: ItemDef} = items;
const upgradeDefs: {[key: string]: UpgradeDef} = upgrades;

// TODO: somewhere along the line, something got confused about imports from .vue files.
//       The ts compiler has no problem, but my IDE complains
//       It might be worth refactoring that out into its own .ts file anyway, keep the .vue
//       file as purely presentational as possible

interface IStore
{
  resources: { [key: string]: number},
  items: { [key: string]: number},
  upgrades: {[key: string]: boolean},
  unlocked: {[key: string]: boolean}
}

// The store is what drives the main logic of the game (apart from the win condition)
class Store
{
  // pre-unlocked actions are hard coded right now. One improvement would be to
  // allow starting actions to be defined in the data
  store: IStore = { resources: {copper: 0}, items: {}, upgrades: {}, unlocked: {"mine": true}};

  private prereqs: {[key: string]: Prereqs} = {};

  get resources()
  {
    return this.store.resources;
  }

  get items()
  {
    return this.store.items;
  }

  get upgrades()
  {
    return this.store.upgrades;
  }

  get unlocked()
  {
    return this.store.unlocked;
  }

  public purchaseItem(item: string, cost: Cost)
  {
    if (this.canAffordCost(cost))
    {
      this.subtractCost(cost);

      if (this.store.items[item] === undefined)
      {
        // Allows Vue to react to changes on this property
        Vue.set(this.store.items, item, 0);
      }

      this.store.items[item] += 1;

      this.checkPrereqs();
    }
  }

  public sellItem(item: string, cost: Cost)
  {
    for (let [resource, amount] of Object.entries(cost))
    {
      this.store.resources[resource] += amount;
    }

    this.store.items[item] -= 1;
  }

  // Upgrades are slightly more complicated than Items because
  // they have complicated effects that need to happen immediately after purchase
  public purchaseUpgrade(upgrade: string, cost: Cost)
  {
    if (this.canAffordCost(cost))
    {
      this.subtractCost(cost);

      Vue.set(this.store.upgrades, upgrade, true);

      let def = upgradeDefs[upgrade];

      if (def && def.effects)
      {
        // TODO: you could probably do something smart like beef up
        //       Items and Actions into base classes, then give them
        //       an applyEffect method which takes an Effect enum
        //       maybe subclasses register handlers with the base to
        //       actually make the effect happen or ignore it

        //       point is, i don't like this long 'if' chain at all
        for (let [target, effect] of Object.entries(def.effects))
        {
          let targetDef = itemDefs[target] || actionDefs[target];

          if (effect.multiplyOutput && targetDef.effect.gainResource)
            for (let [key, val] of Object.entries(targetDef.effect.gainResource))
              targetDef.effect.gainResource[key] = val * effect.multiplyOutput;

          if (effect.addOutput && targetDef.effect.gainResource)
            for (let [key, val] of Object.entries(targetDef.effect.gainResource))
              targetDef.effect.gainResource[key] = val + effect.addOutput;

          if (effect.changeCost)
            targetDef.cost = effect.changeCost;

          if (effect.changeCostFactor)
            targetDef.costFactor = effect.changeCostFactor;

          if (effect.changeRunningCost)
            targetDef.runningCost = effect.changeRunningCost;

          if (effect.multiplyOutputChance && targetDef.effect.gainResourceChance)
            for (let [key, val] of Object.entries(targetDef.effect.gainResourceChance))
              targetDef.effect.gainResourceChance[key] = val * effect.multiplyOutputChance;
        }
      }
    }

    this.checkPrereqs();
  }

  public handleAction(action: ActionDef)
  {
    if (action.cost) {
      if (!this.canAffordCost(action.cost))
        return;
      else
        this.subtractCost(action.cost);
    }

    this.handleEffect(action.effect);

    this.checkPrereqs();
  }

  // Loops through all of the user's owned items and updates the state with
  // their effects, if there are enough resources to afford them
  public handleItemEffects()
  {
    for (let [itemId, qty] of Object.entries(this.store.items))
    {
      let def = itemDefs[itemId];

      if (def.runningCost)
      {
        if (!this.canAffordCost(def.runningCost, qty))
          continue;
        else
          this.subtractCost(def.runningCost, qty);
      }

      this.handleEffect(def.effect, qty);
    }

    this.checkPrereqs();
  }

  // Handles a single effect
  private handleEffect(effect: Effect, qty = 1)
  {
    if (effect.gainResource)
      this.gainResource(effect.gainResource, qty);

    if (effect.gainResourceChance)
    {
      for (let [resource, chance] of Object.entries(effect.gainResourceChance))
      {
        // If the user owns several items that all grant a resource gain chance,
        // each one gets a chance to gain the item
        for (let i = 0; i < qty; i++)
        {
          if (Math.random() <= chance)
            this.gainResource({[resource]: 1});
        }
      }
    }
  }

  // Checks if some 'thing' (action, item, upgrade) has had its prereqs
  // satisfied
  private checkPrereq(id: string, prereqs: Prereqs)
  {
    // if the id has never been checked before, we need to Vue.set it so
    // Vue can pick it up in its dependency tracking
    if (this.store.unlocked[id] === undefined)
      Vue.set(this.store.unlocked, id, false);

    // For every resource the prereq demands, check if the player has enough
    if (prereqs.resources)
      for (let [resource, amount] of Object.entries(prereqs.resources))
        if (this.store.resources[resource] === undefined || this.store.resources[resource] < amount)
          return false;

    // For every item the prereq demands, check if the player owns enough
    if (prereqs.items)
      for (let [item, amount] of Object.entries(prereqs.items))
        if (this.store.items[item] === undefined || this.store.items[item] < amount)
          return false;

    // For every upgrade, etc., etc.
    // TODO: are these 'if's necessary?
    //       making each field mandatory for Prereqs, but set to an empty array
    //       for those that don't need one would definitely let us cut them out
    if (prereqs.upgrades)
      for (let upgradeId of prereqs.upgrades)
        if (!this.store.upgrades[upgradeId])
          return false;

    this.store.unlocked[id] = true;

    return true;
  }

  public checkPrereqs()
  {
    // Loop through every prereq that the main application registered with us
    // and see if anything new has become unlocked
    for (let [id, prereqs] of Object.entries(this.prereqs))
    {
      let success = this.checkPrereq(id, prereqs);

      if (success)
        delete this.prereqs[id];
    }
  }

  public registerPrereqs(id: string, prereqs: Prereqs)
  {
    this.prereqs[id] = prereqs;
  }

  // Since costs can be a combination of units, we need to check if the user
  // has enough of all of them, which is what these wrappers do
  private canAffordCost(cost: Cost, qty = 1)
  {
    for (let [resource, amount] of Object.entries(cost))
    {
      if (this.store.resources[resource] < amount * qty)
        return false;
    }

    return true;
  }

  private subtractCost(cost: Cost, qty = 1)
  {
    for (let [resource, amount] of Object.entries(cost))
      this.store.resources[resource] -= amount * qty;
  }

  // Similarly, resources can be gained in combination, so we need to add them
  // all at once
  private gainResource(gainAmount: ResourceGain, qty = 1)
  {
    for (let [resource, amount] of Object.entries(gainAmount))
    {
      if (this.store.resources[resource] === undefined)
        Vue.set(this.store.resources, resource,0);

      this.store.resources[resource] += amount * qty;
    }
  }
}

export const store = new Store();
