function judgementRight(){
    if (countTime!=0 || countTime==null){
        return;
    }
    if(popNb===goneValue){
        console.log("correct!!!!!")
        return 1;
    }
    return 0;
}

function judgementLeft(){
    if (countTime!=0 || countTime==null){
        return;
    }
    if(popNb!=goneValue){
        console.log("correct!!!!!")
        return 1;
    }
    return 0;
}


