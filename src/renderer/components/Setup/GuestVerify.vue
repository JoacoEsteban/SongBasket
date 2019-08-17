<template>
    <div
     class="display-whole-container alt">
            <!-- <router-link to="/" tag="button" class="button"  >Log in</router-link> -->
            <div class="half top">
              <div class="profile-container">
                <div
                :style="user.images[0] !== undefined ? `background-image: url(${user.images[0].url})` : null"
                class="user-photo">
                  <user-icon v-if="user.images[0] === undefined" />
                <!-- style="background-image: url(https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/60116715_10206126614682262_1328470269831938048_n.jpg?_nc_cat=105&_nc_oc=AQnX4sqJlkCfrfZvyYh3U-x53LgqLxhMQmhqewNeVh7hMFbaKGmvISb0k5DSvjicTQM&_nc_ht=scontent.xx&oh=1a52435535742e5191d0c0723b303c1b&oe=5DD8F07F)" -->
                </div>

                <div class="user-data">
                  <div class="name">
                    {{user.display_name}}
                    <!-- Joaco Esteban -->
                  </div>
                  <div class="followers">
                    {{user.followers.total}} Followers
                    <!-- 30 Followers -->
                  </div>
                </div>
              </div>
            </div>


            <div class="half">
              <button 
              class="button accept" 
              @click="$emit('confirm-user')" 
              >Sounds Good</button>
              <button class="button cancel"
              @click="$emit('not-user')"
              >Never Seen Him</button>
            </div>
    </div>
</template>

<script>
import userIcon from '../../assets/icons/user-icon.vue'

export default {
  components: {
    userIcon
  },
  computed: {
    user () {
      return this.$route.params.user
    }
  },
  mounted () {
    if (this.user === undefined) this.$emit('not-user')
  }
}
</script>

<style lang="scss" scoped>
$viewh: 10vh;
$vieww: 10vw;
$viewmin: 10vmin;

.alt {
  flex-direction: column;
}
.half {
  height: 50%;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  &.top {
    min-height: 65%;
  }

}
.profile-container {
  // width: 18rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.user-photo {
  $size: $viewh * 3;
  min-width: $size;
  max-width: $size;
  min-height: $size;
  max-height: $size;
  border-radius: 50%;
  border: 5px solid var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
    
  background-color: #282828;
  background-position: center;
  background-size: cover;
}
.user-data {
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  .name {
    text-align: left;
    font-size: $viewmin * .7;
    font-family: 'Poppins SemiBold';
  }
  .followers {
    font-size: $viewh * .5;
    font-family: 'Poppins Light';
  }
}

.button {
  width: 10rem;
  margin: 0 .7rem;

}
.user-icon{
    width: .52rem;
    height: .52rem;
}
</style>
