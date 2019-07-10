<template>
<div class="ud-container dev-border-w">
    <div class="ud-name-container dev-border-w">
        <span class="ud-text dev-border-w">{{user.display_name}}</span>
    </div>
    <div class="ud-playlist-count dev-border-w">
        {{playlistCount}} Playlists

    </div>
    <div class="ud-settings dev-border-w">

    </div>

</div>
</template>

<script>
export default {
    props:{
        user: Object,
        playlistCount: String,
    },
    data(){
        return{}
    }
}
</script>

<style>
.ud-container{
    height: 2rem;
    width: 100%;
    display: flex;
    position: fixed;
    bottom: 0;
    background: #333;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
}
.ud-text{
    /* border: 1px solid white; */
    display: inline-block;
    margin: 0 .8rem;
    font-size: .7rem;
    font-weight: 800;
}
.ud-playlist-count{
    display: inline
}
.ud-settings{
    width: 20px;
    height: 20px;
    background: #666;
}
</style>
