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
    // Každý specialista dělá svou práci: rekvizity mají data-a, stanoviště data-st.
    function crowd(keep) {
      function at(name) {
        var st = hero.querySelector('[data-st="'+name+'"]');
        return {
          one:function (a) { return st.querySelector('[data-a="'+a+'"]'); },
          all:function (a) { return st.querySelectorAll('[data-a="'+a+'"]'); },
          who:st.querySelector('.px-who')
        };
      }
      function loop(vars) { return keep(gsap.timeline(Object.assign({repeat:-1,paused:true},vars))); }
      function sway(el, deg, dur) {
        keep(gsap.to(el,{rotation:deg,transformOrigin:'50% 100%',duration:dur,ease:'sine.inOut',
          repeat:-1,yoyo:true,paused:true}));
      }
      var s;
      // Kairo vede tým: mává vlajkou.
      s = at('kairo');
      keep(gsap.fromTo(s.one('flag'),{scaleX:1},{scaleX:.75,skewY:-6,transformOrigin:'0% 50%',duration:.5,
        ease:'sine.inOut',repeat:-1,yoyo:true,paused:true}));
      sway(s.who,3,1);
      // Vela hledá: rozhlíží se a občas něco najde.
      s = at('vela');
      sway(s.who,7,1.6);
      loop({repeatDelay:2.2}).fromTo(s.one('found'),{scale:0,opacity:0,transformOrigin:'50% 50%'},
        {scale:1.2,opacity:1,rotation:90,duration:.4,ease:'back.out(3)'}).to(s.one('found'),{opacity:0,duration:.5},'+=.6');
      // Nexo ladí techniku: točí ozubenými koly.
      s = at('nexo');
      keep(gsap.to(s.one('gear'),{rotation:360,svgOrigin:'30 -14',duration:4,ease:'none',repeat:-1,paused:true}));
      keep(gsap.to(s.one('gear2'),{rotation:-360,svgOrigin:'43 -30',duration:2.7,ease:'none',repeat:-1,paused:true}));
      // Juno nasazuje: odstartuje z rampy a zase přistane.
      s = at('juno');
      var rocket = s.one('rocket'), flame = s.one('flame');
      gsap.set(flame,{opacity:0,transformOrigin:'50% 0%'});
      keep(gsap.to(flame,{scaleY:1.5,duration:.12,repeat:-1,yoyo:true,paused:true}));
      loop({repeatDelay:3})
        .to(rocket,{x:1,duration:.05,repeat:9,yoyo:true})
        .to(flame,{opacity:1,duration:.15},'<')
        .to(rocket,{y:-110,duration:1.4,ease:'power2.in'})
        .to(rocket,{y:0,duration:1.8,ease:'power2.out'},'+=.6')
        .to(flame,{opacity:0,duration:.25});
      // Memo zakládá vzpomínky do šuplíku.
      s = at('memo');
      loop({repeatDelay:1}).to(s.one('drawer'),{x:8,duration:.35,ease:'power2.out'})
        .fromTo(s.one('card'),{y:-6,opacity:0},{y:16,opacity:1,duration:.5,ease:'power1.in'})
        .to(s.one('card'),{opacity:0,duration:.1})
        .to(s.one('drawer'),{x:0,duration:.3,ease:'power2.in'});
      // Arko staví: kladivo a prkna střechy.
      s = at('arko');
      var planks = s.all('plank'), hammer = s.one('hammer');
      var build = loop({repeatDelay:.6});
      build.set(planks,{opacity:0,y:-10});
      planks.forEach(function (plank) {
        build.to(hammer,{rotation:-45,svgOrigin:'14 -12',duration:.15,ease:'power2.out',repeat:5,yoyo:true})
          .to(plank,{opacity:1,y:0,duration:.3,ease:'back.out(2)'});
      });
      build.to(planks,{opacity:0,duration:.3},'+=1.2');
      // Iris navrhuje: tahy barev na plátně.
      s = at('iris');
      loop({repeatDelay:.8}).fromTo(s.all('stroke'),{scaleX:0,transformOrigin:'0% 50%'},{scaleX:1,duration:.6,stagger:.5,ease:'power1.inOut'})
        .to(s.all('stroke'),{opacity:0,duration:.3},'+=1.2').set(s.all('stroke'),{opacity:1});
      sway(s.who,4,.6);
      // Kern kontroluje kód: odškrtává položky.
      s = at('kern');
      loop({repeatDelay:1}).fromTo(s.all('check'),{scale:0,opacity:0,transformOrigin:'50% 50%'},{scale:1,opacity:1,duration:.3,stagger:.55,ease:'back.out(3)'})
        .to(s.all('check'),{opacity:0,duration:.3},'+=1.2');
      // Brio dělá marketing: volá do megafonu.
      s = at('brio');
      keep(gsap.fromTo(s.all('wave'),{opacity:0,x:-4},{opacity:1,x:4,duration:.6,stagger:.2,repeat:-1,yoyo:true,ease:'sine.inOut',paused:true}));
      sway(s.who,-4,.6);
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
        crowd(keep);
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
