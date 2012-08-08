OTCLASS.js
===
# Введение #

## Идея ##

Основная идея этого модуля - разделить данные, их представление и немного упростить работу со всем этим. Для того, чтобы это как-то взлетело, да еще и было кроссброузерно, я решил опираться на следующие правила:

* программист лучше модуля знает, как устроены его данные
* мы работаем только с массивом словарей 
    <code>
        var data = [{'id':1,'name':'foo'},{'id':2,'name':'bar'}];
    </code>
    
* существует четыре основных действия с данными (учитывая наши ограничения):
    * добавление записи (словаря) в массив
    * удаление записи из массива
    * изменение записи в массиве
    * изменения поля в словаре


## Необходимые библиотеки ##
* [http://jquery.org/]() - тут даже не обсуждается :-)
* [otmes.js](https://github.com/nikonor/otmes.js) - нужна для вывода сообщений
* [Handlebars.js](http://handlebarsjs.com/) - шаблонизатор

# Как это работает? #

В общем случае вся работа сводится к созданию объекта и дальнейшим изменением данных в нем. Если все изменения делаются через стандартные вызовы, то модуль автоматически изменит представление данных, конечно, после работы с хранилищем данных.

Рассмотрим подробнее.

## Конструктор ##

Вот так выглядит создание объекта

    var ot = new OTCLASS(
        {'id':'sp_crits',
        'data':data,
        'div_id':'div1',
        'tmpl_id':'nb_tmpl',
        'sort':'field1'
	'debug':1
        });

* **id** - уникальный идентификатор объекта, он передается в базу при синхронизации, для того, чтобы можно было понять, действие с какими объектами надо делать на той стороне.
* **data** - это данные, возвращаемые сервером. Тут надо описать **одну тонкость**, что бы иметь возможность передавать какие-то еще вещи, кроме нужного нам массива, но при этом не обрабатывать лишний раз выдаваемые данные, принято следующее соглашение. Данный объект должен быть словарем, где могут быть любые данны, но тот самый массив словарей должен иметь ключ **list**.
* **div_id** - id объекта (div, p, span), в котором будет лежать перерисованный объект
* **tmpl_id** - id темплейта
* **sort** - необязательное поле, если оно указано, то после каждого изменения данных будет вызываться сортировка данных по полю, которое было передано в данном параметре
* **debug** - параметр дающий возможность работать без сервера. Может принимать 3 возможных значения
	* 1 - сервер "везвращаяет" сообщения, что все прошло нормально
	* 2 - сервер "везвращает" сообщения об ошибке
	* все остальное, в том числе отсутствие параметра - работаем с сервером

*Обращаю внимание на то, что нигде не описывается формат данных, которые передаются в конструктор. Это сделано для того, чтобы добиться максимальной гибкости. Именно это и означает первое правило*


## Основные вызовы ##
### Добавление ###
    ot.add({'id':5,'name':'пять'});
    ot.add([
            {'id':6,'name':'шесть'},
            {'id':7,'name':'семь'}
            ]);

тут все просто. Мы вызываем функцию добавления, передавая в нее либо словарь, либо массив словарей. 


### Удаление ###

    ot.remove({'field':'id','eq':5});
    ot.remove({'field':'name','eq':шесть});        
    
опять же простой вызов. мы указываем какое поле проверяем и чему оно должно быть равно, чтобы строка была удалена. 
    
### Обновление ###
    ot.update({'field':'id','eq':2},{'name':'Новое значение'})
    
Тут все почти аналогично предыдущему примеру. Условие и новое значение словаря
    
### Обновление поля ###
    ot.update_item({'field':'id','eq':3},'name2','НОВОЕ ЗНАЧЕНИЕ В СТРОКЕ');
    
Условие определяет строку массива, которую мы будем менять. Второй параметр определяет поле, которые будет менять. Третий - новое значение.    

### Отправка данных на сервер ###

Вся работа с сервером происходит из функции **sync**. Внутри это функции есть вызов стандартной функции getJSON. Тонкость тут только одна: в файле уже должен быть определена и видима переменная **script_name**, указывающая куда идти на сервере.

## На стороне сервера ##

Сервер получает данные в формате JSON. 

В случае работы через CGI, все довольно легко ложиться в объект типа хэш/словарь. Даже если там есть массивы, а они есть всегда. 

Вот пример вывода объекта, полученного сервером (perl,понятно). 

** UPDATE **

    $VAR1 = {
              'new_rows' => {
                              'next_weight' => '30',
                              'comment3' => 'comment3 text',
                              'name' => 'Name text',
                              'comment4' => 'comment4 text',
                              'weight' => '20',
                              'id' => '2',
                              'comment1' => 'comment1 text',
                              'comment2' => 'comment2 text'
                            },
              'obj' => 'sp_crits',
              'turn' => 'update',
              'uslovie' => {
                             'eq' => '2',
                             'field' => 'id'
                           },
              'dts' => '1344240097',
              'do_what' => 'admindb'
            };

** ADD **

    $VAR1 = {
              'new_rows' => [
                              {
                                'type_id' => '1',
                                'comment3' => 'НОВОЕ ОПИСАНИЕ ОЦЕНИКИ 3',
                                'weight' => '25',
                                'comment4' => 'НОВОЕ ОПИСАНИЕ ОЦЕНИКИ 4',
                                'name' => 'НОВЫЙ КРИТЕРИЙ',
                                'comment1' => 'НОВОЕ ОПИСАНИЕ ОЦЕНИКИ 1',
                                'comment2' => 'НОВОЕ ОПИСАНИЕ ОЦЕНИКИ 2'
                              }
                            ],
              'obj' => 'sp_crits',
              'turn' => 'add',
              'test_hash' => {
                               'eq' => '2',
                               'field' => 'id'
                             },
              'dts' => '1344240668',
              'do_what' => 'admindb'
            };

** REMOVE **

    $VAR1 = {
              'obj' => 'sp_crits',
              'turn' => 'remove',
              'uslovie' => {
                             'eq' => '55',
                             'field' => 'id'
                           },
              'dts' => '1344240771',
              'do_what' => 'admindb'
            };
Вот как этот объект получается. 

    foreach my $p ($q->param()){
        if ($p =~ /\[.+?\]/ ){
            my @pp = map {$_ =~ s/\]//; $_ } split('\\[',$p);
            eval(__make_hash_str("ret",@pp,$uref->fromUTF8("koi8-r", $q->param($p))));
        }else{
            $ret->{$p} = $uref->fromUTF8("koi8-r", $q->param($p));
        }
    }

Теперь рассмотрим, что же мы имеем. 

* obj - тот самый id из конструтора. Для простоты можно использовать имя таблицы или намек на нее
* turn - какую операцию нужно сделать. Тут может быть **только**: add, remove, update
* uslovie - бывает только при turn равном remove или update
* new_rows - словарь или массив словарей c данными, которые надо обрабатывать

Что со всем этим делать дельше - решать вам:-)

## before_render, after_render ##

При вызове конструктора можно переопределить две функции: before_render и after_render. Как ясно из их названия они вызываются до и после перерисовки.  Понятно, что очень просто сделать то же самое для других функций, там вообще код простейший, т.ч. править можно без вопросов.
 

## Прочее ##

## ToDo ##
* работа с befor и after функциями
* сделать возможность работать с разными шаблонизаторами
* сортировка по полю с символом минус. Т.е. desc
* у remove eq может принимать:
    * массив
    * регулярку
* параметр в add чтобы не работать с базой
    * надо ли это?
    * если сделать, то надо переделать конструктор
