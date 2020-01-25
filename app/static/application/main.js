const g = griddlesStreams // <griddle-cards>
const m = '' // <miil-viewer>
const ms = document // <miil-viewer>.shadowRoot

let clear_flag = 1
const spinner = {
  open: function() {
    // ms.getElementById('fab').icon = 'cloud-download'
    ms.getElementById('fab').style.display = 'none'
    setFabColor()
  },
  close: function() {
    // ms.getElementById('fab').icon = 'arrow-forward'
    ms.getElementById('fab').style.display = 'block'
    setFabColor()
  }
}

const formatItems = data => {
  const items = []
  for (const entry of data) {
    const pageUrl = entry.dataset.page.replace('//miil.me/p/', '//miil.me/g/')
    items.push({
      card: { type: 'link', value: pageUrl },
      body: { type: 'text', value: entry.text[0].replace(/\n/g, '') },
      photo: { type: 'image', value: entry.src }
    })
  }
  return items
}

// ミイルの写真を表示する（ミイルアクセス・お気に入り共通仕様）
function showMillPhotos(favs) {
  var items = favs || getMiilPhotos_miiluser.miil_items;
  var cards = [];
  for(var j = 0; j < items.length; j++) {
    var card = {};
    card.src = items[j].photo;
    card.dataset = {};
    card.dataset.page = items[j].page;
    card.dataset.shadowZ = 0;
    card.text = [items[j].title, 'block'];
    cards.push(card);
  }

  if(clear_flag == 1) {
    // setStreamSize();
    g.ClearStreams();
  }

  g.Enqueue(...formatItems(cards));
}

// アプリのバージョンフォトを表示する
function showReleases () {
  const entries = release_blog_entries
  g.ClearStreams()
  const items = formatItems(entries)
  griddlesStreams.Enqueue(...items)
  const r = Math.floor(Math.random() * (entries.length))
  changeHeadImg(entries[r].src)
}

// カードがクリックされたときの挙動
window.addEventListener("griddles-cards-click", function() {
  var card = g.lastClickedCard;
  if(card.dataset.page != undefined) {
    window.open(card.dataset.page);
  }
  changeHeadImg(card.photo);
}, false);

// カードの表示が完了されたときの挙動
window.addEventListener("griddle-cards-end", function() {
  console.log("griddle-cards-end");
  // 画像ヘッダを更新する
  cards = g.getCards()[0].cards;
  var i = Math.floor(Math.random()*(cards.length));
  changeHeadImg(cards[i].photo);
  spinner.close();
}, false);

window.addEventListener("griddle-cards-ready", function() {
  setEvents();
  randomStyle();
  // initSettingUI();
  showReleases();
  constructCategories();
  console.log("griddle-cards-ready");
}, false);

// XXX: readyEvent
window.addEventListener('load', event => {
  setEvents()
  // initSettingUI()
  showReleases()
  constructCategories()
}, false)

// 画像をヘッダとして採用する
function changeHeadImg (srcUrl) {
  scrollHeaderPanel.setHeaderBackgroungImage(srcUrl)
  // const cshp = ms.querySelector("core-scroll-header-panel").shadowRoot
  // cshp.querySelector("#headerBg").style.backgroundImage = `url(${photo})`
  // cshp.querySelector("#condensedHeaderBg").style.backgroundColor = '#312319'
}

// アプリのスタイルをランダムに決める
const setFabColor = () => {
  const color = '#EADFC6'
  const fabIcon = ms.querySelector('#fab').shadowRoot.querySelector('#icon').querySelector('svg')
  fabIcon.setAttribute('stroke', color)
  fabIcon.setAttribute('fill', color)
}

function randomStyle () {
  const colors = ['#EADFC6']
  const idx = Math.floor(Math.random() * colors.length)
  const color = colors[idx]
  ms.querySelector('core-toolbar').style.color = color
  ms.querySelector('.title').style.color = color
  setFabColor()
}

// ダイアログの表示／非表示切り替え
function toggleDialog(id) {
  var dialog = ms.querySelector('#' + id);
  dialog.toggle();
}

// jQuery Toggle
function slideToggle (id) {
  const obj = ms.querySelector(`#${id}`)
  if (obj.style.display !== 'none') {
    slideUp(id);
  }else {
    slideDown(id);
  }
}

function slideDown(id) {
  const obj = ms.querySelector(`#${id}`)
  $(obj).slideDown()
}

function slideUp (id) {
  const obj = ms.querySelector(`#${id}`)
  $(obj).slideUp()
}

// categoryパネルを構築する
function constructCategories() {
  var cs = miil_normal;
  var h = window.innerHeight - 210;
  var s = ms.querySelector("#stage_category");
  s.style.height = h + "px";
  s.innerHTML += "<h2>Username</h2>";
  const username = localStorage.username || ''
  s.innerHTML += `<input id='username' type='text' value='${username}' placeholder='daiz'>`
  for(var i = 0; i < cs.length; i++) {
    var n = cs[i].name;
    var c = cs[i].category_id;
    s.innerHTML += "<h2>" + n  +"</h2>";
    for (let j = 0; j < cs[i].categories.length; j++) {
      n = cs[i].categories[j].name;
      c = cs[i].categories[j].category_id;
      n = qn(n); // 個別対応
      const pb = `<span id='category_${c}' role='button' class='cate'>${n}</span> `
      s.innerHTML += pb
    }
  }
}

function qn(q) {
  if(q.search(/手料理：/) != -1) {
    q = q.replace("手料理：", "");
  }
  return q;
}

function flatCategories () {
  const groups = miil_normal
  const res = []
  for (const group of groups) {
    const {name, category_id} = group
    for (const category of group.categories) {
      const categoryId = category.category_id
      res.push(categoryId)
    }
  }
  return res
}

// ミイルのページであるかどうかを判定する
function isMiilPg(url) {
  //http://miil.me/g/57lk3
  var has_http   = (url.search(/^http/) >= 0)     ? 1 : 0;
  var has_miilme = (url.search(/miil\.me/) >= 0)  ? 1 : 0;
  return has_http * has_miilme;
}

function closeCategories () {
  const stageCategory = ms.querySelector('#stage_category')
  if (stageCategory.style.display === 'none') return
  stageCategory.style.display = 'none'
}

// window event listeners:
function setEvents () {
  scrollHeaderPanel.addEventListener('scroll', () => {
    closeCategories()
  })

  scrollHeaderPanel.addEventListener('scrollend', () => {
    if (!g.IsQueueEmpty() || getMiilPhotos_miiluser.user === '') return
    clear_flag = 0
    getMiilPhotos_miiluser.main(-1, 0, '', showMillPhotos)
  }, false)

  griddlesStreams.addEventListener('renderend', event => {
    console.log('renderend')
    const {resolved} = event.detail
    const r = Math.floor(Math.random() * (resolved.length))
    scrollHeaderPanel.setHeaderBackgroungImage(resolved[r].photo.value)
  }, false)

  ms.addEventListener('change', event => {
    const {id, value, placeholder} = event.target
    if (id === 'username') {
      localStorage.username = value || placeholder
    }
  }, false)

  ms.addEventListener("click", function (e) {
    const id = (e.target.id).split("_")[0];
    const ex = (e.target.id).split("_")[1];

    if(id == "releaseBlog") {
      clear_flag = 1;
      showReleases();
    }

    if (id == "fab") {}

    if (id == "toggleTags") {
      slideToggle("stage_category")
    }

    if (id == 'category') {
      ms.querySelector(`#stage_category`).style.display = 'none'
      clear_flag = 1;
      getMiilPhotos_miiluser.main(ex, 1, "",  showMillPhotos);
    }

    if(id == "settings") {
      slideDown("stage_settings");
    }

    if(id == "dsettings") {
      slideUp("stage_settings");
    }

    if(id == "favcancel") {
      slideUp("stage_favs");
    }

    if(id == "listup") {
      slideUp("stage_category");
      listupFavs();
    }

    if(id == "add") {
      var miil_pg_url = ms.querySelector("#fav_input").value;
      var is_valid_miil_pg = isMiilPg(miil_pg_url);
      if(is_valid_miil_pg == 1) {
        addFav(miil_pg_url);
      }
    }

    // 指定したユーザーが投稿した写真を表示する
    if(id === 'showMyPost') {
      clear_flag = 1
      closeCategories()
      getMiilPhotos_miiluser.main(-1, 1, localStorage.username || 'daiz', showMillPhotos)
    }

    if (id === 'showMiilmePost') {
      clear_flag = 1
      closeCategories()
      getMiilPhotos_miiluser.main(-1, 1, 'miilme', showMillPhotos)
    }

    if (id === 'random') {
      clear_flag = 1
      const categories = flatCategories()
      const categoryId = categories[Math.floor(Math.random() * categories.length) - 1]
      console.log('category', categoryId)
      closeCategories()
      getMiilPhotos_miiluser.main(categoryId, 1, '', showMillPhotos)
    }

    // about
    if(id == "about") {
      slideToggle("stage_about");
    }
  }, false)
}
