function judgementRight(){
    if (countTime!=0 || countTime==null){
        return;
    }
    if(popNb===goneValue){
        console.log("correct!!!!!")
    }
}

function judgementLeft(){
    if (countTime!=0 || countTime==null){
        return;
    }
    if(popNb!=goneValue){
        console.log("correct!!!!!")
    }
}
