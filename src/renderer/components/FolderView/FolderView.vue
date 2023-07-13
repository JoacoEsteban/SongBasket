<template>
  <div class="folder-view-container window-drag-recursive">
    <div class="setup-header">
      <span>
        {{ title }}
      </span>
    </div>
    <div class="list-wrapper df fldc">
      <div class="folder-list row">
        <Folder v-for="(path, key) in folders" :key="key" :path="path" @clicked="openFolder(path)"
          @editFolder="editFolder(path)" @deleteFolder="deleteFolder(path)" :index="key" />
      </div>
      <div class="pusher w100"></div>
    </div>
    <div class="w100 df global-center py-2 abs-bot no-click controls-container" @click="addFolder">
      <button class="button all-click">
        <span>
          Add a new Folder
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Folder from './Folder.vue'
export default {
  components: {
    Folder
  },
  data () {
    return {
      title: 'Your Folders',
      folders: global.CONSTANTS.APP_STATUS.FOLDERS.paths
    }
  },
  methods: {
    openFolder (path) {
      this.$root.$controllers.core.setHomeFolder(path)
    },
    editFolder (path) {
    },
    deleteFolder (path) {
      this.$root.$controllers.core.askRemoveFolder({ path })
    },
    async addFolder () {
      try {
        await this.$root.$controllers.setup.setHomeFolder()
        await this.$root.$controllers.setup.login()
      } catch (error) {
        console.error('ERROR setting folder', error)
      }
    }
  },
  mounted () {
    // this.deleteFolder(this.folders[0])
  }
}
</script>

<style lang="scss" scoped>
.folder-view-container {
  --controls-height: 3em;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.setup-header {
  --height: 15vw;

  >span {
    font-size: .75em;
  }
}

.list-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 1em;
  box-sizing: border-box;

  .pusher {
    min-height: var(--controls-height);
  }
}

.folder-list {}

.controls-container {
  height: var(--controls-height);
}
</style>
