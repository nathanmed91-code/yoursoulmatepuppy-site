import{c as v,d as m,e as d,f as e,g as i,k as f}from"./chunk-UHZTHRDK.js";function g(s,t,a,l,o=""){let r=v(s,a,l,[360,540,720,960,1200]);return r.src?`<img src="${e(r.src)}" srcset="${e(r.srcset)}" sizes="${e(r.sizes)}" alt="${e(t)}" loading="lazy" decoding="async"${o}>`:""}var x={Available:"Available",Reserved:"Reserved",Home:"Gone home"};function b(s,t=""){let a=i(s)||"Available";return`<span class="status status--${e(a.toLowerCase())} ${t}">${e(x[a]??a)}</span>`}var w=s=>s.isSample?'<span class="sample-flag">Sample listing</span>':"";function L(s,t="(max-width: 880px) 100vw, 40vw"){let a=i(s.name)||"Puppy",l=[i(s.breed),i(s.sex),f(s.birthDate)].filter(Boolean).join(" \xB7 "),o=`${a}, a ${[i(s.coat).toLowerCase(),i(s.breed)].filter(Boolean).join(" ")} puppy`,r=s.photo?g(s.photo,o,t,1.25):'<span class="frame--placeholder">Photo coming soon</span>';return`<a class="pup reveal" href="puppy.html?slug=${encodeURIComponent(i(s.slug))}">
  <div class="frame">${r}</div>
  <div class="pup__tags">${b(s.status,"chip-on-photo")}${w(s)}</div>
  <div class="pup__meta"><span class="pup__name">${e(a)}</span><span class="pup__facts">${e(l)}</span></div>
  ${i(s.summary)?`<p class="pup__summary">${e(s.summary)}</p>`:""}
</a>`}var _=15;function k(s){let t=Number(s.adultWeightMinLb)||0,a=Number(s.adultWeightMaxLb)||0,l=a>0?`<div class="scale" aria-hidden="true">
    <div class="scale__track"><span class="scale__range" style="left:${t/_*100}%;width:${(a-t)/_*100}%"></span></div>
    <div class="scale__ticks"><span>0</span><span>5</span><span>10</span><span>15 lb</span></div>
  </div>
  <p class="scale__label">Typically ${t}\u2013${a} lb as an adult</p>`:"",o=(r,p)=>i(p)?`<div><dt>${r}</dt><dd>${e(p)}</dd></div>`:"";return`<article class="breed">
  <h3>${e(s.name)}</h3>
  ${i(s.summary)?`<p class="muted">${e(s.summary)}</p>`:""}
  ${l}
  <dl>${o("Temperament",s.temperament)}${o("Grooming",s.grooming)}${o("Exercise",s.exercise)}${o("A good fit for",s.goodFor)}</dl>
</article>`}var A=(s,t)=>`<li class="reveal" data-delay="${t%3}"><div><h3>${e(s.title)}</h3><p>${e(s.body)}</p></div></li>`,M=s=>`<details><summary>${e(s.question)}</summary><p>${e(s.answer)}</p></details>`;function T(s){let t=[i(s.name),i(s.location)].filter(Boolean).join(", "),a=i(s.puppyName)?` \xB7 ${e(s.puppyName)}'s family`:"";return`<figure class="voice reveal"><blockquote>\u201C${e(s.quote)}\u201D</blockquote><figcaption>${e(t)}${a}</figcaption></figure>`}function E(s,t){let a=m(".weeks__stack",s),l=m(".weeks__progress",s),o=m(".weeks__list",s);if(!t.length){s.closest("section")?.setAttribute("hidden","");return}a.innerHTML=t.map((n,c)=>g(n.photo,"","(max-width: 880px) 100vw, 45vw",1.25,c===0?' class="is-active"':"")).join(""),l.innerHTML=t.map((n,c)=>`<span${c===0?' class="is-done"':""}></span>`).join(""),o.innerHTML=t.map(n=>`<li class="weeks__item">
    <div class="frame">${g(n.photo,"","100vw",.75)}</div>
    <p class="weeks__label">${e(n.label)}</p><h3>${e(n.title)}</h3><p>${e(n.body)}</p>
  </li>`).join("");let r=d("img",a),p=d("span",l),$=d(".weeks__item",o),h=n=>{r.forEach((c,u)=>c.classList.toggle("is-active",u===n)),p.forEach((c,u)=>c.classList.toggle("is-done",u<=n))};if(!("IntersectionObserver"in window))return;let y=new IntersectionObserver(n=>{for(let c of n)c.isIntersecting&&h($.indexOf(c.target))},{rootMargin:"-45% 0px -45% 0px"});$.forEach(n=>y.observe(n))}export{g as a,x as b,b as c,w as d,L as e,k as f,A as g,M as h,T as i,E as j};
