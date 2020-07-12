<template>
  <div class="folder-view-container window-drag-recursive">
    <div class="setup-header">
      <span>
        {{title}}
      </span>
    </div>
    <div class="folder-list">
      <Folder v-for="(path, key) in folders" :key="key" :path="path" @clicked="openFolder(path)" />
    </div>
  </div>
</template>

<script>
import Folder from './Folder'
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
      this.$controllers.core.setHomeFolder(path)
    }
  },
  mounted () {
  }
}
</script>

<style lang="scss" scoped>
.setup-header {
  --height: 15vw;
  > span {
    font-size: .75em;
  }
}
.folder-list {
  padding: 1em;
  width: 100%;
  overflow: auto;
  box-sizing: border-box;
}
</style>
