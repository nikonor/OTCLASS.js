var monthes = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function fill(id, ft, val) {
    var prm = {
      do_what: 'fill',
      ft: ft,
      dts: dts()
    }
    
  $.getJSON('bricks/a.pl', prm, function(data) {
    for (var i in data.items || []) {
      $('<option></option>').val(data.items[i].id).text(data.items[i].name).prop('selected',(data.items[i].id==val?'selected':'')).appendTo($('#'+id));
    }
  })    
}

function doFill(id, ft) {
    return fill(id, ft);
}


function create_div_shadow(id) {
    id = id || 'div_shadow';

    var div = $('<div id="'+id+'"></div>').addClass('shadow');
    div.hide();
    $('body').append(div);
    div.ajaxStart(function() {$(this).show()}).ajaxStop(function() {$(this).hide()});

    var img = $('<img></img>').attr('src', '/img/ajax-loader.gif').css('position', 'absolute').css('left', '50%').css('top', '50%');
    img.appendTo(div);

    return div;
}


function createDivShadow() {
    var div = $('<div></div>').addClass('shadow');
    div.hide();
    $('body').append(div);
    div.ajaxStart(function() {$(this).show()}).ajaxStop(function() {$(this).hide()});
    return div;
}

function fillDivs(data, divDebug, divError) {
    if (data.debug) {
	$('#'+(divDebug ? divDebug : 'divDebug')).html(data.debug);
    }
    if (data.error) {
	alert(data.error);
	$('#'+(divError ? divError : 'divError')).html(data.error);
    }
    if (data.msg) {
	alert(data.msg);
    }
    return;
}

function make_empty_hash(a){
  var h = {}
  for (var i=0;i<a.length;i++){
    h[a[i]] = '';
  }
  return h;
}

function is_number(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isNumber(n) {
    return is_number(n);
}

function trimStr (str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
	if (/\S/.test(str.charAt(i))) {
	    str = str.substring(0, i + 1);
	    break;
	}
    }
    return str;
}

function dts() {
    now=new Date();
    return parseInt(now.getTime().toString().substring(0,10));    
}

function getTimeStamp(){
    now = new Date();
    return parseInt(now.getTime().toString().substring(0,10));
}

function clear_table(ID,NO){
  for (var i = $('#'+ID).get(0).rows.length-1; i >= NO; i--){
    $('#'+ID).get(0).deleteRow(i);
  }
}

function unpretty_dig(d,dd){
  var re = /^<nobr>(.+)?<\/nobr>$/;
  var ddd = d.match(re);
  if (ddd && ddd[1]){
    ddd[1] = ddd[1].replace(/\s/g,'');
    ddd[1] = ddd[1].replace(/,/,'.');
    return ddd[1];
  }else{
    return "0.00";
  }
}
function __ins_spaces(d){
  var ar = d.split('').reverse();
  var aar= new Array();
  var word = '';
  for (var ch in ar){
    word += ar[ch];
    if (word.length == 3){
      aar.push(word.split('').reverse().join(''));
      word = '';
    }
  }
  if (word){
    aar.push(word.split('').reverse().join(''));	
  }
  return aar.reverse().join(' ');
}
function pretty_dig(d,ddd,dd){
  if (!d){
    return "<nobr>0,00</nobr>"
  }
  //if (!ddd){
  if (typeof(ddd) == 'undefined') {
    ddd=2;
  }
  d = ''+(d*1).toFixed(ddd);
  var parts = d.match(/^(-*?)(\d*?)(\.*?)(\d*?)$/);
  var ret = 0;
  var dot = ',';
  if (dd){
    dot = dd;
  }
  
  if (!parts){
    ret = '';
  }else{
    if (!parts[1] && !parts[2] && parts[4]){
      ret = __ins_spaces(parts[4])+dot+'00';
    }else if (parts[1] && !parts[2] && parts[4]){
      ret = parts[1]+__ins_spaces(parts[4])+dot+'00';
    }else if (parts[1] && parts[2] && parts[4]){
      ret = parts[1]+__ins_spaces(parts[2])+dot+parts[4];
    }else if (!parts[1] && parts[2] && parts[4]){
      ret = __ins_spaces(parts[2])+dot+parts[4];
    }else{
      ret = '';
    }
}
    return "<nobr>"+ret+"</nobr>";
}

function prettyDig(d, ddd, dd, nonzero) {
    return pretty_dig(d, ddd, dd, nonzero);
}

function CheckDig(vv,oo){
       if (oo.value<0){
	alert ('Поле должно быть заполнено положительным числом');
	oo.value = vv;
       }	
       if (oo.value/1 != oo.value){
	alert ('Поле должно быть заполнено числом');
	oo.value = vv;
       }	
     }	

function ChangeCurs(f,curs){
	var count = f.length;
	var str='';
	alert ('Count='+count);
	for (i=0;i<count;i++){
		str = str + (i+1)+'-->'+f.elements[i].name+'='+f.elements[i].value;
	}	
	alert (str);
}

function myround(v,d){
  for (var i=0;i<d;i++){
    v*=10;
  }

  v=Math.round(v);

  for (var i=0;i<d;i++){
    v/=10;
  }
  return (v.toFixed(d));
}


function win(str) {
 var sm = window.open(str,"product","width=467,height=500,resizable=yes,scrollbars=yes");
 sm.focus()
}

function minwin(str) {
 sm = window.open(str,"product","width=100,height=100,resizable=no,scrollbars=no");
 sm.focus()
}
	
