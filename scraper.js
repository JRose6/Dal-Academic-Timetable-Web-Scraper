var casper = require('casper').create();
var fs = require('fs');

var filecontents = fs.read('a.json');
var accessors = JSON.parse(filecontents);
var URL = 'https://dalonline.dal.ca/PROD/fysktime.P_DisplaySchedule';
var term_values = [];
var urls = []
classes = [];

String.prototype.replaceAll = function (replaceThis, withThis) {
    var re = new RegExp(replaceThis, "g");
    return this.replace(re, withThis);
};
String.prototype.indexOf2 = function (str){
    var index = this.indexOf(str);
    return index==-1?this.length:index;
}
String.prototype.insertAfterAll = function(reg){
    
    while(this.indexOf(reg)!=-1){
        var index = this.indexOf(reg);
        
    }
}
casper.start(URL,function(){
    var terms = this.getElementsInfo(accessors.TERM_RADIOBUTTONS);
    for(var i=0;i<terms.length;i++){
        term_values.push(terms[i].attributes.value);
    }
    casper.echo(term_values[0]);
    this.mouseEvent('click', 'input[value="'+term_values[3]+'"]');
    this.click(accessors.SUBMIT_FORM_SELECTOR);
});

casper.waitForSelector(accessors.SUBJECT_LIST_CLASS);
casper.then(function(){
    casper.echo(this.getTitle());
    var links = casper.getElementsInfo(accessors.LIST_LINKS);
    for(var i=0;i<links.length;i++){
        urls.push('https://dalonline.dal.ca/PROD/'+links[i].attributes.href);      
    }
    
});
var outputtext = "";
casper.then(function(){
    for(var i=0;i<urls.length;i++){
        var page_links = [];
        casper.thenOpen(urls[i],function(){
            getCourseInformation(this);
            //getClassInformation(this);
            if(casper.exists(accessors.PAGE_NAVIGATION_LINKS)){
                page_links = this.getElementsInfo(accessors.PAGE_NAVIGATION_LINKS);
                page_links = page_links.splice(0,page_links.length/2);
                for(var i=0;i<page_links.length;i++){
                    casper.thenOpen('https://dalonline.dal.ca/PROD/'+page_links[i].attributes.href,function(){
                        getCourseInformation(this);
                    });
                }
            }
        });
        
    }
});
var courses = [];
var count = 0;
function getCourseInformation(doc){
   // fs.write("table.txt",utils.dump(doc.body),'w');
    
    var rows = doc.getElementsInfo('table.dataentrytable tr');
    var course = {};
    for(var i=3;i<rows.length;i++){
        try{
            
            var tds = doc.getElementsInfo('table.dataentrytable tr:nth-of-type('+(i)+') td');
            if(tds[0].attributes.class == "detthdr"){
                courses.push(course);
                course = {};
                course.name = tds[0].text.substring(0,tds[0].text.indexOf2("Course equivalent")).replaceAll("\n"," ").trim();
                course.link = doc.getElementInfo('table.dataentrytable tr:nth-of-type('+(i)+') td a').attributes.href;
                course.sections = [];
                course.semester = tds[1].text.replaceAll("\n"," ").trim();
                console.log(course.name);
            }
            else if(tds[0].text.indexOf('NOTE')!=-1){
                continue;
            }
            else{
                var section = {};
                section.crn = tds[1].text.replaceAll("\n"," ").trim();
                section.section_number = tds[2].text.replaceAll("\n"," ").trim();
                section.type=tds[3].text.replaceAll("\n"," ").trim();
                section.credit_hours = tds[4].text.replaceAll("\n"," ").trim();
                section.days = [tds[6].text,tds[7].text,tds[8].text,tds[9].text,tds[10].text];
                section.times = tds[11].text.replaceAll("/n","|");//.replaceAll("\n"," ").trim();
                section.locations = tds[12].text.replaceAll("\n"," ").trim();
                section.percent_full = tds[17].text.replaceAll("\n"," ").trim();
                section.instructors = tds[20].text.replaceAll("\n"," ").trim();
                course.sections.push(section);
            }

        }
        catch(err){
            console.log(err);
        }  
    }
}

casper.then(function(){
    courses.reverse().pop();
    courses.reverse();
    casper.echo("Writing to output");
    fs.write("courses.json",JSON.stringify(courses),'w');
});

casper.run();