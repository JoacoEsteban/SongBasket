<style lang="scss">
html {
  font-size: 30px;
  height: var(--max-container-height);
  overflow: hidden;
  &.disconnected {
    body {
      --body-color: var(--body-color-disconnected);
    }
  }
}
/* width */
::-webkit-scrollbar {
  width: 7px;
}

/* Track */
::-webkit-scrollbar-track {
  background: var(--global-grey);
  padding-top: 2em;
  /* border-radius: 1em; */
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #bbb;
  transition: background-color;
  // border-radius: 1em;
  transition: background var(--ts-g);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

.window-nodrag {
  -webkit-app-region: no-drag !important;
}
.window-drag {
  -webkit-app-region: drag;
}
.window-drag-recursive {
  &, * {
    @extend .window-drag;
  }
}


body {
  background-color: var(--body-color);
  color: var(--text-white);
  --icon-color: var(--text-white);
  font-family: "made_tommy", sans-serif;
  font-size: 1em;
  margin: 0;
  user-select: none;
  overflow: hidden;
  height: 100%;
  $t: var(--body-colors-transition);
  transition: background-color $t, color $t;
}
body:hover {
  cursor: default;
}
.text {
  font-family: "DM Sans";
  font-weight: normal;
}
.button {
  $transition: var(--button-transition);
  @extend .window-nodrag;
  outline: none;
  font-family: "made_tommy";
  font-weight: bold;
  font-size: 0.7em;
  padding: 1em 1.5em;
  text-align: center;
  // height: 2em;
  /* width: 10em; */
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0.1em 0.1em 0.3em 0 rgba(0, 0, 0, 0.4);
  border-radius: 2em;
  color: var(--text-black);
  background: var(--text-white);
  transition: transform $transition, background $transition, opacity $transition;
  cursor: pointer;

  &:hover {
    font-weight: 500;
    transform: scale(1.05);
    background: var(--button-purple);
    color: var(--text-white);
  }
  &:active {
    font-weight: 500;
    transform: scale(0.98);
    background: var(--button-purple);
    color: var(--text-white);
    opacity: 0.9;
  }
  &.accept {
    background-color: var(--green-accept);
    color: var(--text-white);
    font-weight: 500;
  }
  &.cancel {
    background-color: var(--red-cancel);
    color: var(--text-white);
    font-weight: 500;
  }
  &.slim {
    padding: 0.45em 2em;
  }
  &.disabled {
    background-color: #111;
    color: var(--text-white);
    pointer-events: none;
  }
}
.dev-border-w {
  border: 1px solid white;
}
.dev-border-b {
  border: 1px solid black;
}

.link-button {
  color: var(--text-white);
  cursor: pointer;
  text-decoration: underline;
  margin: 0 0.3em;
}

.sb-title {
  font-weight: 500;
  font-size: 1.5em;
}

// .icon {
//   width: 1em;
//   height: 1em;
//   transition: transform 0.1s ease;
// }
// .icon:hover {
//   transform: scale(1.25);
//   cursor: pointer;
// }
.std-input {
  display: block;
  margin: 0;
  font-size: 1em;
  outline: none;
  width: 100%;
  font-family: "Poppins black";
  text-align: center;
  border: none;
  color: white;
  background: none;
  transition: transform 0.15s ease, background 0.2s ease;
}
.input-light {
  display: block;
  margin: 0;
  font-size: 1em;
  outline: none;
  width: 100%;
  text-align: left;
  border: none;
  color: white;
  background: none;
  transition: transform 0.15s ease, background 0.2s ease;
  padding: 0.25em;

  &::-webkit-input-placeholder {
    padding-left: 0.2em;
  }

  &:-moz-placeholder { /* Firefox 18- */
    padding-left: 0.2em;  
  }

  &::-moz-placeholder {  /* Firefox 19+ */
    padding-left: 0.2em;  
  }

  &:-ms-input-placeholder {  
    padding-left: 0.2em; 
  }
}

.global-scroll-shadow {
  box-shadow: 0 3px 8px rgba(0, 0, 0, calc(var(--scroll-opacity) * 0.3))
}

.show-on-scroll {
  opacity: var(--scroll-opacity);
}
.hide-on-scroll {
  opacity: var(--scroll-opacity-inverted);
}

.horizontal-scroller {
  box-sizing: border-box;
  display: flex;
  overflow: auto;
  padding: var(--padding-x);
  padding-bottom: 0;
  &::-webkit-scrollbar {
    display: none;
  }
}

.hideable-container {
  // TODO Adapt transition to global trasition scale factor
  --list-transition-time: .3s;
  transition: var(--hover-n-active-transitions);
  transition-duration: var(--list-transition-time);
  &.hide {
    transform: translateX(-3em);
    opacity: 0;
  }
}
</style>

<style lang="less">
@factor: 1;
@yellow: #ffe500;
@pink: #ff00ff;

.loop (@i: 0) when (@i <=360/@factor) {
  @keyframeSel: ceil(percentage(@i* @factor / 360));
  @degs: @i* @factor*1deg;

  @{keyframeSel} {
    background: linear-gradient(@degs; var(--p));
    filter: hue-rotate(@degs*2);
  }

  .loop((@i + 1));
}

@keyframes background-cycle-less {
  .loop();
}

.gradient-background-cycle-less {
  --p: @yellow -150%, @pink;
  animation: background-cycle-less 5s infinite var(--bezier-chill);
}
.gradient-background-cycle-less-children {
  > div {
    --p: @yellow -150%, @pink;
    animation: background-cycle-less 5s infinite var(--bezier-chill);
  }
}
</style>