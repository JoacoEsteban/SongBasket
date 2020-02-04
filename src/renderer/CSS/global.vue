<style lang="scss">
html{
    font-size: 30px;
    height: var(--max-container-height);
    overflow: hidden;
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
background: #c4c4c4;
transition: background-color
/* border-radius: 1em; */
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
background: #fff;
}


body{
    background: var(--body-dark);
    color: var(--text-white);
    font-family: 'Poppins regular';
    font-size: 1em;
    margin: 0;
    user-select: none;
    overflow: hidden;
    height: 100%;
}
body:hover{
    cursor: default;
}
.button{
    outline: none;
    font-family: 'Poppins semibold';
    font-size: 0.7em;
    padding: 1em 1.5em;
    text-align: center;
    // height: 2em;
    /* width: 10em; */
    border: none;
    box-shadow: .1em .1em .3em 0 rgba(0, 0, 0, 0.4);
    border-radius: 2em;
    color: var(--text-black);
    background: var(--text-white);
    transition: transform .15s ease, background .2s ease;
    cursor: pointer;

}
.button:hover{
    font-family: 'Poppins medium';
    transform: scale(1.05);
    background: var(--button-purple);
    color: var(--text-white);
}
.button:active{
    font-family: 'Poppins medium';
    transform: scale(.98);
    background: var(--button-purple);
    color: var(--text-white);
}
.button.accept {
    background-color: var(--green-accept);
    color: var(--text-white);
    font-family: 'Poppins medium';
}
.button.cancel {
    background-color: var(--red-cancel);
    color: var(--text-white);
    font-family: 'Poppins medium';
}
.button.slim {
    padding: .2em 2em;
}
.button.disabled {
    background-color: #111;
    color: var(--text-white);
    pointer-events: none;
}
.dev-border-w{
    border: 1px solid white;
}
.dev-border-b{
    border: 1px solid black;
}

.link-button {
    color: var(--text-white);
    cursor: pointer;
    text-decoration: underline;
    margin: 0 .3em;
}

.icon {
    width: 1em;
    height: 1em;
    transition: transform .1s ease;
}
.icon:hover {
    transform: scale(1.25);
    cursor: pointer;
}
.std-input {
    display: block;
    margin: 0;
    font-size: 1em;
    outline: none;
    width: 100%;
    font-family: 'Poppins black';
    text-align: center;
    border: none;
    color: white;
    background: none;
    transition: transform .15s ease, background .2s ease;      
}
.input-light {
    display: block;
    margin: 0;
    font-size: 1em;
    outline: none;
    width: 100%;
    font-family: 'Poppins Light';
    text-align: left;
    border: none;
    color: white;
    background: none;
    transition: transform .15s ease, background .2s ease;
    padding: .25em;
}

// $factor: 7;
// $yellow: #FFE500;
// $pink: #FF00FF;

// @keyframes background-cycle-sass {
//     $i: 0;
//     @while $i <=360/$factor {
//         $keyframeSel: ceil(percentage($i*$factor/360));
//         $degs: $i*$factor*1deg;
        
//         #{$keyframeSel} {
//             background: linear-gradient($degs #{$yellow -150%, $pink});
//             filter: hue-rotate($degs*2)
//         }
//         $i: $i + 1;
//     }
// }
// .gradient-background-cycle-sass {
//     --p: #{$yellow -150%, $pink};
//     animation: background-cycle-sass 5s infinite var(--bezier-chill);
// }


</style>

<style lang="less">

@factor: 1;
@yellow: #FFE500;
@pink: #FF00FF;

.loop (@i: 0) when (@i <=360/@factor) {
    @keyframeSel: ceil(percentage(@i*@factor/360));
@degs: @i*@factor*1deg;

@{keyframeSel} {
    background: linear-gradient(@degs; var(--p));
    filter: hue-rotate(@degs*2)
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

</style>