<template>
    <div class="pl-container">
        <div class="pl-img" :style="{backgroundImage: `url(${playlist.images[0].url})`}">

        </div>
        <div class="pl-name">
            {{playlist.name}}
        </div>
    </div>
</template>

<script>
export default {
    props:{
        playlist: Object,
    },
    data(){
        return{}
    }
}
</script>

<style>
    .pl-container {
        display: inline-block;
        width: 8rem;
        background: #4f4f4f;
        margin: 0 1rem 1.4rem 1rem;
        transition: transform .2s ease;
        border: .2rem solid #4f4f4f;
    }
    .pl-container:hover {
        transform: scale(1.1);
    }
    .pl-img {
        width: 8rem;
        height: 8rem;
        background-position: center;
        background-size: cover;
    }
    .pl-name {
        text-align: left;
        font-size: .6rem;
        font-family: "poppins semibold";
        padding: 0 .2rem;
        height: 1.5rem;
        display: flex;
        align-items: center;

    }
</style>
