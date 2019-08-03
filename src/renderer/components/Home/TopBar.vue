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
      Last Sync: {{now}}
      <router-link to="/home" tag="span">
        <home-icon />
      </router-link>
    </div>

    <div class="tb-button-panel">
      <div class="tb-button-container">
        <div class="tb-button sync-icon">
          <sync-icon></sync-icon>
        </div>

        <div class="tb-button cloud-search-icon">
          <cloud-search-icon></cloud-search-icon>
        </div>

        <div class="tb-button download-icon">
          <download-icon></download-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SyncIcon from "../../assets/icons/sync-icon.vue";
import CloudSearchIcon from "../../assets/icons/cloud-search-icon.vue";
import DownloadIcon from "../../assets/icons/download-icon.vue";
import HomeIcon from "../../assets/icons/home-icon.vue";
export default {
  components: {
    DownloadIcon,
    SyncIcon,
    CloudSearchIcon,
    HomeIcon
  },
  data() {
    return {
      user: this.$store.state.CurrentUser.user,
      now: new Date()
    };
  }
};
</script>

<style>
.tb-container {
  text-align: left;
  min-height: 2.7rem;
  width: 100%;
  display: flex;
  /* position: sticky; */
  /* top: 0; */
  background: #333;
  flex-direction: row;
  flex-wrap: nowrap;
  /* margin-bottom: 1rem; */
  z-index: 10;
  justify-content: space-between;
}
.tb-selection-numbers-container {
  font-size: 0.5rem;
  margin: 0 0 0 0.3rem;
  box-sizing: border-box;
  width: 10rem;
}
.tb-selection-num {
  font-size: 0.9rem;
  font-family: "Poppins Semibold";
  padding-right: 0.1rem;
}

.tb-mid-section {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  font-size: 0.5rem;
}

.tb-button-panel {
  width: 10rem;
  padding-right: 0.6rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-sizing: border-box;
}
.tb-button-container {
  display: flex;
  justify-content: space-between;
  width: 5rem;
}
.tb-button {
  width: 1.2rem;
  height: 1.2rem;
  /* transition: transform .1s ease; */
}
.tb-button:hover {
}
</style>
