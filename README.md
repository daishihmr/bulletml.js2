# bulletml.js 2.0

## usage

~~~html
<!-- import library -->
<script src="./build/bulletml.js"></script>

<script>
window.onload = async () => {

  // load xml file
  const res = await fetch(url);
  const xml = await res.text();

  // parse
  const bulletml = BulletML.parse(xml);

  // player
  const player = { x: 0, y: 0 };

  // create manager
  const manager = new BulletML.Manager({ player });

  // enemy
  const enemy = new BulletML.Bullet();

  // run
  manager.run(enemy, bulletml);

  const bullets = [];

  // on fire bullet
  manager.onFire = (params) => {
    const { bullet } = params;
    console.log(`${ bullet.x }, ${ bullet.y }`);

    // on execute <vanish> tag
    bullet.onVanish = () => {
      doVanishProcess();
    };

    bullets.push(bullet);
  };

  let last = Date.now();
  const loop = () => {
    requestAnimationFrame(loop);

    const now = Date.now();
    const deltaTime = now - last;
    last = now;

    // update 1 frame
    manager.update(deltaTime);

    bullets.forEach((bullet) => {

      if (isOutOfScreen(bullet)) {
        // delete bullet
        bullet.destroy();
      }

    });
  };
  loop();

};
</script>
~~~

## build

~~~
rollup --config
~~~

## watch

~~~
rollup --config --watch
~~~
