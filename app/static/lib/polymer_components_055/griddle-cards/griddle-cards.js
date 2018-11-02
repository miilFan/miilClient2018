/* Copyright 2014-2015 daiz, griddlesJS project
 * griddles-ui-card-app
 *
 * app.js
 */

var app = app || {};

// 使用頻度の高い操作をツール化したもの
app.tool = {};

// 文字列のpixel値をNumberとして返す
app.tool.toNum = function(px) {
  return +(number.replce("px", ""));
}

// Numberを文字列のpixel値として返す
app.tool.toPx = function(number) {
  return number + "px";
}

// スクロールバーの横幅をNumberで返す
app.tool.scrollbarWidth = function() {
  var ww = window.innerWidth;
  //TODO: .content依存はマズイ
  var cw = app.thistag.parentNode.clientWidth;
  return ww-cw;
}

// bind機能的なもの
app.tool.binder = function(template, json) {
  var keys = Object.keys(json);
  var code = template;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var rg = new RegExp("{{" + key + "}}", "gi");
    code = code.replace(rg, json[key]);
  }
  return code;
}

app.thistag = ''; /*document.querySelector("griddle-cards");がセットされる*/

// <griddle-cards> のパス
app.me = function() {
  return app.thistag;
}

// <griddle-cards> 内部アクセスのためのパス
app.root = function() {
  return app.thistag.shadowRoot;
}

// トップレベルテンプレート <template id="stage"> 内部アクセスのためのパス
app.stage = function() {
  return app.thistag.shadowRoot.getElementById("stage");
}

// 最適なカードの横幅をNumberで返す
app.flexw = function() {
  var stage_width = window.innerWidth - app.tool.scrollbarWidth();
  var g = app.thistag;
  return getFlexibleWidth(g.column, [g.marginLeft, g.marginRight], stage_width, g.minWidth, g.maxWidth);
}

// <griddle-cards>: ready
app.load = function() {
  var stage = app.stage();
  stage.streams = [];
  var a = app.flexw();
  /* 可能最大カラム数を取得 */
  var column = a[3];
  /* ストリームを生成 */
  for(var i=0; i < column; i++) {
    stage.streams.push({
      width: a[0],
      mleft: a[1],
      mright: a[2],
      mbottom: a[1] + a[2],
      streamHeight: 0,
      cards: []
    });
  }
  /* rippleの表示／非表示対応 */
  if(app.me().noripple != undefined) {
    app.me().card_ripple = 'none';
  }else {
    app.me().card_ripple = 'block';
  }
  app.thistag.parentNode.style.padding = a[1] + "px";
  /* preloadエリアを初期化 */
  app.initPreloadArea(a[0]);
}

// preloadエリアを初期化する
app.initPreloadArea = function(w) {
  var preImgArea = app.root().getElementById("img-griddles");
      preImgArea.style.width = app.tool.toPx(w);
  var preTxtArea = app.root().getElementById("txt-griddles");
      preTxtArea.style.width = app.tool.toPx(w);
  return;
}

// optimizeAdd => preload => addCard
app.addCard = function(comment_and_flag, photo, data, heights) {
  var stage = app.stage();
  var root = app.root();
  /* 追加に最適なストリームのインデックスを取得する */
  min_h_index = app.getIndexOfShortestStream(root, stage);
  var item = {};
      item.comment = comment_and_flag;
      item.photo = photo;
      item.dataset = data;
      item.dataset.heights = heights;
      item.shadowZ = data.shadowZ;
  /* ストリームの長さを更新する */
  stage.streams[min_h_index].streamHeight += heights[0] + heights[1];
  stage.streams[min_h_index].cards.push(item);
  app.me().update = Math.random();
}

app.getItems = function() {
  var stage = app.stage();
  return stage.streams;
}

// photoのURLを最適化してコールバック関数を実行する
app.optimizeAdd = function(comment_and_flag, photo, data) {
  data = data || {};
  var csp = app.me().csp == undefined ? 0 : 1;
  /* photoのURLの最適化 */
  if(csp == 1) {
    /* Content Security Policy に対応する必要あり */
    var xhr = new XMLHttpRequest();
    xhr.open('GET', photo, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      var blob_url = window.URL.createObjectURL(this.response);
      app.preload(comment_and_flag, blob_url, data);
    }
    xhr.send();
  }else {
    app.preload(comment_and_flag, photo, data);
  }
}

// 写真とテキストをプリロードしてheightを取得する
app.preload = function(comment_and_flag, photo, data) {
  var preImgArea = app.root().getElementById("img-griddles");
  var preTxtArea = app.root().getElementById("txt-griddles");
  preImgArea.src = photo + "?" + Math.random(); //csp=noのときは必要
  preTxtArea.innerHTML = comment_and_flag[0];
  preImgArea.onload = function() {
    var img_h = preImgArea.offsetHeight;
    var txt_h = preTxtArea.offsetHeight;
    if(comment_and_flag[1] == "none") {
      txt_h = 0;
      data.photo_only = 1;
    }else {
      data.photo_only = 0;
    }
    app.addCard(comment_and_flag, photo, data, [img_h, txt_h]);
  }
}

// 長さが最も短いストリームのインデックスを返す
app.getIndexOfShortestStream = function(root, stage) {
  var min_h_index = 0;
  var min_h = app.stage().streams[0].streamHeight;
  for(var i=0; i < stage.streams.length; i++) {
    var h = app.stage().streams[i].streamHeight;
    if(h < min_h) {
      min_h = h;
      min_h_index = i;
    }
  }
  return min_h_index;
}

// 全てのストリームのカードとストリーム長のデータをクリアする
app.clearStreams = function() {
  app.load();
}

// 未表示のカードのストック
// 先頭から表示していき、その都度先頭の要素を除去する
app.cards = [];

// カードが新規追加／削除されたときの挙動
window.addEventListener("griddle-cards-update", function() {
  if(app.cards.length > 0) {
    var card = app.cards[0];
    app.cards.shift();
    app.thistag.pushCard(card.text, card.src, card.dataset);
  }else {
    app.thistag.end = Math.random();
  }
}, false);

/* ============================== */

Polymer('griddle-cards', {
  ready: function(e, detail, sender) {
    app.thistag = this;
    app.load();
    this.job('job1', function() {
      this.fire("griddle-cards-ready");
    }, 500);
  },

  cardClicked: function(e, detail, sender) {
    var cn = e.target.className;
    /* paper-ripple を無効化した場合に必要になるコード */
    if(app.me().noripple != undefined) {
      var cns = cn.split(' ');
      for(var i=0; i < cns.length; i++) {
        var c = cns[i];
        if(c.search(/g\_/) == 0) {
          cn = c;
          break;
        }
      }
    }
    /* ---- */
    cn = cn.split(' ')[1]
    var stream = +cn.split('@')[1];
    var index  = +(cn.split('@')[0].replace('g_', ''));
    var card = app.stage().streams[stream].cards[index];
    this.lastClickedCard = card;
    this.fire("griddles-cards-click")
  },

  pushCard: function(comment_and_flag, photo, data) {
    app.optimizeAdd(comment_and_flag, photo, data);
  },

  getCards: function() {
    return app.getItems()
  },

  clearStreams: function() {
    app.clearStreams();
  },

  setCards: function(cards) {
    if(app.cards.length == 0) {
      app.cards = cards;
      app.me().update = Math.random();
    }
  },

  getTool: function() {
    return app.tool;
  },

  lastClickedCard: {},

  column     : 2,
  marginLeft : 2,
  marginRight: 2,
  minWidth   : 193,
  maxWidth   : 560,

  /* polymer events */
  updateChanged: function() {
    this.fire("griddle-cards-update");
  },

  endChanged: function() {
    this.fire("griddle-cards-end");
  }

});
