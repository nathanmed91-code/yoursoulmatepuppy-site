import{a as m,d as c}from"./chunk-5SAUKAHN.js";import{e as l}from"./chunk-RVK7AD5U.js";import{d,f as t,g as a,q as n}from"./chunk-LG3XR24B.js";import"./chunk-IHRIUEAN.js";async function f(){let r=d("[data-parents]");r.innerHTML='<div class="grid parent-feature"><div class="parent-feature__media frame frame--4x5 skeleton"></div></div>';try{let s=await n("parents",{sort:[{field:"sortOrder"}],limit:50});if(!s.items.length){r.innerHTML='<div class="empty"><h3>Meet the parents soon.</h3><p class="muted">Photos and stories of our moms and dads are on their way.</p></div>';return}r.innerHTML=s.items.map(e=>{let o=(p,i)=>a(i)?`<div><dt>${p}</dt><dd>${t(i)}</dd></div>`:"";return`<article class="grid parent-feature" id="${t(e.slug)}">
  <div class="parent-feature__media frame frame--4x5 reveal-img">${m(e.photo,`${a(e.name)}, one of our ${a(e.role).toLowerCase()==="dad"?"dads":"moms"}`,"(max-width: 880px) 100vw, 50vw",1.25)}</div>
  <div class="parent-feature__text">
    <p class="eyebrow">${t([e.role,e.breed].filter(Boolean).join(" · "))}</p>
    <h2 class="reveal" style="font-size:var(--step-4);margin-bottom:20px">${t(e.name)}</h2>
    ${a(e.temperament)?`<p class="lede reveal" data-delay="1">${t(e.temperament)}</p>`:""}
    <dl class="facts">${o("Weight",e.weight)}${o("Coat",e.coat)}</dl>
    ${a(e.bio)?`<p class="muted">${t(e.bio)}</p>`:""}
    ${c(e)}
  </div>
</article>`}).join(""),l(r),location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView()}catch{r.innerHTML=`<div class="empty"><h3>The parents couldn't load.</h3><p class="muted">Please refresh the page.</p></div>`}}export{f as default};
