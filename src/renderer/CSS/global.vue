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
  &, * {
    -webkit-app-region: no-drag !important;
  }
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
.default-title {
  --fz: 2em;
  font-weight: 500;
  font-size: var(--fz);
}
.container-fluid {
  --px: var(--container-padding-x);
  width: 100%;
  box-sizing: border-box;
  padding-left: var(--px);
  padding-right: var(--px);
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
  box-shadow: 0.1em 0.1em 0.3em 0 rgba(0, 0, 0, 0.4), var(--outline-shadow);
  border-radius: 2em;
  color: var(--text-black);
  background: var(--text-white);
  --local-shadow-transition: var(--button-transition-time) var(--bezier-out);
  transition: transform $transition, background $transition, opacity $transition, box-shadow var(--local-shadow-transition);
  cursor: pointer;
  transform: scale(1);

  &:hover {
    font-weight: 500;
    transform: scale(1.05);
    background: var(--button-purple);
    color: var(--text-white);
  }
  &:focus:not(:active) {
    --local-shadow-transition: #{$transition};
    --outline-shadow: 0 0 0 4px var(--button-purple);
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
  @extend .window-nodrag;
  --local-text-color: var(--text-white);
  color: var(--local-text-color);
  cursor: pointer;
  margin: 0 0.3em;
  display: flex;
  align-items: center;
  background: none;
  font-size: .75em;
  text-decoration: none;
  font-weight: 500;
  padding: 0;
  outline: none;
  border: none;
  --border-color: transparent;
  border-bottom: .1em solid var(--border-color);
  opacity: 0.7;
  transition: var(--hover-n-active-transitions), border var(--ts-g);
  &:hover {
    --border-color: var(--local-text-color);
    opacity: 1;
  }
  &:active {
    opacity: 0.7;
  }
}
.sb-tag {
  --fz: .9em;
  font-size: var(--fz);
  --bg-color: var(--green-accept);
  --text-color: var(--text-white);
  padding: .1em .5em;
  background-color: var(--bg-color);
  color: var(--text-color);
  --icon-color: var(--text-color);
  display: flex;
  width: fit-content;
  box-sizing: border-box;
  > * {
    font-size: .8em;
    text-transform: lowercase;
  }
}

.setup-header {
  --height: 20vmax;
  min-height: var(--height);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 7vw;
  font-weight: bold;
  background: var(--global-grey)
}

.hidable-item {
  $t: var(--ts-g);
  transition: var(--hover-n-active-transitions), padding $t, margin $t, height $t, width $t;
  box-sizing: border-box;
  overflow: visible;
  &.hidden {
    transform: scale(.7);
    opacity: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 0 !important;
    height: 0 !important;
    pointer-events: none;
  }
}
.text-secondary {
  color: var(--text-secondary);
  --icon-color: var(--text-secondary);
}
.color-transition {
  transition: color var(--ts-g), background-color var(--ts-g);
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
  font-weight: bold;
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
.svg-icon {
  --size: 2em;
  --width: var(--size);
  --height: var(--size);
  width: var(--width);
  height: var(--height);
  display: flex;
  align-content: center;
  justify-content: center;
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