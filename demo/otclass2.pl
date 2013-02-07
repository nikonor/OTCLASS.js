#!/usr/bin/perl 
use CGI qw/:standard/;
use CGI::Carp qw/fatalsToBrowser/;
use lib "../lib";
# use OTLib;
# use OTLib::DB;
# use OTLib::Auth;
# use OTLib::MyDBI;
# use OTLib::RECORDSET;
# use OTLib::Form;
use strict;
use DBI;
use CONF;
use Carp;
use Utils;
use POSIX qw(locale_h);
use Unicode::UTF8simple;
use Template;
use JSON;
use locale;
use Data::Dumper;

setlocale(LC_COLLATE,"ru_RU.KOI8-R");

my $db = OTLib::DB->new("conf"=>CONF->new("filename"=>"config.txt"));
my $dbh = $db->{dbh};

################
#
#    начало тестов
#
################
# if (!$ENV{'HTTP_X_FORWARDED_USER'}){  
#     use Test::More qw(no_plan);
#     $db->oops();
#     exit(0);
# }

my $username = $ENV{HTTP_X_FORWARDED_USER};$ENV{REMOTE_USER}=$ENV{HTTP_X_FORWARDED_USER};

my $q = CGI->new();

my $auth = OTLib::Auth->new("dbh"=>$db->{dbh},"username"=>$username);

my $param;
my $do_what = $q->param('do_what') || 'main';


unless ($do_what eq 'print'){
    print $q->header(-charset=>'koi8-r');
}


my $funcs = {   
        "main"  => \&main,
        'admindb'   => \&admindb
};

$param->{script_name} = $ENV{SCRIPT_NAME};
# $param->{row_id} = $row_id;
$param->{salesman_id} = $q->param('salesman_id');

unless ($funcs->{$do_what}){
    print "не понял, что делать";
    warn("не понял, что делать. do_what=$do_what");
    $db->oops();
    exit(1);
}

$param = $funcs->{$do_what}($param);

$param->{menu} = Menu($dbh,1);
my $tmpl = Template->new("INTERPOLATE"=>0, "INCLUDE_PATH"=>"../templates/");
$tmpl->process("otclass2.tmpl", $param);
warn ($tmpl->error());

$db->oops();
exit(1);

sub demo_add_row{
    my $r  = shift;
    warn('call demo_add_row');
    warn(Dumper($r->{new_row}));
    # sleep('3');
    # return (0,'');

    if ($r->{new_row}{age} eq '2'){
        return (0,200);
    }else{
        return (1,'ошибка 22');
    }
}

sub demo_update_row{
    warn('call demo_update_row');
    my $r  = shift;
    warn('call demo_update_row');
    warn(Dumper($r->{new_row}));
    # sleep('3');

    return (1,'error on update');
}


sub demo_remove_row{
    warn('call demo_remove_row');
    return (1,'error on delete');
}


sub demo2_add_row{
    warn('call demo2_add_row');
    return (1,'');
}


sub demo2_remove_row{
    warn('call demo2_remove_row');
    return (1,'');
}


sub demo2_update_row{
    warn('call demo2_update_row');
    return (1,'');
}

sub admindb {
    my $e = 1;
    my $uref = new Unicode::UTF8simple;
    my $ret = shift;


    my $json_data = $q->param('POSTDATA');
    warn('json_data');
    warn(Dumper($q->param()));


    # дерево функция
    my $tree = {
        'add'=>{
            'demo'=>\&demo_add_row,
            'demo2'=>\&demo2_add_row
        },
        'remove'=>{
            'demo'=>\&demo_remove_row,
            'demo2'=>\&demo2_remove_row
        },
        'update'=>{
            'demo'=>\&demo_update_row,
            'demo2'=>\&demo2_update_row
        }        
    };

    warn('--- start ---');
    foreach my $p ($q->param()){
        # warn("=$p=".($q->param($p))."=");
        if ($p =~ /\[.+?\]/ ){
            my @pp = map {$_ =~ s/\]//; $_ } split('\\[',$p);
            eval(__make_hash_str("ret",@pp,$uref->fromUTF8("koi8-r", $q->param($p))));
        }else{
            $ret->{$p} = $uref->fromUTF8("koi8-r", $q->param($p));
        }
    }


    warn(Dumper($ret));
    warn('--- finish ---');

    my $data4ret = {'dts'=>$q->param('dts')};

    my ($status,$error_text);

    if ($tree->{$q->param('turn')}{$q->param('obj')}){
        ($status,$error_text) = $tree->{$q->param('turn')}{$q->param('obj')}($ret);
        warn("!$status!$error_text!");
        if ($status){
            $data4ret->{status} = 'Error';
            $data4ret->{turn} = $ret->{turn};
            $data4ret->{error_text} = $error_text;
            $data4ret->{new_row} = $ret->{new_row};
            $data4ret->{old_row} = $ret->{old_row};
        }else{
            $ret->{new_row}{id} = $error_text if ($q->param('turn') eq 'add');
            $data4ret->{new_row} = $ret->{new_row};
            $data4ret->{status} = 'Ok';
        }
    }else{
        die('not define function');
    }

    print to_json($data4ret);
    $db->oops();
    exit(1);    
    

}

sub main{
    my $p = shift;

    return $p;
}


sub __make_hash_str{
    my ($name,@par) = @_;
    my $val = pop(@par);

    my $r = "\$".$name."->";

    foreach my $i (@par){
        if ($i =~ /^\d+$/){
            $r .= "\[$i\]";
        }else{
            $r .= "\{\'$i\'\}";
        }
    }
    $r.= "='$val';";

    return $r;
}