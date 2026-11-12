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
        // Nulový scroll začíná pod sticky hlavičkou, nikoli až o její výšku později.
        trigger:hero, start:0, end:function () { return hero.offsetHeight; }, scrub:0,
        invalidateOnRefresh:true
      }});
      [70, 55, 40, 10].forEach(function (speed, i) {
        timeline.to(hero.querySelector('[data-parallax-layer="' + (i + 1) + '"]'),
          {yPercent:speed, duration:1, ease:'none'}, 0);
      });
      // Doprovod drží rozestup od titulu a odejde dřív, než jej zakryje popředí.
      timeline.to(hero.querySelector('.px-support'), {y:function () { return hero.offsetHeight*.4; },duration:1,ease:'none'}, 0);
      timeline.to(hero.querySelector('.px-support'), {autoAlpha:0,duration:.18,ease:'none'}, 0);
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
    var crewPupils = hero.querySelectorAll('.px-crew .zor');
    var shadow = button.querySelector('.px-mel-shadow');
    var finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    var mobile = matchMedia('(max-width:599px)');
    var compact = matchMedia('(max-width:1023px) and (min-height:501px)');
    var wide = matchMedia('(min-width:2400px)');
    var scene = null, animations = [], jump, blink, autoTimer, blinkTimer;
    var depths = hero.querySelectorAll('.px-depth');
    var sceneFrame = hero.querySelector('.px-scene');
    var lines = hero.querySelectorAll('.px-line');
    var completeLines = Array.from(lines, function (line) { return line.textContent; });
    var storyTime = 0, celebrated = false, task = 0, cursorMark = '', lookingAtTerminal = false;
    var cursor = hero.querySelector('.px-cursor');
    var tasks = ['> Zpřehledni stránku', '> Oprav navigaci', '> Uprav formulář'];
    function writeStory(t) {
      storyTime = t;
      var starts = [0, 2.5, 7.1, 9.6], lengths = [2.1, 1.8, 1.7, .65];
      var activeLine = 0;
      lines.forEach(function (line, i) {
        var count = Math.floor(completeLines[i].length * gsap.utils.clamp(0, 1, (t-starts[i])/lengths[i]));
        var text = completeLines[i].slice(0,count);
        if (line.textContent !== text) line.textContent = text;
        if (t >= starts[i]) activeLine = i;
      });
      var current = lines[activeLine];
      var cursorOpacity = Math.floor(t*2.5)%2 ? .1 : 1;
      var mark = activeLine+'|'+current.textContent+'|'+cursorOpacity;
      // Měření textu a zápisy stylů jen při novém znaku nebo bliknutí, ne každý frame.
      if (mark !== cursorMark) {
        cursorMark = mark;
        gsap.set(cursor, {x:current.getComputedTextLength()+3,
          y:Number(current.getAttribute('y'))-85,opacity:cursorOpacity});
      }
      var phase = t < 2.5 ? 'zadani' : t < 7.1 ? 'tym' : t < 9.6 ? 'kontrola' : 'hotovo';
      if (hero.dataset.story !== phase) hero.dataset.story = phase;
      if (t >= 10.25 && !celebrated) { celebrated = true; hop(); }
      if (t < 1) celebrated = false;
      var look = t >= 9.6 && t < 11.4;
      if (look !== lookingAtTerminal) {
        lookingAtTerminal = look;
        gsap.set(pupils,{x:look?-1.7:0,y:look?.5:0});
      }
    }
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
    // Osady na hřebenech: Arko staví dům, Iris natírá, Kern obchází, Vela se rozhlíží, Onyx hlídá.
    function village(keep) {
      var q = function (s) { return hero.querySelector(s); };
      var qa = function (s) { return hero.querySelectorAll(s); };
      qa('.px-smoke circle').forEach(function (puff, i) {
        keep(gsap.fromTo(puff,{y:0,x:0,scale:.6,opacity:.55,transformOrigin:'50% 50%'},
          {y:-26,x:6,scale:1.6,opacity:0,duration:3,ease:'sine.out',repeat:-1,delay:i,paused:true}));
      });
      qa('.px-window-light').forEach(function (light, i) {
        keep(gsap.to(light,{opacity:.25,duration:.4,repeat:-1,yoyo:true,repeatDelay:2.6+i*1.4,paused:true}));
      });
      var paint = q('.px-paint'), brush = q('.px-brush');
      var coat = keep(gsap.timeline({repeat:-1,paused:true}));
      ['#C45FA0','#7F5CD6','#396ED6','#1E9E8A'].forEach(function (color) {
        coat.set(paint,{fill:color,scaleY:0,transformOrigin:'50% 100%'})
          .to(paint,{scaleY:1,duration:2.4,ease:'none'})
          .fromTo(brush,{y:10},{y:-14,duration:.6,ease:'sine.inOut',repeat:3,yoyo:true},'<')
          .to({},{duration:.8});
      });
      keep(gsap.to(q('[data-act=paint]'),{rotation:4,transformOrigin:'50% 100%',duration:.6,
        ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
      // Tři série úderů, po každé přibude prkno; hotovou střechu označí vlajka.
      var hammer = q('.px-hammer'), planks = qa('.px-plank'), flag = q('.px-flag');
      var arko = q('[data-who=arko] .px-who-act');
      var build = keep(gsap.timeline({repeat:-1,paused:true}));
      build.set(planks,{opacity:0,y:-18}).set(flag,{opacity:1,scaleY:0,transformOrigin:'50% 100%'});
      planks.forEach(function (plank) {
        build.to(hammer,{rotation:-50,svgOrigin:'186 92',duration:.16,ease:'power2.out',repeat:5,yoyo:true})
          .to(arko,{y:-3,duration:.16,ease:'sine.inOut',repeat:5,yoyo:true},'<')
          .to(plank,{opacity:1,y:0,duration:.35,ease:'back.out(2)'});
      });
      build.to(flag,{scaleY:1,duration:.4,ease:'back.out(3)'})
        .to(arko,{y:-8,duration:.2,ease:'power2.out',repeat:1,yoyo:true})
        .to({},{duration:1.6})
        .to([planks,flag],{opacity:0,duration:.4});
      var kern = q('[data-act=walk]');
      keep(gsap.timeline({repeat:-1,paused:true})
        .set(kern,{scaleX:1,transformOrigin:'50% 100%'})
        .to(kern,{x:40,duration:3.2,ease:'sine.inOut'})
        .to(kern,{scaleX:-1,duration:.15}).to({},{duration:.6})
        .to(kern,{x:0,duration:3.2,ease:'sine.inOut'})
        .to(kern,{scaleX:1,duration:.15}).to({},{duration:.6}));
      keep(gsap.to(q('[data-who=kern] .px-crew'),{y:-4,duration:.2,ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
      keep(gsap.fromTo(q('[data-act=look]'),{rotation:-8},{rotation:8,transformOrigin:'50% 100%',
        duration:1.8,ease:'sine.inOut',repeat:-1,yoyo:true,repeatDelay:.8,paused:true}));
      keep(gsap.to(q('[data-act=guard]'),{rotation:3,transformOrigin:'50% 100%',duration:2.2,
        ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
    }
    function start() {
      if (scene) return;
      scene = gsap.context(function () {
        function keep(a) { animations.push(a); return a; }
        keep(gsap.to(body, {y:-.45, rotation:.5, scaleY:1.012, duration:2.8,
          ease:'sine.inOut', repeat:-1, yoyo:true, paused:true}));
        hero.querySelectorAll('.px-star').forEach(function (star, i) {
          // Na velmi široké ploše stačí pohyb týmu, paketů a hřebenových světel.
          if (wide.matches || (mobile.matches && i === 2)) return;
          keep(gsap.to(star, {y:-85-i*6,x:i%2?20:-20,opacity:.3,duration:6,
            ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
        });
        // Malé světelné stopy mají vlastní kompozitní plochu. Velké SVG hřebenů zůstává statické.
        var ridgePaths = {
          far:[[-60,590],[260,400],[720,640],[1180,400],[1500,590]],
          near:[[-60,710],[260,520],[720,780],[1180,520],[1500,710]],
          front:[[-40,680],[260,550],[720,650],[1180,550],[1480,680]]
        };
        hero.querySelectorAll('.px-ridge-glint').forEach(function (light, index) {
          var points = ridgePaths[light.dataset.ridge].map(function (p) {
            return {x:p[0]/1440*hero.clientWidth-37,y:p[1]/1000*hero.clientHeight-1};
          });
          var lengths = points.slice(1).map(function (p, i) {
            return Math.hypot(p.x-points[i].x,p.y-points[i].y);
          });
          var total = lengths.reduce(function (a,b) { return a+b; },0);
          var flow = keep(gsap.timeline({repeat:-1,paused:true}));
          flow.set(light,{x:points[0].x,y:points[0].y});
          points.slice(1).forEach(function (p,i) {
            flow.set(light,{rotation:Math.atan2(p.y-points[i].y,p.x-points[i].x)*180/Math.PI})
              .to(light,{x:p.x,y:p.y,duration:12*lengths[i]/total,ease:'none'});
          });
          flow.progress(index/3);
        });
        // Specialisté dýchají a mrkají jako Mel, každý ve vlastním rytmu.
        hero.querySelectorAll('.px-crew').forEach(function (member, i) {
          keep(gsap.to(member.querySelector('.px-crew-body'),{scaleY:1.03,transformOrigin:'50% 100%',
            duration:2.4+i*.3,ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
          var eyesOf = member.querySelectorAll('.oci');
          keep(gsap.timeline({repeat:-1,repeatDelay:3+i*1.3,delay:.6+i*.7,paused:true})
            .to(eyesOf,{scaleY:.06,transformOrigin:'50% 50%',duration:.085,ease:'power2.in'})
            .to(eyesOf,{scaleY:1,duration:.12,ease:'power2.out'}));
        });
        village(keep);
        if (mobile.matches) depths.forEach(function (el,i) {
          keep(gsap.to(el,{y:i%2?-3:3,duration:6,repeat:-1,yoyo:true,
            ease:'sine.inOut',paused:true}));
        });
        var clock = {t:0};
        keep(gsap.to(clock,{t:12,duration:12,ease:'none',repeat:-1,paused:true,
          onUpdate:function () { writeStory(clock.t); },
          onRepeat:function () { task = (task+1)%tasks.length; completeLines[0] = tasks[task]; }}));
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
          .to(eyes,{scaleY:.06,transformOrigin:'50% 50%',duration:.085,ease:'power2.in'})
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
      gsap.set([pupils,crewPupils],{clearProps:"transform"});
      gsap.set(depths,{clearProps:'transform'});
      gsap.set(sceneFrame,{clearProps:'transform'});
      lines.forEach(function (line,i) { line.textContent = completeLines[i]; });
      storyTime = 0; celebrated = false; cursorMark = ''; lookingAtTerminal = false;
      scene = null; animations = []; running = false;
      button.disabled = true;
      hero.dataset.living = 'off';
    }
    function resizeScene() { if (scene) { reset(); start(); } }
    mobile.addEventListener('change', resizeScene);
    compact.addEventListener('change', resizeScene);
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeScene, 150);
    });
    button.addEventListener('click', hop);
    hero.addEventListener('pointermove', function (event) {
      if (!running || !finePointer.matches || mobile.matches || event.pointerType === 'touch') return;
      var bounds = hero.getBoundingClientRect();
      var my = (event.clientY-bounds.top)/bounds.height*2-1;
      // Vrstvy reagují na myš jen svisle; do stran se scéna nehýbe.
      depths.forEach(function (el) {
        gsap.set(el,{y:my*Number(el.dataset.depth)*.25});
      });
      gsap.set(sceneFrame,{y:my*4});
      // Specialisté se dívají za kurzorem, oči se pohnou jen uvnitř obličeje.
      gsap.set(crewPupils,{x:((event.clientX-bounds.left)/bounds.width*2-1)*1.6,y:my*1.2});
      if (storyTime >= 9.6 && storyTime < 11.4) return;
      var r = button.getBoundingClientRect();
      var x = gsap.utils.clamp(-1.7,1.7,(event.clientX-r.left-r.width/2)/r.width*2);
      var y = gsap.utils.clamp(-1.3,1.3,(event.clientY-r.top-r.height/2)/r.height*2);
      gsap.set(pupils,{x:x,y:y});
    });
    hero.addEventListener('pointerleave', function () {
      if (scene && running) {
        gsap.set([pupils,crewPupils],{x:0,y:0});
        if (!mobile.matches) gsap.set(depths,{x:0,y:0});
        gsap.set(sceneFrame,{x:0,y:0});
      }
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
