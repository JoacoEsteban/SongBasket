<template>
<div class="ud-container dev-border">
    <div class="ud-name-container dev-border">
        <div v-if="user.images[0] !== undefined" class="ud-user-img" :style="{'background-image': `url(${user.images[0].url})`}" />
        <span class="ud-text dev-border">{{user.display_name !== undefined ? user.display_name : user.id}}</span>
    </div>
    <div class="ud-playlist-count dev-border">
        {{playlistCount}} Playlists

    </div>
    <div class="ud-settings dev-border">
        <settings-icon />
    </div>

</div>
</template>

<script>
import settingsIcon from '../../assets/icons/settings-icon.vue'

export default {
    props:{
        user: Object,
        playlistCount: String,
    },
    data(){
        return{}
    },
    components:{
        settingsIcon
    },
}
</script>

<style>
.ud-container{
    position: sticky;
    margin-top: 1rem;
    height: 1.4rem;
    width: 100%;
    display: flex;
    bottom: 0;
    background: #333;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    align-content: center;
}


/* Name Container */
.ud-name-container{
    display: flex;
    align-items: center;
    width: 10rem;
    font-family: "poppins regular";
    box-sizing: border-box;
}
.ud-user-img{
    margin: 0 .3rem;


    display: inline-block;

    height: 1rem;
    width: 1rem;

    background-position: center;
    background-size: cover;

    border: 1px solid white;
    border-radius: 2rem;
}
.ud-text{
    margin: 0;

    display: inline-block;
    font-size: .5rem;
    font-weight: 800;
}


.ud-playlist-count{
    font-size: 0.7rem;
    font-family: "poppins bold";
}





.ud-settings{
    width: 10rem;
    height: 1.2rem;
    padding-right: .5rem;
    text-align: end;
    box-sizing: border-box;
}
.settings-icon{
    transition: transform .3s ease;
}
.settings-icon:hover {
    transform: scale(1.25) rotate(90deg);

}
</style>
