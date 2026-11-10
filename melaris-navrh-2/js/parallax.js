/* GSAP 3.15.1 + Lenis 1.3.27. Bez knihoven zůstává čitelná statická scéna. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-parallax-layers]');
  if (!hero || !window.gsap || !window.ScrollTrigger || !window.Lenis) return;
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var context = null;
  var living = createLivingScene();
  var lenis = null;
  var tick = null;
  gsap.registerPlugin(ScrollTrigger);

  function stop() {
    if (tick) gsap.ticker.remove(tick);
    tick = null;
    if (lenis) lenis.destroy();
    lenis = null;
    if (context) context.revert();
    context = null;
    living.reset();
    hero.dataset.parallax = 'off';
  }
  function sync() {
    var on = !reduced.matches && root.dataset.motion !== 'off';
    if (!on) { stop(); return; }
    living.start();
    if (context) return;
    context = gsap.context(function () {
      var timeline = gsap.timeline({scrollTrigger: {
        trigger:hero, start:'top top', end:'bottom top', scrub:0,
        invalidateOnRefresh:true
      }});
      [70, 55, 40, 10].forEach(function (speed, i) {
        timeline.to(hero.querySelector('[data-parallax-layer="' + (i + 1) + '"]'),
          {yPercent:speed, ease:'none'}, 0);
      });
    }, hero);
    // Kotvy ovládá nativní prohlížeč a stávající navigace stránky.
    lenis = new Lenis({autoRaf:false, smoothWheel:true, anchors:false});
    lenis.on('scroll', ScrollTrigger.update);
    tick = function (time) { lenis.raf(time * 1000); };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    hero.dataset.parallax = 'on';
  }
  // Všechny autonomní pohyby jsou uvnitř parallax vrstev, nikdy na nich.
  function createLivingScene() {
    var button = hero.querySelector('.px-mel');
    var jumpBody = button.querySelector('.px-jump');
    var body = button.querySelector('.koren');
    var eyes = button.querySelector('.oci');
    var pupils = button.querySelectorAll('.zor');
    var shadow = button.querySelector('.px-mel-shadow');
    var finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    var mobile = matchMedia('(max-width:599px)');
    var scene = null, animations = [], jump, blink, autoTimer, blinkTimer;
    var visible = false, running = false;
    function laterJump() {
      autoTimer = gsap.delayedCall(gsap.utils.random(5.5, 9), function () {
        hop(); laterJump();
      });
    }
    function laterBlink() {
      blinkTimer = gsap.delayedCall(gsap.utils.random(2.4, 6.7), function () {
        blink.restart(); laterBlink();
      });
    }
    function hop() {
      if (!running || jump.isActive()) return;
      jump.restart();
    }
    function update() {
      var active = !!scene && visible && !document.hidden;
      if (active === running) return;
      running = active;
      hero.dataset.living = active ? 'running' : 'paused';
      if (active) {
        animations.forEach(function (a) { if (a.progress() < 1 || a.repeat() === -1) a.resume(); });
        laterJump(); laterBlink();
      } else {
        animations.forEach(function (a) { a.pause(); });
        if (autoTimer) autoTimer.kill();
        if (blinkTimer) blinkTimer.kill();
      }
    }
    function start() {
      if (scene) return;
      scene = gsap.context(function () {
        function keep(a) { animations.push(a); return a; }
        keep(gsap.to(body, {y:-.45, rotation:.5, scaleY:1.012, duration:2.8,
          ease:'sine.inOut', repeat:-1, yoyo:true, paused:true}));
        keep(gsap.to(hero.querySelector('.px-grid-drift'), {x:96,y:96,duration:42,
          ease:'none',repeat:-1,paused:true}));
        hero.querySelectorAll('.px-stars path').forEach(function (star, i) {
          if (mobile.matches && i === 2) return;
          keep(gsap.to(star, {y:-12-i*3,x:i%2?5:-5,duration:4.8+i*1.3,
            ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
        });
        ['.px-ridge-far','.px-ridge'].forEach(function (selector, i) {
          keep(gsap.to(hero.querySelector(selector), {y:mobile.matches?-2:-5,
            scaleY:1.008,duration:7+i*2,ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
        });
        keep(gsap.fromTo(hero.querySelector('.px-light'), {opacity:.35},
          {opacity:.8,scale:1.025,duration:8,ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
        jump = keep(gsap.timeline({paused:true})
          .to(jumpBody,{scaleX:1.09,scaleY:.88,y:0,duration:.18,ease:'power2.in'})
          .to(jumpBody,{scaleX:.94,scaleY:1.09,y:-13,duration:.32,ease:'power2.out'})
          .to(jumpBody,{scaleX:1,scaleY:1,y:-13.6,duration:.10,ease:'sine.inOut'})
          .to(jumpBody,{y:0,scaleX:.97,scaleY:1.04,duration:.27,ease:'power2.in'})
          .to(jumpBody,{scaleX:1.12,scaleY:.85,duration:.12,ease:'power2.out'})
          .to(jumpBody,{scaleX:1,scaleY:1,duration:.25,ease:'elastic.out(1,.6)'})
          .to(shadow,{scaleX:.57,scaleY:.7,opacity:.13,duration:.42,ease:'sine.out'},.18)
          .to(shadow,{scaleX:1.08,scaleY:1,opacity:.33,duration:.39,ease:'power2.in'},.60)
          .to(shadow,{scaleX:1,opacity:.3,duration:.25},.99));
        blink = keep(gsap.timeline({paused:true})
          .to(eyes,{scaleY:.06,duration:.085,ease:'power2.in'})
          .to(eyes,{scaleY:1,duration:.12,ease:'power2.out'}));
        // Čekají na první klik / časovač; update nesmí spustit skok při načtení.
        jump.progress(1); blink.progress(1);
      }, hero);
      button.disabled = false;
      update();
    }
    function reset() {
      if (autoTimer) autoTimer.kill();
      if (blinkTimer) blinkTimer.kill();
      if (scene) scene.revert();
      gsap.set(pupils,{clearProps:"transform"});
      scene = null; animations = []; running = false;
      button.disabled = true;
      hero.dataset.living = 'off';
    }
    button.addEventListener('click', hop);
    hero.addEventListener('pointermove', function (event) {
      if (!running || !finePointer.matches || event.pointerType === 'touch') return;
      var r = button.getBoundingClientRect();
      var x = gsap.utils.clamp(-1.7,1.7,(event.clientX-r.left-r.width/2)/r.width*2);
      var y = gsap.utils.clamp(-1.3,1.3,(event.clientY-r.top-r.height/2)/r.height*2);
      gsap.set(pupils,{x:x,y:y});
    });
    hero.addEventListener('pointerleave', function () {
      if (scene) gsap.set(pupils,{x:0,y:0});
    });
    var view = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting; update();
    }, {threshold:0});
    view.observe(hero);
    document.addEventListener('visibilitychange', update);
    return {start:start,reset:reset};
  }
  var observer = new MutationObserver(sync);
  observer.observe(root, {attributes:true, attributeFilter:['data-motion']});
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  sync();
})();
