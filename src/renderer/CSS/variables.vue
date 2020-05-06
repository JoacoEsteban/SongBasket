<style lang="scss">
:root {
  /* COLORS */
  --body-dark: #000;
  --global-grey: #333;
  --global-grey-secondary: #222;
  --text-white: #f5f5f5;
  --text-black: #111;
  --button-purple: #9900cc;
  --green-accept: #1dcc00;
  --green-loading: --green-accept;
  --red-cancel: #c00;
  --custom-selection-color: hsl(30, 100%, 60%);
  --orange-warning: hsl(15, 100%, 50%);
  /* TRANSITIONS */
  --bezier: cubic-bezier(0, 1, 0, 1);
  --bezier-chill: cubic-bezier(0, 1, .5, 1);
  --bezier-chill-inverted: cubic-bezier(1, 0, 1, .5);
  --bezier-out: cubic-bezier(.75, 0, 1, .5);
  --bezier-symmetric: cubic-bezier(.1, .5, .9, .5);
  --ts-g: 0.5s var(--bezier-chill);
  --ts-g-hard: 0.5s var(--bezier);
  --ts-g-symmetric: 0.5s var(--bezier-symmetric);
  // --home-transition: .3s cubic-bezier(.12,.82,0,.99);
  --home-transition: .3s var(--bezier-chill);
  --top-bar-slider-transition: 1s cubic-bezier(.2, 1, .5, 1);
  /* VARIABLES */
  --body-color: var(--body-dark);
  --body-color-disconnected: #903;
  --max-container-height: calc(100vh);
  --box-shadow-std: 5px 5px 15px 0 rgba(0, 0, 0, 0.4);
  --container-padding-x: 1.25em;
  --scroll-opacity: 1;
  --scroll-opacity-inverted: calc(1 - var(--scroll-opacity));
  --tb-title-height: 1em;
}
</style>