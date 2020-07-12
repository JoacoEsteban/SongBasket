<style lang="scss">
// -----------------FLEX-----------------
.df {
    display: flex;
}
.dcontents {
    display: contents;
}
.fldc {
    flex-direction: column;
}
.global-center {
    align-items: center;
    justify-content: center;
}
.jucc {
    justify-content: center;
}
.jucb {
    justify-content: space-between;
}
.juce {
    justify-content: space-evenly;
}
.jucend {
    justify-content: flex-end;
}
.alic {
    align-items: center;
}
.aliend {
    align-items: flex-end;
}
.flww {
    flex-wrap: wrap;
}

// -----------------FONT------------------
.thin {
    font-weight: 200;
}
.light {
    font-weight: lighter;
}
.regular {
    font-weight: normal;
}
.bold {
    font-weight: bold;
}
.semibold {
    font-weight: 500;
}
.uppercase {
    text-transform: uppercase;
}
.lowercase {
    text-transform: lowercase;
}

.point5-em {
    font-size: .5em;
}

.point75-em {
    font-size: .75em;
}

// -----------------MISC------------------
.d-none {
    display: none;
}

.box-shadow {
    box-shadow: var(--box-shadow-std);
}

.w100 {
    width: 100%;
}

.h100 {
    height: 100%;
}
.h-fc {
    height: 100%;
}
.lh1 {
    line-height: 1;
}
.lh1point5 {
    line-height: 1.5;
}
.ellipsis {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.half-op {
    opacity: 0.5;
}

.w-fit {
  width: fit-content;
}

.no-click {
  pointer-events: none;
}

.all-click {
  pointer-events: all;
}

// -----------------BOUNDS------------------
.p-0imp {
    padding: 0 !important;
}
.p-0 {
  padding: 0;
}

.p-1 {
  padding: .5em;
}

.p-2 {
  padding: 1em;
}

.p-3 {
  padding: 1.5em;
}

.p-4 {
  padding: 2em;
}

.px-0 {
  padding-left: 0;
  padding-right: 0;
}

.px-1 {
  padding-left: .5em;
  padding-right: .5em;
}

.px-2 {
  padding-left: 1em;
  padding-right: 1em;
}

.px-3 {
  padding-left: 1.5em;
  padding-right: 1.5em;
}

.px-4 {
  padding-left: 2em;
  padding-right: 2em;
}

.py-0 {
  padding-top: 0;
  padding-bottom: 0;
}

.py-1 {
  padding-top: .5em;
  padding-bottom: .5em;
}

.py-2 {
  padding-top: 1em;
  padding-bottom: 1em;
}

.py-3 {
  padding-top: 1.5em;
  padding-bottom: 1.5em;
}

.py-4 {
  padding-top: 2em;
  padding-bottom: 2em;
}

.pb-1 {
  padding-bottom: .5em;
}

.pb-2 {
  padding-bottom: 1em;
}

.pb-3 {
  padding-bottom: 1.5em;
}

.pb-4 {
  padding-bottom: 2em;
}

.pt-1 {
  padding-top: .5em;
}

.pt-2 {
  padding-top: 1em;
}

.pt-3 {
  padding-top: 1.5em;
}

.pt-4 {
  padding-top: 2em;
}

.pr-1 {
  padding-right: .5em;
}

.pr-2 {
  padding-right: 1em;
}

.pr-3 {
  padding-right: 1.5em;
}

.pr-4 {
  padding-right: 2em;
}

.pl-1 {
  padding-left: .5em;
}

.pl-2 {
  padding-left: 1em;
}

.pl-3 {
  padding-left: 1.5em;
}

.pl-4 {
  padding-left: 2em;
}

// .margin
.m-0 {
  margin: 0;
}

.m-1 {
  margin: .5em;
}

.m-2 {
  margin: 1em;
}

.m-3 {
  margin: 1.5em;
}

.m-4 {
  margin: 2em;
}

// --

.mb-1 {
  margin-bottom: .5em;
}

.mb-2 {
  margin-bottom: 1em;
}

.mb-3 {
  margin-bottom: 1.5em;
}

.mb-4 {
  margin-bottom: 2em;
}

*[class*='mb'] {
  &.not-last:nth-last-child(1) {
    margin-bottom: 0;
  }
}

// --

.mt-1 {
  margin-top: .5em;
}

.mt-2 {
  margin-top: 1em;
}

.mt-3 {
  margin-top: 1.5em;
}

.mt-4 {
  margin-top: 2em;
}

*[class*='mt'] {
  &.not-first:nth-child(1) {
    margin-bottom: 0;
  }
}

// --

.my-1 {
  margin-top: .5em;
  margin-bottom: .5em;
}

.my-2 {
  margin-top: 1em;
  margin-bottom: 1em;
}

.my-3 {
  margin-top: 1.5em;
  margin-bottom: 1.5em;
}

.my-4 {
  margin-top: 2em;
  margin-bottom: 2em;
}

.mr-1 {
  margin-right: .5em;
}

.mr-2 {
  margin-right: 1em;
}

.mr-3 {
  margin-right: 1.5em;
}

.mr-4 {
  margin-right: 2em;
}

.ml-1 {
  margin-left: .5em;
}

.ml-2 {
  margin-left: 1em;
}

.ml-3 {
  margin-left: 1.5em;
}

.ml-4 {
  margin-left: 2em;
}

.mx-1 {
  margin-left: .5em;
  margin-right: .5em;
}

.mx-2 {
  margin-left: 1em;
  margin-right: 1em;
}

.mx-3 {
  margin-left: 1.5em;
  margin-right: 1.5em;
}

.mx-4 {
  margin-left: 2em;
  margin-right: 2em;
}

// -----------------POSITION------------------
.abs {
    position: absolute;
}
.abs-top {
    @extend .abs;
    top: 0;
}
.abs-bot {
    @extend .abs;
    bottom: 0;
}
.abs-full {
    @extend .abs;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
}
.rel-full {
    position: relative;
    width: 100%;
    height: 100%;
}

.ovfh {
    overflow: hidden;
}

// -----------------POSITION------------------
// -----------------TEXT-POSITION------------------
.text-center {
    text-align: center;
}
.text-left {
    text-align: left;
}
.text-right {
    text-align: right;
}
// -----------------TEXT-POSITION------------------
.color-green {
    color: var(--green-accept)
}
.bg-green {
    background-color: var(--green-accept)
}
.border-green {
    border: 1px solid var(--green-accept)
}

.color-red {
    color: var(--red-cancel)
}
.bg-red {
    background-color: var(--red-cancel)
}

.border-transparent {
    border: 1px solid transparent
}
</style>


<style lang="less">
.hero {
  --size: 100%;
  @s: var(--size);
  --width: @s;
  --height: @s;
  width: var(--width);
  height: var(--height);

  object-fit: cover;
  background-size: cover;
  background-position: center;
  background-image: var(--url);
  &.tight {
    min-width: var(--width);
  }
}

.circle {
  border-radius: 50%;
}

.round-img {
  .circle();
  .hero();
  --size: 2em;
  min-width: @s;
  max-width: @s;
  min-height: @s;
  max-height: @s;

  display: flex;
  align-items: center;
  justify-content: center;
  --fallback-background: var(--text-color);
  --fallback-text: var(--body-color);
  background-color: var(--fallback-background);
  color: var(--fallback-text);
}
</style>