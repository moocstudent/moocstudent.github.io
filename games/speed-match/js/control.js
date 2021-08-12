//时钟
function clock()
{
    var d=new Date();
    var t=d.toLocaleTimeString();
    document.getElementById("clock").innerHTML=t;
}

var int=self.setInterval("clock()",1000);

//倒计时count
function count(){
    document.getElementById("count").innerHTML=countDown(6);
}
var countIntervalId=self.setInterval("count()",1000);

//倒计时
function countDown(time) {
    if (countTime == null) {
        countTime = time;
    }
    if (countTime==0){
        clearInterval(countIntervalId)
        // showGone(goneValue)
        cardPop()
        return "start";
    }
    console.log("game start with :" + countTime + "second after")
    countTime--;
    return "game start with :" + countTime + "second after"
}

//展示stack存货
function showSave(cardId) {
    var imgPath = getImgPath(cardId);
    saveNode.innerHTML= "<img width='200' height='200' src="+imgPath+"></img>"
}
//展示已经翻牌的
function showGone(goneCardId){
    var imgPathGone = getImgBackPath(goneCardId);
    goneNode.innerHTML= "<img width='200' height='200' src="+imgPathGone+"></img>"
}

