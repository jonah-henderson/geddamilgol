<template>
  <button @click="act">{{ this.definition.description.name }}</button>
</template>

<script lang="ts">

  import { store } from "@/store";
  import { Component, Prop, Vue } from 'vue-property-decorator';
  import { ActionDef } from '@/App.vue';

  @Component
  export default class Action extends Vue
  {
    @Prop() private definition!: ActionDef;

    public act()
    {
      store.handleAction(this.definition);
    }
  }
</script>

<style scoped>
  button {
    width: 100%;
    margin-bottom: 16px;
    background-color: #b097fc;
    color: #222;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    padding: 8px;
  }

  button:hover {
    background-color: #dbd1f9;
  }

  button:active {
    background-color: #a087ec;
    text-decoration: none;
  }

  button:focus {
    text-decoration: none;
  }
</style>
