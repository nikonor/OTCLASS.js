var OTCLASS2 = function(inPar){    

  var action_queue = {};
  var filter_list = {};
  var onError = inPar['onError'];

  __clone = function (obj) {
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
            copy[i] = this.__clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = this.__clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }  
  this.__clone = __clone;


  rollback_add = function(action, data){
    console.log('call rollback_add');
    var new_data = [];
    $.each(action['obj']['data'],function(i,o){
      if (data['new_row']['__otclass_id__'] != o['__otclass_id__']) {
        new_data.push(__clone(o));
      }
    });
    action['obj']['data'] = new_data;
    action['obj'].render();
  };
  this.rollback_add = rollback_add;

  rollback_remove = function(action, data){
    console.log('call rollback_remove');
    var new_data = [];
    // new_data.pus
    action['obj']['data'].push(data['old_row'])
    action['obj'].render();

  };
  this.rollback_remove = rollback_remove;

  rollback_update = function(action, data){
    console.log('call rollback_update');
    var new_data = [];
    $.each(action['obj']['data'],function(i,o){
      if (data['new_row']['__otclass_id__'] != o['__otclass_id__']) {
        new_data.push(__clone(o));
      }else{
        new_data.push(__clone(data['old_row']));
      }
    });
    action['obj']['data'] = new_data;
    action['obj'].render();
  };
  this.rollback_update = rollback_update;


  // Прочие функции
  // функции для замещения
  this.__sort = function(field,d){
    if (!d){d = this}
    d.data.sort(function(a,b){return parseInt(a[field])-parseInt(b[field])});
  }
  this.before_render = function (){};
  this.after_render = function (){};
  this.before_sync = function (){};
  this.after_sync = function (){};
  this.before_action = function (){};
  this.after_action = function (){};


  // перегоняем входные параметры
  for (var key in inPar){
    this[key] = inPar[key];
  }

  // номер страницы, если нужно.
  if (this.page_limit > 0 && !this.page_no){
    this.page_no = 1;
  }

  // штуки для того, чтобы каждый элемент массива данных имел уникальный id в рамках объекта
  this.uniq_count = 0;
  this.__uniq_gen = function(){
    return (this['id'])+'_'+(++this.uniq_count);
  }


  // Model: дату разбираемся с данными
  this.data = inPar['data']; //warning - тут изменили структуру
  for (var i = 0; i < this.data.length; i++) {
    this.data[i]['__otclass_id__'] = this.__uniq_gen();
    this.data[i]['__show__'] = true;
    this.data[i]['__no__'] = i+1;
  };

  // View: тут готовим темплейт
  this.place = $('#'+inPar.div_id);
  this.seq = -1;

  this.tmpl_type = this.tmpl_type || 'Handlebars';
  if (this.tmpl_type == 'Handlebars') {
    this.tmpl = Handlebars.compile($("#"+inPar.tmpl_id).html());
  } else if (this.tmpl_type == 'jquery-tmpl') {
    this.tmpl = $("#"+inPar.tmpl_id).template();
  }

  this.view = '';

  this.render = function (){
    this.before_render();

    // накладываем фильтры
    
    for (var i = 0; i < this.data.length; i++) {
      this.data[i]['__show__'] = false; //выставили всем, что не показываем
      var y_count = 0;
      var f_count = 0;
      for (var f in filter_list){
        var u = {}; u[f] = filter_list[f];
        if (!this.__check(u,this.data[i])){
          console.log('there:'+this.data[i]['name']+':'+this.data[i]['age']);
          y_count++;
        }
      }
      console.log(this.data[i]['name']+':f_count='+f_count+', y_count='+y_count);
      if (f_count == y_count){
        this.data[i]['__show__'] = true;
      }
    };

    if (this.sort){
      this.__sort(this.sort,this);
    }

    var beg_row = 0;
    var end_row = this.data.length;

    
    if (this.page_limit){
      beg_row = this.page_limit * (this.page_no-1);
      end_row = this.page_limit * this.page_no + 1;
    }

    var data4render = {data:[]};

    if (this.page_no > 1){
      data4render.leftnav = this.page_no - 1;
    }

    var count = 0;
    for (var i = 0; i < this.data.length; i++) {
      if ( this.data[i]['__show__'] ){
        if (beg_row <= count && count < end_row){
          data4render['data'].push(__clone(this.data[i]));
        }
        count++;
        if (count > end_row){
          data4render.rightnav = this.page_no + 1;
          break;
        }
      }
    };


    if (this.tmpl_type == 'Handlebars') {
      this.view = this.tmpl(data4render);
    } else if (this.tmpl_type == 'jquery-tmpl') {
      this.view = $.tmpl(this.tmpl, data4render);
    }
    $(this.place).empty();
    $(this.place).empty().append(this.view);
    this.after_render();
  };




  // Control: тут управление 

  this.set = function (key,value){
    this[key] = value;
  }

  this.get = function (key){
    return this[key];
  }


  this.add = function(rows){ 
    this.before_action(); 
    var data4sync = {};

    var old_len = this.data.length;

    // если передали не массив, то делаем массив         
    if (!rows.length){
      var _rows = []; 
      _rows.push(rows);
      rows = _rows;
    }

    for (var i = 0; i < rows.length ; i++) {
      rows[i]['__otclass_id__'] = this.__uniq_gen();
      rows[i]['__show__'] = true;
      this.data.push(rows[i]);
      mes.d('add row: name='+rows[i]['name']);
      var key = dts();if(data4sync.hasOwnProperty(key)){key=key+'-'}
      data4sync[key] = {'turn':'add','id':null,'new_row':this.__clone(rows[i]),'old_row':{}};
    };

    var ret = {};

    if (old_len + rows.length == this.data.length){
      // добавление прошло успешно
      this.render();
      this.sync(data4sync);
      ret = {'status':'Ok'};
    }else{
      // добавление не удалось
      ret = {'status':'error','error_text':'Добавление не удалось'};
    }
    
    this.after_action();
    return ret;
  }; // .add

  this.remove = function(uslovie){
    this.before_action();

    var old_len = this.data.length;
    var ret = {};
    var data4sync = {};

    var new_data=[];

    for (var i = 0; i < this.data.length ; i++) {
      if ( !this.__check(uslovie,this.data[i]) ){

        new_data.push(this.__clone(this.data[i]));
      }else{
        var key = dts();if(data4sync.hasOwnProperty(key)){key=key+'-'}
        data4sync[key] = {'turn':'remove','id':this.data[i]['__otclass_id__'],'old_row':this.__clone(this.data[i])};
      }
    };

    this.data = new_data;
    var DATA = this.data;

    if (this.data.length < old_len){
      this.render();
      ret = {'status':'Ok'};
      this.sync(data4sync);      
    }else{
      ret = {'status':'error','error_text':'Ничего не было удалено'}; 
    }

    this.after_action();
    return ret;
  }; //.remove




  this.update = function(uslovie,rows){
    this.before_action();
    var data4sync = {};

    if (!rows.length){
      var _rows = []; 
      _rows.push(rows);
      rows = _rows;
    }

    for (var i = 0; i < this.data.length ; i++) {
      if (this.__check(uslovie,this.data[i])){
        var key = dts();if(data4sync.hasOwnProperty(key)){key=key+'-'}
        data4sync[key] = {'turn':'update','id':this.data[i]['__otclass_id__'],'old_row':this.__clone(this.data[i])};

        for (var j = 0; j < rows.length; j++) {
          for (var k in rows[j]){
            this.data[i][k] =  rows[j][k];
          }
        };
        data4sync[key]['new_row'] = this.__clone(this.data[i]);
      }
    };

    var ret = {};

    if (1 == 1){
      this.render();
      ret = {'status':'Ok'};
      this.sync(data4sync);      
    }else{
      ret = {'status':'error','error_text':'Ничего не было заменено'}; 
    }

    this.after_action();
    return ret;

  }; //.update


  this.filter = function(uslovie,on){
    // on - если true, то включаем фильтр, если false - выключаем   
    if (uslovie.length){
      for (var i = 0; i < uslovie.length; i++) {
        for (var k in uslovie[i]){
          console.log('loop k='+k);
          if (uslovie[i][k]['val']){
            filter_list[k] = uslovie[i][k];
          }else{
            delete filter_list[k];
          }
        }          
      };
    }else{
      for (var k in uslovie){
        console.log('k='+k);
        if (uslovie[k]['val']){
          filter_list[k] = uslovie[k];
        }else{
          delete filter_list[k];
        }
      }
    }

    this.page_no = 1;    
    console.log(filter_list);

    // for (var i = 0; i < this.data.length ; i++) {
    //   if ( on == 'on' && this.data[i]['__show__'] == true && !this.__check(uslovie,this.data[i]) ){
    //     this.data[i]['__show__'] = false;
    //   }else if ( on == 'off' && this.data[i]['__show__'] == false && this.__check(uslovie,this.data[i]) ){
    //     mes.d('show::'+this.data[i]['name']);
    //     this.data[i]['__show__'] = true;
    //   }
    // }

    this.render();
  }


  this.sync = function (d){
    // action_queue.push 
    // тут надо вызывать если что-то пошло не так 
    // поэтому надо будет откатывать изменения, т.е.
    // было add вызываем remove, где условие тоже самое, что было строкой в add
    // было remove - вызываем add с собранными данными
    // было update - вызываем update cо старыми данными
    // данные собираем в action_queue

    if (this.notsync){
      return '';
    }

    console.log('call sync');
    for (var dts in d) {
      // сохраняем данне, чтобы потом можно было откатиться.
      action_queue[dts] = {'new_row':d[dts]['new_row'],'old_row':d[dts]['old_row'],obj:this};


      var par = {'dts':dts,'obj':this.id,'do_what':'admindb','turn':d[dts]['turn']};
      if ( d[dts]['turn'] == 'remove' ) {
        par['old_row'] = d[dts]['old_row'];
      }else if ( d[dts]['turn'] == 'update' ){
        par['old_row'] = d[dts]['old_row'];
        par['new_row'] = d[dts]['new_row'];
      }else if ( d[dts]['turn'] == 'add' ){
        par['new_row'] = d[dts]['new_row'];
      }
      console.log('send to server');
      console.log(par);
      console.log('action_queue');
      console.log(action_queue);

      $.ajax({
          url:this.script_name,
          data:par,
          dataType:'json',
          success:function(data){
            console.log('recived from server');
            console.log(data);
            if (data['status'] == 'Ok'){
              console.log('OK');
            }else{
              onError(data['error_text']+'\n\naction:'+data['turn']+'\nobject:'+(data['turn'] == 'add'?data['new_row']['name']:data['old_row']['name'])+'\nROLLBACK');
              if (data['turn'] == 'add'){
                rollback_add(action_queue[data['dts']],data);
              }else if (data['turn'] == 'update'){
                rollback_update(action_queue[data['dts']],data);
              }else if (data['turn'] == 'remove'){
                rollback_remove(action_queue[data['dts']],data);
              }else{
                console.log("don't understand");
              }
            }            
            // удаляем задачу из списка, т.к. она уже как-то выполнена
            delete action_queue[data['dts']];
          }
        });
    };

  }


  // mes.d('Finish create object OTCLASS ver 2 id='+inPar['id']); 
  // mes.d('---');   
  // console.log(this);


  // рисуем окончательную версию
  this.render();


  // проверка условий
  this.__check = function(u,r){
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
          }else if (u[i][k][j]['type'] == 'like'){
            // mes.d('call like,'+y_count);
            // mes.d('val='+u[i][k][j]['val']);
            // mes.d('r[k]='+r[k]);
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


}; // OTCLASS