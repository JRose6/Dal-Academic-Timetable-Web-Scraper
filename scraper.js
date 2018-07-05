var casper = require('casper').create();
var fs = require('fs');
var utils = require('utils');

var filecontents = fs.read('a.json');
var accessors = JSON.parse(filecontents);
var URL = 'https://dalonline.dal.ca/PROD/fysktime.P_DisplaySchedule';
var term_values = [];
var urls = []
classes = [];


casper.start(URL,function(){
    var terms = this.getElementsInfo(accessors.TERM_RADIOBUTTONS);
    for(var i=0;i<terms.length;i++){
        term_values.push(terms[i].attributes.value);
    }
    casper.echo(term_values[0]);
    this.mouseEvent('click', 'input[value="'+term_values[0]+'"]');
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
            casper.echo(this.getCurrentUrl());
            getCourseInformation(this);
            //getClassInformation(this);
            if(casper.exists(accessors.PAGE_NAVIGATION_LINKS)){
                page_links = this.getElementsInfo(accessors.PAGE_NAVIGATION_LINKS);
                page_links = page_links.splice(0,page_links.length/2);
                for(var i=0;i<page_links.length;i++){
                    casper.echo(page_links[i].attributes.href);
                    casper.thenOpen('https://dalonline.dal.ca/PROD/'+page_links[i].attributes.href,function(){
                        casper.echo(this.getCurrentUrl());
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
    console.log(rows.length);
    
    var course = {};
    for(var i=3;i<rows.length;i++){
        var tds = doc.getElementsInfo('table.dataentrytable tr:nth-of-type('+(i)+') td');
        console.log('table.dataentrytable tr:nth-of-type('+(i)+') td');
        if(tds[0].attributes.class == "detthdr"){
            console.log("New Course Found");
            courses.push(course);
            course = {};
            course.name = tds[0].text;
            course.link = tds[0].text;
            course.sections = [];
            course.semester = tds[1].text;
        }
        else if(tds[0].text.indexOf('NOTE')!=-1){
            console.log("Note Found");
            continue;
        }
        else{
            var section = {};
            section.crn = tds[1].text;
            section.section_number = tds[2].text;
            section.type=tds[3].text;
            section.credit_hours = tds[4].text;
            section.days = [tds[6].text,tds[7].text,tds[8].text,tds[9].text,tds[10].text];
            section.times = tds[11].text
            section.locations = tds[12].text
            section.percent_full = tds[17].text;
            section.instructors = tds[20].text;
            course.sections.push(section);
        }
       
    }
}
function getClassInformation(doc){
    
}

casper.then(function(){
    courses.reverse().pop();
    courses.reverse();
    casper.echo("Writing to output");
    fs.write("courses.json",JSON.stringify(courses),'w');
});

casper.run();