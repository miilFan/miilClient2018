/**
 * miilのユーザー名から写真を取得
 */
getMiilPhotos_miiluser = {
  callback: function(){},
  given_next_pg: '',
  user: '',
  nextpg: 0,
  page: '?page=',
  miil_items: [],
  initflag: 0,

  defaultTitle: 'miilClient',

  baseURL: function (categoryId) {
    if (categoryId < 0) return `http://api.miil.me/api/users/${this.user}/photos/public`
    return `http://miil.me/api/photos/recent/categories/${categoryId}`
  },

  /* 次のページが有効かどうかを判定する */
  isValidNextURL: function(next_url) {
    var flag = 1;
    if(next_url == (void 0) || next_url == null || this.nextpg < 0) flag = 0;
    return flag;
  },

  /* 画像リストを取得するための関数 */
  getPhotoURL: function (url) {
    if (url === undefined) {
      console.log('url', url)
      return
    }
    const isMyPhoto = /\/\/api\.miil\.me\/api\/users\//.test(url)
    url = url.replace(/^http:/, 'https:');
    $.ajax({
      type: 'GET',
      url: url,
      dataType: 'jsonp',
      success: function (res) {
        const photos = res.photos;
        const items = getMiilPhotos_miiluser.miil_items;
        const photoUrls = []
        /* 受け取った写真データを保持する */
        for(var i = 0; i < photos.length; i++) {
          var photo = photos[i];
          var item = {};
          item.photo = photo.url;
          item.page = photo.page_url;
          item.title = photo.title;
          //item.received = photo;
          items.push(item);
          photoUrls.push(photo.url)
        }
        /* 次ページの情報を更新する */
        var next_url = res.next_url;
        getMiilPhotos_miiluser.nextpg += 1;
        getMiilPhotos_miiluser.given_next_pg = next_url;
        if (next_url) {
          getMiilPhotos_miiluser.given_next_pg = next_url.replace('.?', '?');
        }

        if (isMyPhoto) window.cacheMiilImages(photoUrls)
        getMiilPhotos_miiluser.callback()
      }
    });
  },

  updateTitle (categoryId) {
    categoryId = parseInt(categoryId)
    if (categoryId === null) {
      document.title = this.defaultTitle
      return
    }
    const cs = miil_normal
    let categoryName = null
    for(let i = 0; i < cs.length; i++) {
      for (let j = 0; j < cs[i].categories.length; j++) {
        const n = qn(cs[i].categories[j].name)
        const c = cs[i].categories[j].category_id
        if (c === categoryId) {
          categoryName = n
          break
        }
      }
    }
    document.title = categoryName || this.defaultTitle
  },

  /* エントリポイント */
  main: function (category, initflag, username, callback) {
    this.initflag = initflag;
    this.callback = callback;
    this.user = username;
    if (initflag === 1) {
      this.nextpg = 0
      this.categoryId = null
    }
    if (category > 0) this.categoryId = category
    if (this.user === '') {
      this.user = undefined
    }
    this.miil_items = [];
    let url = this.baseURL(category);
    if (this.nextpg > 0) url = this.given_next_pg;
    this.updateTitle(this.categoryId)
    this.getPhotoURL(url);
  }
};
