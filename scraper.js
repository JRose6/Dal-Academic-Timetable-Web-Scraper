var casper = require('casper').create();
var fs = require('fs');
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
            getCourseInformation(this);
            getClassInformation(this);
            if(casper.exists(accessors.PAGE_NAVIGATION_LINKS)){
                page_links = this.getElementsInfo(accessors.PAGE_NAVIGATION_LINKS);
                page_links = page_links.splice(0,page_links.length/2);
                for(var i=0;i<page_links.length;i++){
                    casper.echo(page_links[i].attributes.href);
                    casper.thenOpen('https://dalonline.dal.ca/PROD/'+page_links[i].attributes.href,function(){
                        //casper.echo(this.getCurrentUrl());
                        getCourseInformation(this);
                        getClassInformation(this);
                    });
                }
            }
        });
        
    }
    
    
});

var count = 0;
function getCourseInformation(doc){
    var coursenames = doc.getElementsInfo(accessors.COURSENAME);
    var courselinks = doc.getElementsInfo(accessors.COURSE_INFORMATION_LINK);

    for (var i=0;i<coursenames.length;i++){
        outputtext += coursenames[i].html + " - " + courselinks[i].attributes.href +"\n";
        count++;
    }
}
function getClassInformation(doc){
    var coursenames = doc.getElementsInfo(accessors.COURSENAME);
    coursenames.forEach(function(element){
        console.log(element);
    });
}

casper.then(function(){
    casper.echo(outputtext);
    casper.echo(count);
    fs.write("courses.txt",outputtext,'w');
});

casper.run();