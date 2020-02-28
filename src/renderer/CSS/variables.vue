<style lang="scss">
:root {
  /* COLORS */
  --body-dark: #111;
  --global-grey: #333;
  --global-grey-secondary: #222;
  --text-white: #f5f5f5;
  --text-black: #111;
  --button-purple: #9900cc;
  --green-accept: #1dcc00;
  --green-loading: --green-accept;
  --red-cancel: #c00;
  --orange-custom: hsl(30, 100%, 60%);
  /* TRANSITIONS */
  --bezier: cubic-bezier(0, 1, 0, 1);
  --bezier-chill: cubic-bezier(0, 1, .5, 1);
  --transition-global: 0.5s var(--bezier-chill);
  --transition-global-hard: 0.5s var(--bezier);
  --home-transition: .3s cubic-bezier(.12,.82,0,.99);
  /* VARIABLES */
  --max-container-height: calc(100vh);
  --box-shadow-std: 5px 5px 15px 0 rgba(0, 0, 0, 0.4);
}
</style>