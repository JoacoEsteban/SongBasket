<style lang="scss">
@function tr($dur) {
  @debug $dur;
  @return calc(var(--transition-scale) * #{$dur})
}
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
  --transition-scale: 1;
  --bezier: cubic-bezier(0, 1, 0, 1);
  --bezier-chill: cubic-bezier(0, 1, .5, 1);
  --bezier-chill-2: cubic-bezier(0.12, 0.82, 0, 1);;
  --bezier-chill-inverted: cubic-bezier(1, 0, 1, .5);
  --bezier-out: cubic-bezier(.75, 0, 1, .5);
  --bezier-symmetric: cubic-bezier(.1, .5, .9, .5);

  --global-transition-time: #{tr(.5s)};
  --ts-g: var(--global-transition-time) var(--bezier-chill);
  --ts-g-hard: var(--global-transition-time) var(--bezier);
  --ts-g-symmetric: var(--global-transition-time) var(--bezier-symmetric);
  --home-transition: #{tr(.3s)} var(--bezier-chill);
  --top-bar-slider-transition: #{tr(1s)} cubic-bezier(.2, 1, .5, 1);

  --card-hover-transition: #{tr(1s)} var(--bezier-chill-2);
  --card-hover-transition-fast: #{tr(.5s)} var(--bezier-chill-2);

  --body-colors-transition: #{tr(1s)} var(--bezier-chill);

  --button-transition: #{tr(0.3s)} var(--bezier-chill);
  --banner-background-transition: width #{tr(1s)} var(--bezier-chill), opacity #{tr(.2s)} var(--bezier-chill);

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