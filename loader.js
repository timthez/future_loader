var root = require('app-root-path');
var fs = require('fs');

var walk = function(dir) {
  var results = []
  
  var list = fs.readdirSync(dir)
  list.forEach(function(file) {
      file = dir + '/' + file
      var stat = fs.statSync(file)
      if (stat && stat.isDirectory()){
        results = results.concat(walk(file))
      }else{        
        results.push(file)
      }
  }) 
  return results;
}
var setupCache = function(mod,list){
   for(var i=0;i < list.length;i++){
     if(list[i].indexOf(mod)>=0){
       global.cacheMap[mod]=list[i];
       return list[i];
     }
   }   
   return "";   
}
var reSetup = function(){
  global.cacheMap={};
  global.tests=[];
  var list= walk(root+"/app");
  var data;
  for(var i=0;i<list.length;i++){    
      data = fs.readFileSync(list[i],'utf8');
      if(typeof data == "string"){
          var str = data.replace(/___(.+)___/g,function(a, b){return "\'"+setupCache(b,list)+ "\'"});
          if(list[i].indexOf('_tests_')>=0){            
           global.tests.push(list[i]);
          }
      }else{
          console.error("File is blank: "+list[i]);
      }      
  }
  fs.writeFileSync('./app/tests/test_list.js',"var TestList = [\n"+ global.tests.map(t=>{return "{test: require('"+t+"'), file: '"+t+"'}"}) +"  \n];\nmodule.exports = TestList;");
}

var find = function(mod){
  if(global.cacheMap[mod] != undefined){
    return global.cacheMap[mod];
  }else{
    console.info("Re-indexing app");
    reSetup();
    if(global.cacheMap[mod] != undefined){
      return global.cacheMap[mod];
    }
    
  }
  console.error("Could Not Find File: "+mod);
}


module.exports = function(data,map){
  this.cacheable(true);  
  if(this.resourcePath.indexOf("/test_list.js" )>=0 && !testsReindexed){
    console.log("Rebuiling Tests", this.resourcePath);
    reSetup();
    testsReindexed = true;
    console.log("Tests Rebuilt");
  }else{
    testsReindexed = false;
  }
  //Parse Files
  var str = data.replace(/___(.+)___/g,function(a, b){return "\'"+find(b)+ "\'"})+ (this.query != "?development" ? "\n//File: "+this.resourcePath+"\n\n" : "");
  
  return str;
}