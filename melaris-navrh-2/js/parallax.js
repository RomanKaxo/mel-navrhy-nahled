/* GSAP 3.15.1 + Lenis 1.3.27. Bez knihoven zůstává čitelná statická scéna. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-parallax-layers]');
  if (!hero || !window.gsap || !window.ScrollTrigger || !window.Lenis) return;
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var context = null;
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
    hero.dataset.parallax = 'off';
  }
  function sync() {
    var on = !reduced.matches && root.dataset.motion !== 'off';
    if (!on) { stop(); return; }
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
  var observer = new MutationObserver(sync);
  observer.observe(root, {attributes:true, attributeFilter:['data-motion']});
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  sync();
})();
