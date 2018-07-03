var fs = require('fs');
outputtext="Check it";

fs.writeFile("courses.txt",outputtext,function(err){
    console.log(err);
});