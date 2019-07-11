<template>
  <svg 
    :style="style"
    :class="customClasses"
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
>
        <path :d="props.path" />
</svg>

</template>

<script>
export default {
  props:{
    path: {
      type: String,
      require: true
    },
    iconColor: String,
    class: String,
  },
  data(){
    return{

    }
  },
  computed:{
    customClasses: 'icon '+ $props.class,
    style: {
      background: 'none',
      fill: $props.iconColor,
    },
  }
}
</script>

<style>

</style>