var rootPath = "../speed-match"

var circleCard = {
    symbolId:0,color:"blue",
    path:rootPath+"/img/circle.png"
}

var triangleCard = {
    symbolId:1,color:"yellow",
    path:rootPath+"/img/triangle.png"
}

var clubsCard = {
    symbolId:2,color:"green",
    path:rootPath+"/img/clubs.png"
}

var starCard = {
    symbolId:3,color:"purple",
    path:rootPath+"/img/star.png"
}

var squareCard = {
    symbolId:4,color:"red",
    path:rootPath+"/img/square.png"
}

var glassCard = {
    symbolId:5,color:"green",
    path:rootPath+"/img/glass.png"
}

var cardStack = [circleCard,triangleCard,clubsCard,starCard,squareCard,glassCard]

function getCard(symbolId){
    return cardStack[symbolId]
}

function getImgPath(symbolId){
    return cardStack[symbolId].path;
}

function getImgBackPath(){
    return rootPath+"/img/back.png"
}

