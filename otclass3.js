otclass3 = function( options ){
  var otclass3_instance = Object.create( OTCLASS3 );
  otclass3_instance.init( options );
  return otclass3_instance;
};

otclass3_options = {
  before_render: function(){},
  after_render: function(){},
  before_sync: function(){},
  after_sync: function(){},
  before_action: function(){},
  after_action: function(){},
  onError: function(){},
  tmpl_type: "Handlebars",
  view: "",
  uniq_count: 0
};

var OTCLASS3 = {    
  init: function( options ){
    console.group('init');
    var self = this;
    
    // self.data = options.data;
    // delete options.data;
    merged_options = $.extend( {}, otclass3_options, options );
    if (/[a-zA-Z]/.test(merged_options['div_id'].substr(0,1))){
      merged_options['div_id'] = '#'+merged_options['div_id'];
    }
    for (i in merged_options){
      this[i] = merged_options[i];
    }

    for (var i = 0; i < self.data.length; i++) {
      self.data[i]['__otclass_id__'] = this._uniq_gen();
      self.data[i]['__show__'] = true;
      self.data[i]['__no__'] = i+1;
    }

    self.before_render = function(d){return self._clone(d);};

    self.filter_list = {};

    // номер страницы, если нужно.
    if (self.page_limit > 0 && !self.page_no){
      self.page_no = 1;
    }
    if (self.tmpl_type == 'Handlebars') {
      self.tmpl = Handlebars.compile($("#"+self.tmpl_id).html());
    } else if (self.tmpl_type == 'jquery-tmpl') {
      self.tmpl = $("#"+self.tmpl_id).template();
    }

    this.render();
    console.groupEnd();
  },

  _clone: function(obj) {
    var self = this;
    // http://stackoverflow.com/questions/728360/copying-an-object-in-javascript

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj){
      return obj;
    }

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = self._clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = self._clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  },
  
  _sort: function(fields){
    console.group('_sort');
    var self = this;
    if (!$.isArray(fields)){
      fields = [fields,];  
    }
    var dynamicSort = function(field) {
      var sortOrder = 1;
      if(field[0] === "-") {
        sortOrder = -1;
        field = field.substr(1, field.length - 1);
      }
      return function (a,b) {
        var result = (a[field] < b[field] ? -1 : (a[field] > b[field]) ? 1 : 0);
        return result * sortOrder;
      }
    }
    var dynamicSortMultiple = function(fields) {
      return function (obj1, obj2) {
        var i = 0, result = 0, number_of_fields = fields.length;
        while(result === 0 && i < number_of_fields) {
          result = dynamicSort(fields[i])(obj1, obj2);
          i++;
        }
        return result;
      }
    }
    self.data.sort(dynamicSortMultiple(fields));
    console.groupEnd();
  },

  sort: function(fields){
    this._sort(fields);
    this.render();
  },
  
  _uniq_gen: function(){
    // штука для того, чтобы каждый элемент массива данных имел уникальный id в рамках объекта
    return (this.id)+'_'+(++this.uniq_count);
  },

  filter: function(uslovie, on){
    // on - если true, то включаем фильтр, если false - выключаем  
    // tk переработать под стиль jQuery.filter() 
    var self = this;
    if (uslovie.length){
      for (var i = 0; i < uslovie.length; i++) {
        for (var k in uslovie[i]){
          // console.log('loop k='+k);
          if (uslovie[i][k]['val']){
            self.filter_list[k] = uslovie[i][k];
          }else{
            delete self.filter_list[k];
          }
        }          
      };
    }else{
      for (var k in uslovie){
        // console.log('k='+k);
        if (uslovie[k]['val']){
          self.filter_list[k] = uslovie[k];
        }else{
          delete self.filter_list[k];
        }
      }
    }

    self.page_no = 1;    
    // console.log(filter_list);

    // for (var i = 0; i < this.data.length ; i++) {
    //   if ( on == 'on' && this.data[i]['__show__'] == true && !this.__check(uslovie,this.data[i]) ){
    //     this.data[i]['__show__'] = false;
    //   }else if ( on == 'off' && this.data[i]['__show__'] == false && this.__check(uslovie,this.data[i]) ){
    //     mes.d('show::'+this.data[i]['name']);
    //     this.data[i]['__show__'] = true;
    //   }
    // }

    self.render();
  },

  render: function(){
    console.group('render');
    console.log('render_run');
    var self = this;
    begin_data = self.before_render(self.data);

    // накладываем фильтры
    
    for (var i = 0; i < begin_data.length; i++) {
      begin_data[i]['__show__'] = false; //выставили всем, что не показываем
      var y_count = 0;
      var f_count = 0;
      for (var f in self.filter_list){
        var u = {}; u[f] = self.filter_list[f];
        if (!self._check(u, begin_data[i])){
          // console.log('there:'+this.data[i]['name']+':'+this.data[i]['age']);
          y_count++;
        }
      }
      // console.log(this.data[i]['name']+':f_count='+f_count+', y_count='+y_count);
      if (f_count == y_count){
        begin_data[i]['__show__'] = true;
      }
    };

    if (self.sort){
      self._sort(self.sort);
    }

    var beg_row = 0;
    var end_row = self.data.length;

    
    if (self.page_limit){
      beg_row = self.page_limit * (self.page_no-1);
      end_row = self.page_limit * self.page_no + 1;
    }

    var data4render = {data:[]};

    if (self.page_no > 1){
      data4render.leftnav = self.page_no - 1;
    }

    var count = 0;
    for (var i = 0; i < begin_data.length; i++) {
      if ( begin_data[i]['__show__'] ){
        if (beg_row <= count && count < end_row){
          data4render['data'].push(self._clone(begin_data[i]));
        }
        count++;
        if (count > end_row){
          data4render.rightnav = self.page_no + 1;
          break;
        }
      }
    };

    if (self.tmpl_type == 'Handlebars') {
      var view = self.tmpl(data4render);
    } else if (self.tmpl_type == 'jquery-tmpl') {
      var view = $.tmpl(self.tmpl, data4render);
    }
    $(self.div_id).empty().append(view);
    self.after_render();
    console.groupEnd();
  },

  // Control: тут управление 
  set: function(key, value){
    this[key] = value;
  },

  _get_row: function(id){
    for (var i=0; i< this.data.length; i++){
      if (this.data[i]['__otclass_id__'] == id){
        return i
      }
    }
    return false;
  },

  get_row: function(uslovie, clone){
    for (var i = 0; i < this.data.length ; i++) {
      if (this._check(uslovie, this.data[i])){
        return (clone ? self._clone(this.data[i]) : this.data[i]);
      }
    }
    return false;
  },

  get: function(key){
    return this[key];
  },

  add: function(rows){
    /* Пробегает по массиву переданных данных, делает для каждого элемента хэш с типом операции 'add',
    новыми данными и пустыми старыми данными.
    Каждый такой хэш получает уникальный ключ, упаковывается в data4sync и передётся в this.sync.
    Возвращает Deferred-объект */
    
    this.before_action(); 
    var data4sync = [],
        old_len = this.data.length;

    // если передали не массив, то делаем массив         
    if (!rows.length){
      rows = [rows,];
    }

    for (var i = 0; i < rows.length ; i++) {
      rows[i]['__otclass_id__'] = this._uniq_gen();
      rows[i]['__show__'] = true;
      this.data.push(rows[i]);
      data4sync.push({'turn': 'add', 'id': null, 'new_row': this._clone(rows[i]), 'old_row': {}});
    };

    var ret = {};
    if (old_len + rows.length == this.data.length){
      // добавление прошло успешно
      // this.render();
      ret = this.sync(data4sync);
    } else {
      // добавление не удалось
      ret = $.Deferred().reject(); 
    }
    this.after_action();
    return ret;
  },

  remove: function(condition){
    this.before_action();

    var data4sync = [],
        new_data = [],
        old_len = this.data.length;

    for (var i = 0; i < this.data.length; i++) {
      if ( !this._check(condition, this.data[i]) ){
        new_data.push(this._clone(this.data[i]));
      } else {
        data4sync.push({'turn': 'remove', 'id': this.data[i]['__otclass_id__'], 'old_row': this._clone(this.data[i])});
      }
    };

    this.data = new_data;

    if (this.data.length < old_len){
      // this.render();
      ret = this.sync(data4sync);      
    }else{
      ret = $.Deferred().reject(); 
    }

    this.after_action();
    return ret;
  },

  update: function(condition, rows){
    this.before_action();
    var data4sync = [];

    if (!rows.length){
      rows = [rows,];
    }

    for (var i=0; i<this.data.length; i++) {
      if (this._check(condition, this.data[i])){
        new_val = {'turn': 'update', 'id': this.data[i]['__otclass_id__'], 'old_row': this._clone(this.data[i])};
        for (var j = 0; j < rows.length; j++) {
          for (var k in rows[j]){
            this.data[i][k] = rows[j][k];
          }
        };
        new_val['new_row'] = this._clone(this.data[i]);
        data4sync.push(new_val);
      }
    };
    // this.render();
    ret = this.sync(data4sync);
    this.after_action();
    return ret;      
  },

  rollback: function(failed_to_send_data){
    if (failed_to_send_data['turn'] == 'add'){
      this._rollback_add(failed_to_send_data);
    } else if (failed_to_send_data['turn'] == 'update'){
      this._rollback_update(failed_to_send_data);
    } else if (failed_to_send_data['turn'] == 'remove'){
      this._rollback_remove(failed_to_send_data);
    } else{
      console.log("don't understand");
    }
  },
  _rollback_add: function(failed_to_send_data){
    console.group('call _rollback_add');
    var new_data = [],
        self = this;
    $.each(self.data, function(){
      if (this.__otclass_id__ !== failed_to_send_data.new_row.__otclass_id__){
        new_data.push(this);
      }
      // if (data['new_row']['__otclass_id__'] != o['__otclass_id__']) {
      //   new_data.push(_clone(o));
      // }
    });
    this.data = new_data;
    this.render();
    console.groupEnd();
  },

  _rollback_remove: function(failed_to_send_data){
    console.group('call _rollback_remove');
    this['data'].push(failed_to_send_data['old_row'])
    this.render();
    console.groupEnd();
  },

  _rollback_update: function(failed_to_send_data){
    // console.log('call _rollback_update');
    var new_data = [],
        self = this;
    $.each(self.data, function(i, o){
      if (failed_to_send_data.new_row.__otclass_id__ != this.__otclass_id__) {
        new_data.push(this);
      }else{
        new_data.push(failed_to_send_data.old_row);
      }
    });
    self.data = new_data;
    self.render();
  },

  sync: function(data4sync){
    // action_queue.push 
    // тут надо вызывать если что-то пошло не так 
    // поэтому надо будет откатывать изменения, т.е.
    // было add вызываем remove, где условие тоже самое, что было строкой в add
    // было remove - вызываем add с собранными данными
    // было update - вызываем update cо старыми данными
    // данные собираем в action_queue
    var self = this,
        requests = [],
        request_types = {add: "POST", update: "PUT", remove: "DELETE", get: "GET"};;
    console.group('sync');
    console.log('data4sync', data4sync);
    self.before_sync();
    if (self.notsync){
      self.render();
      self.after_sync();
      return [$.Deferred().resolve(),];
    }
    $.each(data4sync, function(index, value){
      var par = {'obj': self.id}, 
          current_otclass_elem_id;
      if ( this.turn == 'remove' ) {
        par['old_row'] = this.old_row;
        current_otclass_elem_id = this.old_row.__otclass_id__;
      }else if ( this.turn == 'update' ){
        par['old_row'] = this.old_row;
        par['new_row'] = this.new_row;
        current_otclass_elem_id = this.old_row.__otclass_id__;
      }else if ( this.turn == 'add' ){
        par['new_row'] = this.new_row;
        current_otclass_elem_id = this.new_row.__otclass_id__;
      }
      
      if (self.stringify) {
        par = JSON.stringify(par);
      }
      
      requests.push($.ajax({
        url:        self.script_name,
        data:       par,
        dataType:   'json',
        type:       request_types[this.turn],
        context:    this})
        .done(function(data){
          // Если ответ непустой, то находим в self.data текущий объект и загоняем в него значения из ответа
          if (!$.isEmptyObject(data)){
            $.each(self.data, function(key, value){
              if (this.__otclass_id__ == current_otclass_elem_id) {
                for (i in data){
                  this[i] = data[i];
                }
              }
              return;
            })
          }
          self.render();
        })
        .statusCode({
          400:  function(data){
                  self.OnErrorOrFail(data.responseJSON.message, this);
                },
          403:  function(){
                  self.OnErrorOrFail(data.responseJSON.message, this);
                },
          502:  function(data){
                  self.OnErrorOrFail('Ошибка на сервере. Пишите программистам.', this);  
                }
        })
        .always(function(){
          self.after_sync();
        }))
    })
    console.groupEnd();
    return requests;
  },

  OnErrorOrFail: function(data_from_server, failed_to_send_data){
    this.onError(data_from_server);
    this.rollback(failed_to_send_data);
  },

  check_update: function(new_data){
    console.log(new_data);
    console.log(this.data);
    $.each(this.data,function(i,o){
      $.each(new_data,function(j,oo){
        $.each(o,function(k,ooo){
          // console.log(o.id+','+oo.id+','+k+','+ooo);
          console.log(o[k]+'=='+oo[k])
        });
      });      
    });
    if (this.notsync){
      return '';
    }
  },

  _check: function(u,r){
    // проверка условий
    if (!u.length){
      var _u = []; 
      _u.push(u);
      u = _u;
    }

    //возвраще true, если условие удовлетворяет строке

    var u_count = u.length;
    var y_count = 0;
    for (var i = 0; i < u.length; i++) {
      for (var k in u[i]){
        if (!u[i][k].length){
          var _u = []; 
          _u.push(u[i][k]);
          u[i][k] = _u;
        }

        for (var j = 0; j < u[i][k].length; j++) {
          if (u[i][k][j]['type'] == 'eq'){
            if (u[i][k][j]['val'] == r[k]){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == '=' || u[i][k][j]['type'] == '=='){
            // console.log(parseInt(u[i][k][j]['val'], parseInt(r[k]) ));
            if (parseInt(u[i][k][j]['val']) == parseInt(r[k])){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == '<'){
            if ( parseInt(r[k]) < parseInt(u[i][k][j]['val'])){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == '<='){
            if ( parseInt(r[k]) <= parseInt(u[i][k][j]['val'])){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == '>'){
            if (  parseInt(r[k]) > parseInt(u[i][k][j]['val'])){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == '>='){
            if ( parseInt(r[k]) >= parseInt(u[i][k][j]['val'])){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == 'isnull'){
            if (r[k] == ''){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == 'between'){
            if ( parseInt(u[i][k][j]['val'][0]) <= parseInt(r[k]) && parseInt(r[k]) <= parseInt(u[i][k][j]['val'][1]) ){
              y_count++;
            }
          }else if (u[i][k][j]['type'] == 'like'){
            u[i][k][j]['val'] = u[i][k][j]['val'].replace(/\s/g,".*?");
            var re = new RegExp(u[i][k][j]['val'],'i');
            if ( re.test(r[k]) ){
              y_count++;
            }
          }
        };          
      }
    };
    if (y_count == u_count){
      // mes.d(u_count+'<>'+y_count);
      // совпало
      return true;
    }
    return false;
  }
};
