<template>
    <div class="tb-container">
        <div class="tb-selection-numbers-container">
            <div>
                <span class="tb-selection-num">4</span>
                Playlists Selected
            </div>
            <div>
                <span class="tb-selection-num">255</span>
                Tracks
            </div>
        </div>


        <div class="tb-mid-section">
            Last Sync: {{Date.now()}}
        </div>


        <div class="tb-button-panel">
            <div class="tb-button-container">
                    
                <div class="tb-button dl-icon">
                    <donwload-icon></donwload-icon>
                </div>
         
                <div class="tb-button dl-icon">
                    <donwload-icon></donwload-icon>
                </div>
         
                <div class="tb-button dl-icon">
                    <donwload-icon></donwload-icon>
                </div>
         
            </div>
        </div>
    </div>
</template>

<script>
import DonwloadIcon from '../../assets/icons/download-icon.vue'
export default {
    props:{
        user: Object,
    },
    components:{
        DonwloadIcon: DonwloadIcon,
    }
}
</script>

<style>
.tb-container{
    text-align: left;
    height: 2.7rem;
    width: 100%;
    display: flex;
    position: sticky;
    top: 0;
    background: #333;
    flex-direction: row;
    flex-wrap: nowrap;
    margin-bottom: 1rem;
    z-index: 10;
    justify-content: space-between;
}
.tb-selection-numbers-container{
    font-size: .5rem;
    margin: 0 0 0 .3rem;
    box-sizing: border-box;
    width: 10rem;
    border: 1px solid white;
}
.tb-selection-num{
    font-size: .9rem;
    font-family: "Poppins Semibold";
    padding-right: .1rem;
}


.tb-mid-section{
    font-size: .5rem;
    border: 1px solid white;

}

.tb-button-panel{
    width: 10rem;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    border: 1px solid white;
}
.tb-button-container{
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 7rem;
    border: 1px solid white;
}
.tb-button{
    width: 1.2rem;
    height: 1.2rem;
}
</style>
