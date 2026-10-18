const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 写真は images/{名前}-400 / -800 / -1600.webp を表示幅に合わせて出し分ける
const srcsetOf = (name) => [400, 800, 1600].map((w) => `images/${name}-${w}.webp ${w}w`).join(', ');

const setPhoto = (img, name) => {
    img.width = 1600;
    img.height = 1067;
    img.decoding = 'async';
    img.srcset = srcsetOf(name);
    img.src = `images/${name}-1600.webp`;
};

// ---------- お品書きのデータ ----------
const dishes = [
    { key: 'sashimi', photo: 'food/sashimi', name: 'お造り', alt: '鮪と白身魚のお造り。大葉と花穂じそを添えて', text: 'その日に仕入れた鮮魚を、魚ごとに厚みを変えて引きます。' },
    { key: 'sanma', photo: 'food/sanma', name: '秋刀魚の塩焼き', alt: '角皿にのった秋刀魚の塩焼きと大根おろし、すだち', text: '皮はぱりっと、身はふっくら。大根おろしとすだちでさっぱりと。' },
    { key: 'kama', photo: 'food/kama', name: 'カマの塩焼き', alt: '朱色の丸皿にのった魚のカマの塩焼き', text: '脂ののったカマをじっくり焼き上げた、酒の進む一品。' },
    { key: 'nitsuke', photo: 'food/nitsuke', name: '魚の煮付け', alt: '甘辛い煮汁で炊いている魚の煮付け', text: '甘辛い煮汁を何度もかけながら、骨まで味を含ませます。' },
    { key: 'agedashi', photo: 'food/agedashi', name: '揚げ出し豆腐', alt: '白い器に入った揚げ出し豆腐。大根おろしと刻み海苔をのせて', text: '衣はさっくり、中はとろり。だしの香る餡でどうぞ。' },
    { key: 'pork', photo: 'food/pork', name: '豚ロースのソテー', alt: '黒い皿に盛った豚ロースのソテーと生野菜', text: '厚切りの豚ロースを香ばしく焼いた、ボリュームのある一皿。' },
    { key: 'nabe', photo: 'food/nabe', name: '水餃子の小鍋', alt: '土鍋に入った水餃子とトマト、水菜の鍋', text: 'つるりとした水餃子に、トマトの酸味と水菜を合わせて。' },
    { key: 'hiyashi', photo: 'food/hiyashi', name: '冷やし麺', alt: '焼豚、ゆで卵、トマト、紅生姜をのせた冷やし麺', text: '焼豚や卵をのせた、締めにも嬉しい冷たい麺。' },
];

// ---------- キャッチコピー：一文字ずつ浮かび上がる ----------
document.querySelectorAll('[data-chars]').forEach((line, lineIndex) => {
    [...line.dataset.chars].forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'inline-block animate-char-in';
        span.style.animationDelay = `${200 + lineIndex * 700 + index * 110}ms`;
        span.textContent = char;
        line.append(span);
    });
});

// ---------- 写真の読み込み ----------
// スライドショーの2枚目以降は、ページの読み込みが終わってから取得する（最初の表示を優先するため）
document.querySelectorAll('img[data-photo]').forEach((img) => {
    if (img.classList.contains('hero-slide')) return;
    img.loading = 'lazy';
    setPhoto(img, img.dataset.photo);
});

// ---------- お品書き：パネルとタブを組み立て、料理名で写真を切り替える ----------
document.querySelectorAll('[data-menu]').forEach((menu) => {
    const panelsWrap = menu.querySelector('[data-dish-panels]');
    const tablist = menu.querySelector('[data-tablist]');
    const panelTemplate = menu.querySelector('[data-panel-template]');
    const tabTemplate = menu.querySelector('[data-tab-template]');

    dishes.forEach((dish, i) => {
        const panel = panelTemplate.content.firstElementChild.cloneNode(true);
        panel.id = `dish-${dish.key}`;
        panel.setAttribute('aria-labelledby', `dish-tab-${dish.key}`);
        panel.toggleAttribute('data-active', i === 0);
        const img = panel.querySelector('img');
        img.alt = dish.alt;
        img.loading = 'lazy';
        setPhoto(img, dish.photo);
        panel.querySelector('[data-name]').textContent = dish.name;
        panel.querySelector('[data-text]').textContent = dish.text;
        panelsWrap.append(panel);

        const tab = tabTemplate.content.firstElementChild.cloneNode(true);
        tab.id = `dish-tab-${dish.key}`;
        tab.setAttribute('aria-controls', panel.id);
        tab.setAttribute('aria-selected', String(i === 0));
        tab.tabIndex = i === 0 ? 0 : -1;
        tab.textContent = dish.name;
        tablist.append(tab);
    });

    const tabs = [...menu.querySelectorAll('[data-dish-tab]')];
    const panels = [...menu.querySelectorAll('[data-dish-panel]')];

    menu.setAttribute('data-enhanced', '');
    menu.querySelector('[data-dish-tabs]').hidden = false;

    const select = (tab, focus = false) => {
        tabs.forEach((t) => {
            const selected = t === tab;
            t.setAttribute('aria-selected', String(selected));
            t.tabIndex = selected ? 0 : -1;
        });
        panels.forEach((panel) => panel.toggleAttribute('data-active', panel.id === tab.getAttribute('aria-controls')));
        if (focus) tab.focus();
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => select(tab));
        // マウスでは、料理名に重ねるだけで切り替える
        tab.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'mouse') select(tab);
        });
        tab.addEventListener('keydown', (event) => {
            // 縦書きは右から左へ読むので、← が「次」、→ が「前」
            const moves = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 };
            let next = null;

            if (event.key in moves) next = tabs[(index + moves[event.key] + tabs.length) % tabs.length];
            if (event.key === 'Home') next = tabs[0];
            if (event.key === 'End') next = tabs[tabs.length - 1];

            if (next) {
                event.preventDefault();
                select(next, true);
            }
        });
    });
});

// ---------- スクロールで要素が画面に入ったら表示する（[data-reveal]） ----------
// 写真の読み込みが終わってから演出を始める（空の枠で演出が終わり、後から写真がパッと出るのを防ぐ）
const revealTargets = document.querySelectorAll('[data-reveal]');

const imagesLoaded = (el) => {
    const images = el.tagName === 'IMG' ? [el] : [...el.querySelectorAll('img')];
    const pending = images
        .filter((img) => !img.complete)
        .map(
            (img) =>
                new Promise((resolve) => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                }),
        );

    return Promise.race([Promise.all(pending), new Promise((resolve) => setTimeout(resolve, 10000))]);
};

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    observer.unobserve(entry.target);
                    imagesLoaded(entry.target).then(() => entry.target.classList.add('is-visible'));
                }
            });
        },
        { rootMargin: '0px 0px -10% 0px' },
    );

    // 演出前の写真は切り抜いて隠しているため、ブラウザの遅延読み込みが始まらない。
    // 画面に入る少し手前（800px）で、こちらから読み込みを始めておく
    const preloader = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                preloader.unobserve(entry.target);
                const images = entry.target.tagName === 'IMG' ? [entry.target] : entry.target.querySelectorAll('img');
                images.forEach((img) => (img.loading = 'eager'));
            });
        },
        { rootMargin: '800px 0px' },
    );

    revealTargets.forEach((el) => {
        preloader.observe(el);
        observer.observe(el);
    });
} else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
}

// ---------- command / commandfor 属性に未対応のブラウザ向けの代替処理 ----------
if (!('commandForElement' in HTMLButtonElement.prototype)) {
    document.querySelectorAll('button[commandfor]').forEach((button) => {
        button.addEventListener('click', () => {
            const dialog = document.getElementById(button.getAttribute('commandfor'));
            const command = button.getAttribute('command');

            if (command === 'show-modal') dialog?.showModal();
            if (command === 'close') dialog?.close();
        });
    });
}

// モバイルメニュー内のリンクを押したらメニューを閉じる
document.querySelectorAll('[data-menu-link]').forEach((link) => {
    link.addEventListener('click', () => link.closest('dialog')?.close());
});

// ---------- スマホ下部の予約バー：ファーストビューが見えている間は隠す ----------
const reserveBar = document.querySelector('[data-reserve-bar]');
const hero = document.querySelector('#top');

if (reserveBar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
        reserveBar.inert = entry.isIntersecting;
        if (entry.isIntersecting) document.getElementById('reserve-menu')?.hidePopover?.();
    }).observe(hero);
}

// ---------- ファーストビューのスライドショー ----------
const slideshow = document.querySelector('[data-slideshow]');

if (slideshow && !prefersReducedMotion) {
    const loadSlides = () => slideshow.querySelectorAll('img.hero-slide[data-photo]').forEach((img) => setPhoto(img, img.dataset.photo));

    if (document.readyState === 'complete') loadSlides();
    else window.addEventListener('load', loadSlides);

    // 停止・再生ボタン
    const toggle = slideshow.querySelector('[data-slideshow-toggle]');

    if (toggle) {
        toggle.hidden = false;
        toggle.addEventListener('click', () => {
            const paused = slideshow.classList.toggle('is-paused');

            toggle.querySelector('[data-label]').textContent = paused ? 'スライドショーを再生' : 'スライドショーを停止';
            toggle.querySelector('[data-icon="pause"]').classList.toggle('hidden', paused);
            toggle.querySelector('[data-icon="play"]').classList.toggle('hidden', !paused);
        });
    }
}

// ---------- ヘッダー：ページ最上部にいる間は透明にする ----------
const siteHeader = document.querySelector('[data-site-header]');

if (siteHeader) {
    const updateHeader = () => siteHeader.toggleAttribute('data-at-top', window.scrollY < 40);

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
}

// ---------- 地図：押したときに初めて Google マップを読み込む ----------
document.querySelectorAll('[data-map-load]').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        const iframe = document.createElement('iframe');
        iframe.src = link.dataset.mapLoad;
        iframe.title = '店舗の地図（Googleマップ）';
        iframe.className = 'absolute inset-0 size-full border-0';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        link.replaceWith(iframe);
        iframe.focus();
    });
});

// ---------- フッターの年 ----------
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
