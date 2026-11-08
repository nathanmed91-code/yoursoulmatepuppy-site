// Builds the static site into ./site: one HTML file per page from a shared layout, plus the
// esbuild bundle (split so the Three.js hero loads only where and when it is needed).
import { build } from "esbuild";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const SITE = "Your Soulmate Puppy";
const NAV = [
  ["puppies.html", "Puppies"],
  ["parents.html", "Parents"],
  ["home.html", "Our Home"],
  ["journey.html", "The Journey"],
  ["faq.html", "FAQ"],
];
const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,0..100,0..1;1,9..144,300..600,0..100,0..1&family=Instrument+Sans:wght@400;500;600&display=swap";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout({ file, page, title, description, body }) {
  const nav = NAV.map(([href, label]) => `<a href="${href}"${href === file ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const drawer = [["index.html", "Home"], ...NAV, ["apply.html", "Free quote"]]
    .map(([href, label]) => `<li><a href="${href}"${href === file ? ' aria-current="page"' : ""}>${label}</a></li>`)
    .join("");
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#f6f1e9">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://static.wixstatic.com/media/225594_03a5bd794a824fc9ab344682614e41b1~mv2.png/v1/fill/w_1200,h_630,al_c,q_85/225594_03a5bd794a824fc9ab344682614e41b1~mv2.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f6f1e9'/%3E%3Ctext x='32' y='45' text-anchor='middle' font-family='Georgia,serif' font-style='italic' font-size='40' fill='%239a4a3f'%3Es%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.wixapis.com" crossorigin>
<link rel="preconnect" href="https://static.wixstatic.com">
<link id="font-css" rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="css/site.css">
<script>document.documentElement.classList.remove("no-js");try{var t=JSON.parse(localStorage.getItem("ysp-theme")||"null");if(t){var r=document.documentElement.style;for(var k in t.vars)r.setProperty(k,t.vars[k]);if(t.fontHref)document.getElementById("font-css").href=t.fontHref;}}catch(e){}</script>
<script type="module" src="js/main.js"></script>
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "4383c5ff5aa44ebebab56fc9ff6ce638"}'></script><!-- End Cloudflare Web Analytics -->
</head>
<body data-page="${page}">
<a class="skip-link" href="#main">Skip to content</a>
<div class="announce" data-slot="announcement" hidden></div>
<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="wordmark" href="index.html" aria-label="${SITE}, home">Your <em>Soulmate</em> Puppy</a>
    <nav class="nav" aria-label="Main">${nav}<a class="btn btn--small" href="apply.html"${file === "apply.html" ? ' aria-current="page"' : ""}>Free quote</a></nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="drawer"><span class="menu-toggle__label">Menu</span><span class="menu-toggle__bars" aria-hidden="true"></span></button>
  </div>
</header>
<div class="drawer" id="drawer" aria-label="Menu">
  <nav aria-label="Mobile"><ul>${drawer}</ul></nav>
  <div class="drawer__foot"><a data-slot="phone-link" href="tel:4804470844">480-447-0844</a><a data-slot="email-link" href="mailto:yoursoulmatepuppy@gmail.com">yoursoulmatepuppy@gmail.com</a></div>
</div>
<main id="main">
${body}
</main>
<section class="section section--charcoal" aria-labelledby="signup-title">
  <div class="wrap grid signup">
    <h2 id="signup-title" class="reveal">Hear about <span class="italic">new litters</span> first.</h2>
    <div class="signup__form reveal" data-delay="1">
      <p class="muted">A short note about once a month: new litters, available puppies and news from our home. Unsubscribe any time.</p>
      <div data-form="newsletter"></div>
    </div>
  </div>
</section>
<footer class="site-footer">
  <div class="wrap">
    <p class="footer__big">Raised at home.<br><em class="italic">Loved for life.</em></p>
    <div class="grid footer__cols">
      <div class="footer__col"><h2>Visit</h2><span data-slot="service-area">Gilbert, Arizona</span><span class="muted">Visits by appointment</span></div>
      <div class="footer__col"><h2>Talk to Elia</h2><a data-slot="phone-link" href="tel:4804470844">480-447-0844</a><a data-slot="email-link" href="mailto:yoursoulmatepuppy@gmail.com">yoursoulmatepuppy@gmail.com</a></div>
      <div class="footer__col"><h2>Explore</h2><a href="puppies.html">Puppies</a><a href="parents.html">Parents</a><a href="families.html">Puppies in new homes</a><a href="faq.html">Questions</a><a href="apply.html">Free quote</a></div>
      <div class="footer__col"><h2>Follow</h2><a data-slot="instagram" href="https://instagram.com/yoursoulmatepuppy" rel="noopener">Instagram</a><a data-slot="facebook" href="https://www.facebook.com/getmysoulmate" rel="noopener">Facebook</a><a data-slot="youtube" href="https://www.youtube.com/channel/UCKvwwQtctNY3z3TKfxQQXmg" rel="noopener">YouTube</a></div>
    </div>
    <div class="footer__legal"><span>&copy; <span data-slot="year">2026</span> Your Soulmate Puppy</span><span><a href="privacy.html">Privacy</a> &nbsp;·&nbsp; <a href="terms.html">Terms</a> &nbsp;·&nbsp; <a href="journey.html#deposit">Deposit &amp; refund policy</a></span></div>
  </div>
</footer>
</body>
</html>
`;
}

const arrow = '<span class="arrow" aria-hidden="true">&rarr;</span>';

const pages = [
  {
    file: "index.html", page: "home",
    title: "Your Soulmate Puppy | Home-raised Yorkies, Yorkipoos and Morkies in Gilbert, AZ",
    description: "A small home breeder in Gilbert, Arizona raising Yorkies, Yorkipoos and Morkies in our family home. See available puppies and ask for a free quote.",
    body: `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap">
    <p class="eyebrow" data-slot="heroEyebrow">Home-raised Yorkies, Yorkipoos and Morkies in Gilbert, Arizona</p>
    <div class="grid hero__top">
      <h1 id="hero-title" class="hero__title" data-slot="heroHeadline" data-split>Raised in our home, one small litter at a time.</h1>
      <div class="hero__aside">
        <p class="lede" data-slot="heroSubhead">The puppies are a part of my family before they become a part of yours.</p>
        <div class="hero__ctas"><a class="btn" href="puppies.html">Meet the puppies ${arrow}</a><a class="btn btn--ghost" href="home.html">Our approach</a></div>
      </div>
    </div>
  </div>
  <div class="wrap">
    <div class="hero__stage" data-hero>
      <img data-slot-img="heroImage" alt="A tiny puppy asleep on a linen throw in soft morning window light" width="1376" height="768" fetchpriority="high" src="https://static.wixstatic.com/media/225594_03a5bd794a824fc9ab344682614e41b1~mv2.png/v1/fill/w_1376,h_768,al_c,q_85/225594_03a5bd794a824fc9ab344682614e41b1~mv2.png">
      <span class="hero__scroll" aria-hidden="true"></span>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="intro-title">
  <div class="wrap grid">
    <h2 id="intro-title" class="intro__statement reveal" data-slot="introHeadline">A small breeder, on purpose.</h2>
    <div class="intro__body">
      <p class="lede reveal" data-delay="1" data-slot="introBody">I raise a few litters a year in my own home. Every puppy is held, handled and known by name long before going home, and every family is someone I have talked to myself.</p>
      <p class="intro__sig reveal" data-delay="2">— <span data-slot="ownerName">Elia</span></p>
    </div>
    <figure class="intro__figure frame frame--3x4 reveal-img" style="margin-inline:0"><img data-slot-img="ownerPortrait" alt="Elia's hands holding a young puppy" loading="lazy"></figure>
  </div>
</section>

<section class="section section--tight" aria-labelledby="litter-title">
  <div class="wrap">
    <div class="collection-head">
      <div><p class="eyebrow">The current litter</p><h2 id="litter-title" class="reveal">Meet the puppies.</h2></div>
      <a class="link-arrow" href="puppies.html">See every puppy ${arrow}</a>
    </div>
    <div class="collection collection--feature" data-featured aria-live="polite"></div>
  </div>
</section>

<section class="section" aria-labelledby="weeks-title">
  <div class="wrap">
    <p class="eyebrow">The first eight weeks</p>
    <h2 id="weeks-title" class="reveal" style="max-width:14ch;margin-bottom:clamp(40px,6vw,96px)">From the day they're born to the day they go home.</h2>
    <div class="grid weeks" data-weeks>
      <div class="weeks__media" aria-hidden="true"><div class="weeks__stack"></div><div class="weeks__progress"></div></div>
      <ol class="weeks__list"></ol>
    </div>
  </div>
</section>

<section class="band" aria-label="From Elia">
  <div class="band__img"><img data-slot-img="careImage" alt="" loading="lazy"></div>
  <div class="wrap band__content">
    <blockquote class="reveal"><p style="margin:0" data-slot="heroSubhead">The puppies are a part of my family before they become a part of yours.</p></blockquote>
    <cite class="reveal" data-delay="1">— <span data-slot="ownerName">Elia</span>, Gilbert, Arizona</cite>
  </div>
</section>

<section class="section" aria-labelledby="breeds-title">
  <div class="wrap">
    <div class="collection-head"><div><p class="eyebrow">Meet the breeds</p><h2 id="breeds-title" class="reveal">Small dogs, big hearts.</h2></div><p class="muted" style="max-width:36ch;margin:0">Typical adult weights. Every dog is an individual, and I'm happy to talk through what to expect from a specific litter.</p></div>
    <div class="breeds" data-breeds></div>
  </div>
</section>

<section class="section section--cream" data-voices-section hidden aria-labelledby="voices-title">
  <div class="wrap">
    <p class="eyebrow">Happy families</p>
    <h2 id="voices-title" class="reveal" style="margin-bottom:clamp(40px,6vw,88px)">In their words.</h2>
    <div class="voices" data-voices></div>
  </div>
</section>

<section class="section" aria-labelledby="journey-title">
  <div class="wrap">
    <div class="collection-head"><div><p class="eyebrow">The journey home</p><h2 id="journey-title" class="reveal">How it works.</h2></div><a class="btn" href="apply.html">Get a free quote ${arrow}</a></div>
    <ol class="journey" data-journey></ol>
  </div>
</section>`,
  },
  {
    file: "puppies.html", page: "puppies",
    title: "Available puppies | Your Soulmate Puppy",
    description: "Yorkie, Yorkipoo and Morkie puppies raised in our home in Gilbert, Arizona. See who is available, reserved, or already home.",
    body: `
<header class="page-head">
  <div class="wrap grid page-head--split">
    <h1 class="reveal">The puppies.</h1>
    <p class="lede reveal" data-delay="1">Each one raised in our home and known by name. Availability is updated by me as families are matched.</p>
  </div>
</header>
<section class="section section--tight" style="padding-top:0" aria-label="Puppies">
  <div class="wrap">
    <form class="filters" data-filters aria-label="Filter puppies" onsubmit="return false">
      <fieldset><legend>Breed</legend><div class="chips" data-chips="breed"></div></fieldset>
      <fieldset><legend>Sex</legend><div class="chips" data-chips="sex"></div></fieldset>
      <fieldset><legend>Size</legend><div class="chips" data-chips="size"></div></fieldset>
      <fieldset><legend>Availability</legend><div class="chips" data-chips="status"></div></fieldset>
      <p class="filters__count" data-count aria-live="polite"></p>
    </form>
    <div class="collection collection--grid" data-collection aria-live="polite"></div>
    <div style="margin-top:48px;text-align:center" data-more hidden><button class="btn btn--ghost" type="button">Show more puppies</button></div>
  </div>
</section>`,
  },
  {
    file: "puppy.html", page: "puppy",
    title: "Puppy | Your Soulmate Puppy",
    description: "Meet one of our home-raised puppies.",
    body: `<div data-profile aria-live="polite"><div class="wrap section"><div class="grid"><div class="frame frame--4x5 skeleton" style="grid-column:1/span 7"></div></div></div></div>`,
  },
  {
    file: "parents.html", page: "parents",
    title: "The parents | Your Soulmate Puppy",
    description: "Meet the moms and dads of our puppies, chosen for temperament and health.",
    body: `
<header class="page-head">
  <div class="wrap grid page-head--split">
    <h1 class="reveal">The moms and dads.</h1>
    <p class="lede reveal" data-delay="1">The moms are my babies. Every dad is chosen for a great temperament and good health.</p>
  </div>
</header>
<section class="section section--tight" style="padding-top:0"><div class="wrap" data-parents aria-live="polite"></div></section>`,
  },
  {
    file: "home.html", page: "care",
    title: "Our home and care | Your Soulmate Puppy",
    description: "How our puppies are raised: in our family home, in play pens not cages, vet-checked, socialized and puppy-pad trained.",
    body: `
<header class="page-head">
  <div class="wrap grid page-head--split">
    <h1 class="reveal">Our home, and how we care.</h1>
    <p class="lede reveal" data-delay="1">With me, every puppy is raised as a family pet. Here's what that means, day to day.</p>
  </div>
</header>
<section class="section section--tight" style="padding-top:0" aria-labelledby="story-title">
  <div class="wrap grid" style="row-gap:40px;align-items:start">
    <figure class="frame frame--4x5 reveal-img" style="grid-column:1/span 5;margin:0"><img data-slot-img="ownerPortrait" alt="Elia holding a young puppy" loading="lazy"></figure>
    <div style="grid-column:7/span 6" class="care-story">
      <p class="eyebrow">Meet <span data-slot="ownerName">Elia</span></p>
      <h2 id="story-title" class="reveal" style="font-size:var(--step-3);margin-bottom:28px">The first person every puppy meets.</h2>
      <div class="prose reveal" data-delay="1" data-slot-html="ownerStory"></div>
    </div>
  </div>
</section>
<section class="section section--cream" aria-labelledby="care-title">
  <div class="wrap">
    <p class="eyebrow">Raised with care</p>
    <h2 id="care-title" class="reveal" style="max-width:14ch;margin-bottom:clamp(40px,6vw,80px)">What every puppy gets.</h2>
    <div class="health">
      <div class="reveal"><h3>A real home</h3><p class="muted">Puppies live with our family in soft play pens, never cages, and hear the everyday sounds of a busy household.</p></div>
      <div class="reveal" data-delay="1"><h3>Vet care</h3><p class="muted">Every puppy and parent is seen by a veterinarian we trust. Vaccinations and treatments go into the records that come home with your puppy.</p></div>
      <div class="reveal" data-delay="2"><h3>Good habits</h3><p class="muted">Gentle handling, socialization and puppy-pad training from the start. Most puppies are close to fully pad trained by going-home day.</p></div>
    </div>
  </div>
</section>
<section class="section" aria-labelledby="breeds-title">
  <div class="wrap">
    <div class="collection-head"><div><p class="eyebrow">Meet the breeds</p><h2 id="breeds-title" class="reveal">Which one is right for you?</h2></div><p class="muted" style="max-width:36ch;margin:0">Typical adult weights. Every dog is an individual.</p></div>
    <div class="breeds" data-breeds></div>
  </div>
</section>`,
  },
  {
    file: "journey.html", page: "journey",
    title: "The journey home | Your Soulmate Puppy",
    description: "How to bring home a puppy from Your Soulmate Puppy: ask for a free quote, talk with Elia, reserve, and going-home day. Plus answers to common questions.",
    body: `
<header class="page-head">
  <div class="wrap grid page-head--split">
    <h1 class="reveal">The journey home.</h1>
    <p class="lede reveal" data-delay="1">No pressure and no rush. Here's what happens between your first message and your puppy's first night at home.</p>
  </div>
</header>
<section class="section section--tight" style="padding-top:0" aria-label="Steps"><div class="wrap"><ol class="journey journey--vertical" data-journey></ol><p style="margin-top:40px"><a class="btn" href="apply.html">Get a free quote ${arrow}</a></p></div></section>
<section class="section section--cream" aria-labelledby="faq-title"><div class="wrap"><p class="eyebrow">Questions</p><h2 id="faq-title" class="reveal" style="margin-bottom:48px">Good to know.</h2><div class="faq" data-faq></div><p style="margin-top:40px"><a class="link-arrow" href="faq.html">See every question ${arrow}</a></p></div></section>
<section class="section" id="deposit" aria-labelledby="deposit-title"><div class="wrap grid"><div style="grid-column:1/span 4"><p class="eyebrow">Policies</p><h2 id="deposit-title" style="font-size:var(--step-3)">Deposits and refunds.</h2></div><div class="prose" style="grid-column:6/span 7" data-slot-html="depositPolicy"></div></div></section>`,
  },
  {
    file: "faq.html", page: "faq",
    title: "Questions and answers | Your Soulmate Puppy",
    description: "Answers to common questions about getting a Yorkie, Yorkipoo or Morkie puppy from Your Soulmate Puppy in Gilbert, Arizona: quotes, reserving, vet care, visits and going home.",
    body: `
<header class="page-head">
  <div class="wrap grid page-head--split">
    <h1 class="reveal">Questions, answered.</h1>
    <p class="lede reveal" data-delay="1">The things families ask me most. If yours isn't here, call or text me. I'm always happy to talk.</p>
  </div>
</header>
<section class="section section--tight" style="padding-top:0" aria-label="Questions and answers">
  <div class="wrap grid faq-page">
    <nav class="faq-page__topics" aria-label="Topics" data-faq-topics hidden></nav>
    <div class="faq-page__list" data-faq-page aria-live="polite"><div class="faq"><div class="skeleton" style="height:320px"></div></div></div>
  </div>
</section>
<section class="section section--cream" aria-labelledby="ask-title">
  <div class="wrap grid faq-ask">
    <h2 id="ask-title" class="reveal">Still wondering about <span class="italic">something?</span></h2>
    <div class="faq-ask__body reveal" data-delay="1">
      <p class="lede">Ask me anything. I read every message myself.</p>
      <p class="faq-ask__contact"><a data-slot="phone-link" href="tel:4804470844">480-447-0844</a><a data-slot="email-link" href="mailto:yoursoulmatepuppy@gmail.com">yoursoulmatepuppy@gmail.com</a></p>
      <div class="hero__ctas"><a class="btn" href="apply.html">Get a free quote ${arrow}</a><a class="btn btn--ghost" href="puppies.html">Meet the puppies</a></div>
    </div>
  </div>
</section>`,
  },
  {
    file: "apply.html", page: "apply",
    title: "Get a free quote | Your Soulmate Puppy",
    description: "Tell Elia about your home and the puppy you're hoping for, and she'll send a free, no-obligation quote.",
    body: `
<section class="section" aria-labelledby="apply-title">
  <div class="wrap grid">
    <div class="form-intro">
      <p class="eyebrow">Free quote</p>
      <h1 id="apply-title" style="font-size:var(--step-4)" class="reveal">Ask for a free quote.</h1>
      <p class="lede reveal" data-delay="1" style="margin-top:24px">Tell me about your home and the puppy you're hoping for. I read every request myself and reply with a free quote by phone or text.</p>
      <p class="muted reveal" data-delay="2" data-puppy-note hidden></p>
      <div class="notice reveal" data-delay="2" style="margin-top:28px"><strong>A quote is free and there's no obligation.</strong> Asking doesn't reserve a puppy. A puppy is reserved only after we've talked and you've agreed to the deposit terms.</div>
    </div>
    <div class="form-shell"><div data-form="application"></div></div>
  </div>
</section>`,
  },
  {
    file: "families.html", page: "families",
    title: "Puppies in their new homes | Your Soulmate Puppy",
    description: "Photos and stories from families who brought home a Your Soulmate Puppy.",
    body: `
<header class="page-head"><div class="wrap grid page-head--split"><h1 class="reveal">Puppies in their new homes.</h1><p class="lede reveal" data-delay="1">And off they go, to fill the lives of the people who came to fall in love with them.</p></div></header>
<section class="section section--tight" style="padding-top:0"><div class="wrap"><div class="collection collection--grid" data-families aria-live="polite"></div><div class="voices" data-voices style="margin-top:96px"></div></div></section>`,
  },
  {
    file: "privacy.html", page: "legal",
    title: "Privacy notice | Your Soulmate Puppy",
    description: "How Your Soulmate Puppy collects and uses personal information.",
    body: `
<header class="page-head"><div class="wrap"><h1 class="reveal" style="font-size:var(--step-4)">Privacy notice.</h1><p class="muted" style="margin-top:20px">Last updated October 24, 2026</p></div></header>
<section class="section section--tight" style="padding-top:0"><div class="wrap prose">
<p>This notice explains what information Your Soulmate Puppy ("we", "I") collects through this website and how it is used. Questions? Email <a data-slot="email-link" href="mailto:yoursoulmatepuppy@gmail.com">yoursoulmatepuppy@gmail.com</a>.</p>
<h2>What we collect</h2>
<ul><li><strong>Applications and messages:</strong> your name, email, phone number, and what you tell us about your home and the puppy you're interested in.</li><li><strong>Newsletter signups:</strong> your first name and email, only if you choose to sign up.</li><li><strong>Technical data:</strong> Wix, which provides the site's content and forms, stores a small token in your browser so the site can load content. Fonts are served by Google Fonts, which receives your IP address when the page loads. We count visits with Cloudflare Web Analytics, which records the pages viewed, the site you came from and your general device type, without cookies and without tracking you across other sites. We don't run advertising trackers.</li></ul>
<h2>How we use it</h2>
<p>To respond to your application or questions, to arrange visits and pickup, and, if you opted in, to send our monthly email. We never sell your information.</p>
<h2>Who processes it</h2>
<p>Forms and email are handled by Wix.com, which stores submissions on our behalf. See <a href="https://www.wix.com/about/privacy" rel="noopener">Wix's privacy policy</a>. The website itself is hosted by GitHub Pages, which keeps basic server logs (such as IP addresses) for security, and visit counts are handled by Cloudflare. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub's privacy statement</a> and <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare's privacy policy</a>.</p>
<h2>Your choices</h2>
<p>Every marketing email has an unsubscribe link. You can also ask us to see, correct or delete your information at any time by emailing us.</p>
<h2>Children</h2>
<p>This site is not directed at children under 13, and we don't knowingly collect their information.</p>
<h2>Changes</h2>
<p>If this notice changes, we'll update the date at the top of this page.</p>
</div></section>`,
  },
  {
    file: "terms.html", page: "legal",
    title: "Terms | Your Soulmate Puppy",
    description: "Terms of use for the Your Soulmate Puppy website.",
    body: `
<header class="page-head"><div class="wrap"><h1 class="reveal" style="font-size:var(--step-4)">Terms of use.</h1><p class="muted" style="margin-top:20px">Last updated October 24, 2026</p></div></header>
<section class="section section--tight" style="padding-top:0"><div class="wrap prose">
<p>By using this website you agree to these terms.</p>
<h2>Information on this site</h2>
<p>Puppy listings, photos and availability are provided in good faith and may change at any time. A listing is not an offer of sale. Requesting a quote or submitting an application does not reserve a puppy or guarantee approval or availability. Quotes are free and carry no obligation.</p>
<h2>Reservations and deposits</h2>
<p>A puppy is reserved only after we've spoken and you've agreed in writing to our <a href="journey.html#deposit">deposit and refund policy</a>.</p>
<h2>Content</h2>
<p>Photos and text on this site belong to Your Soulmate Puppy or are used with permission. Please ask before reusing them.</p>
<h2>Contact</h2>
<p>Questions about these terms: <a data-slot="email-link" href="mailto:yoursoulmatepuppy@gmail.com">yoursoulmatepuppy@gmail.com</a>.</p>
</div></section>`,
  },
  {
    file: "404.html", page: "legal",
    title: "Page not found | Your Soulmate Puppy",
    description: "This page could not be found.",
    body: `<section class="section"><div class="wrap"><h1 style="font-size:var(--step-4)">This page wandered off.</h1><p class="lede" style="margin-top:24px">Try the <a href="puppies.html">puppies</a> or head <a href="index.html">home</a>.</p></div></section>`,
  },
];

rmSync("site/js", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
for (const p of pages) writeFileSync(`site/${p.file}`, layout(p));

await build({
  entryPoints: ["src/app/main.ts"],
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: "site/js",
  minify: true,
  sourcemap: false,
  target: ["es2020", "safari15"],
  chunkNames: "chunks/[name]-[hash]",
  legalComments: "none",
  charset: "utf8",
  // Three.js comes from a CDN at runtime (it is only fetched for the 3D hero), and the address
  // table is trimmed, so the bundle stays small enough to upload in one go.
  external: ["https://cdn.jsdelivr.net/*"],
  plugins: [{
    name: "address-lite",
    setup(b) {
      b.onResolve({ filter: /address-templates\.generated$/ }, (args) =>
        args.importer.endsWith("address-lite.ts") ? undefined : { path: new URL("./src/app/address-lite.ts", import.meta.url).pathname });
    },
  }],
  logLevel: "info",
});
await build({ entryPoints: ["src/site.css"], outfile: "site/css/site.css", minify: true, bundle: true, target: ["safari15", "chrome100"], logLevel: "warning" });
// Version the entry files so phones don't keep an old copy after a deploy (chunks are already hashed).
{
  const { readFileSync } = await import("node:fs");
  const { createHash } = await import("node:crypto");
  const v = (f) => createHash("sha1").update(readFileSync(f)).digest("hex").slice(0, 8);
  const js = v("site/js/main.js"), css = v("site/css/site.css");
  for (const p of pages) {
    const f = `site/${p.file}`;
    writeFileSync(f, readFileSync(f, "utf8").replace('href="css/site.css"', `href="css/site.css?v=${css}"`).replace('src="js/main.js"', `src="js/main.js?v=${js}"`));
  }
}
console.log("built", pages.length, "pages");
