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

.ellipsis {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

// -----------------BOUNDS------------------
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

// -----------------POSITION------------------
.abs {
    position: absolute;
}
.abs-top {
    position: absolute;
    top: 0;
}
.abs-full {
    position: absolute;
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
.color-green {
    color: var(--green-accept)
}
.bg-green {
    background-color: var(--green-accept)
}
</style>