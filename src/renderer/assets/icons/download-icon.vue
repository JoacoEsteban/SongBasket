<template>
    <svg-icon :path="path" :icon-color="iconColor" :class-name="className" />
</template>

<script>
import SvgIcon from './SvgIcon.vue';

export default {
    components:{
        SvgIcon,
    },
    data(){
        return{
            path: 'M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z',
            iconColor: '#fff',
            className: 'icon download-icon'
        }
    }
}
</script>

<style>

</style>
