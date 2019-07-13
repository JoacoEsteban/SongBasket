<template>
    <div class="login-container">
            <h1 class="login-sb-title">Guest</h1>
                <input autofocus class="guest-search-box" type="text" v-model="userQuery" @keyup.enter.prevent="guestSearch" />
            <button class="button" @click="guestSearch">Search User</button>
    </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer;

export default {
    data(){
        return{
            userQuery: '',
        }
    },
  methods:{
    guestSearch(){
        ipc.send('guestSearch', { userQuery: this.userQuery })
    }
    },
}
</script>

<style>
.guest-search-box{
    display: block;
    margin: 0;
    padding-bottom: 1rem;
    outline: none;
    width: 100%;
    font-size: 3rem;
    font-family: 'Poppins black';
    text-align: center;
    border: none;
    color: white;
    background: none;
    transition: transform .15s ease, background .2s ease;
}
</style>
