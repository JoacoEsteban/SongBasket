<template>
  <div class="global-search-bar-container">
    <div class="filters-container">
      <div class="filters-content">
        <div class="search-bar global-scroll-shadow">
          <div class="filters-background show-on-scroll">
          </div>
          <input placeholder="Start Typing" autofocus
          ref="search-input"
          class="input-light semibold"
          type="text"
          @focus="searchInputOnFocus"
          @blur="searchInputOnBlur"
          v-model.trim="searchInput"
          @keydown.enter="handleInputConfirm"
          >
        </div>
        <div class="filter-buttons">

        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  components: {
  },
  data () {
    return {
      searchInput: '',
      model: this.$root.SEARCH_INPUT
    }
  },
  mounted () {
    this.searchInputOnBlur()
    this.$sbRouter.beforeTransition(() => (this.searchInput = '') + (this.model.value = ''))
  },
  computed: {
  },
  watch: {
    searchInput (val) {
      this.model.writeEvent = !this.model.writeEvent
      this.model.value = val
    }
  },
  methods: {
    searchInputOnFocus () {
      this.$root.searchInputElement = null
    },
    searchInputOnBlur () {
      this.$root.searchInputElement = this.$refs['search-input']
    },
    handleInputConfirm () {
      // if (this.syncedPlaylistsFiltered && this.syncedPlaylistsFiltered.length === 1) {
      //   const pl = this.$children.find(p => p.playlistId === this.syncedPlaylistsFiltered[0].id)
      //   pl && pl.handleClick()
    }
  }
}
</script>

<style lang="scss" scoped>
.global-search-bar-container {
  position: absolute;
  height: 4em;
  bottom: -4em;
  width: 100%;
  z-index: 2;
  pointer-events: none;
  .filters-container {
  pointer-events: none;
  padding: .5em;
  top: 0;
  z-index: 1;
  box-sizing: border-box;
  height: var(--filters-container-height);
  .filters-background {
    background: linear-gradient(180deg, var(--global-grey-secondary), transparent);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
  }
  .filters-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    // padding: 0 1em;
  }
  .search-bar {
    pointer-events: all;
    .filters-background {
      background: var(--global-grey-secondary);
    }
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    border-radius: 10em;
    padding-left: 1em;
    padding-right: .2em;
  }
}
}
</style>
