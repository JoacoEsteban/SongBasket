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

        </div>
    </div>
</template>

<script>
export default {
    props:{
        user: Object,
    },
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
    border: 1px solid white;
    width: 10rem;
    box-sizing: border-box;
    
}
</style>
