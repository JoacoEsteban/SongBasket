<template>
    <div>
        <h4 v-for="playlist in playlists" :key="playlist.id">
            {{ playlist.name}}
        </h4>
    </div>
</template>

<script>
export default {
    props:{
        playlists: Array,
    },
    data(){
        return{
            playlists: this.props.playlists,
        }
    }
}
</script>

<style>

</style>
