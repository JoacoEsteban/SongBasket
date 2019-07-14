<template>
<div class="ud-container dev-border">
    <div class="ud-name-container dev-border">

        <div class="ud-user-img" :style="user.images[0] !== undefined ? {'background-image': `url(${user.images[0].url})`} : null" >
           <user-icon v-if="user.images[0] === undefined" />   
        </div>
        <span class="ud-text dev-border">{{user.display_name !== null ? user.display_name : user.id}}</span>
    </div>
    <div class="ud-playlist-total dev-border">
        {{playlistLoaded}} of {{playlistTotal}} Playlists

    </div>
    <div class="ud-settings dev-border">
        <router-link to="/" tag="span"><settings-icon /></router-link>

    </div>

</div>
</template>

<script>
import settingsIcon from '../../assets/icons/settings-icon.vue'
import userIcon from '../../assets/icons/user-icon.vue'

export default {
    data(){
        return{
            user: this.$store.state.CurrentUser.user,
            playlistTotal: this.$store.state.CurrentUser.control.total.toString(),
            playlistLoaded: this.$store.state.CurrentUser.control.loaded.toString(),
        }
    },
    components:{
        settingsIcon,
        userIcon
    },
    methods:{
    },
    
}
</script>

<style>
.ud-container{
    position: fixed;
    /* margin-top: 1rem; */
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

    display: flex;
    align-items: center;
    justify-content: center;
    
    height: 1rem;
    width: 1rem;

    background-color: #282828;
    background-position: center;
    background-size: cover;

    border: 1px solid #B3B3B3;
    border-radius: 2rem;
}
.user-icon{
    width: .52rem;
    height: .52rem;
}
.ud-text{
    margin: 0;

    display: inline-block;
    font-size: .5rem;
    font-weight: 800;
}


.ud-playlist-total{
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
