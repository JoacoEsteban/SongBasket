<template>
<div class="ud-container dev-border">
    <div class="ud-name-container dev-border">
        <div class="ud-user-img" :style="{'background-image': `url(${user.images[0].url})`}" />
        <span class="ud-text dev-border">{{user.display_name}}</span>
    </div>
    <div class="ud-playlist-count dev-border">
        {{playlistCount}} Playlists

    </div>
    <div class="ud-settings dev-border">
        <!-- <settings-icon /> -->
    </div>

</div>
</template>

<script>
// import settingsIcon from '../../assets/icons/settings-icon'

export default {
    props:{
        user: Object,
        playlistCount: String,
    },
    data(){
        return{}
    },
    components:{
        // settingsIcon
    },
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
    align-items: center;
    align-content: center;
}


/* Name Container */
.ud-name-container{
    display: flex;
    align-items: center;
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
    display: inline-block;
}





.ud-settings{
    width: 6rem;
    height: 2rem;
    background: #666;
}
</style>
