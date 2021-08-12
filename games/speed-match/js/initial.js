
// var initCards = initialCardsStack()


/**
 * 初始化卡片id
 * @returns {[]}
 */
function initialCardsStack(){
    var stack = new Stack();
    for(var i=0;i<200;i++){
        let randomCardId = this.randomCardId();
        stack.push(randomCardId)
    }
    return stack;
}



function randomCardId(){
    return Math.floor(Math.random()*5);
}



