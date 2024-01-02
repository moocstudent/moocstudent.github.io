
// var initCards = initialCardsStack()

var repeatRatioMole = 0;
var repeatContinuous = [];
const cardsTotal = 200;
let expectRatioMole = 30;
/**
 * 初始化卡片id
 * @returns {[]}
 */
function initialCardsStack(){
    var stack = new Stack();
    for(var i=0;i<cardsTotal;i++){
        // console.log('initial cards stack loop ',i)
        let randomCardId = this.randomCardId();
        if (stack.peek()==randomCardId){
            repeatRatioMole++;
            //如果重复从前一次就开始了，则记录repeatContnuous
            let index = 0;
            // console.log('r ',i)
            // console.log('stack size ',stack.size())
            for(var r=i-1;r<stack.size();r--){
                // console.log('repeat continuous cards stack loop ',r)
                // console.log('stack.get(r) ',stack.get(r))
                if (randomCardId==stack.get(r)){
                    if(!repeatContinuous[index]){
                        repeatContinuous[index] = 0
                    }
                    // console.log('repeatContinuous[index] ',repeatContinuous[index])
                    let indexReplace = repeatContinuous[index]+=1
                    // console.log('indexReplace ',indexReplace)
                    repeatContinuous[index] = indexReplace
                }else{
                    break;
                }
                index++;
            }
        }
        stack.push(randomCardId)
    }
    let repeatRatioPercent = ((repeatRatioMole/cardsTotal) * 100);
    adjustmentRatio(stack,repeatRatioPercent);
    console.log("repeat ratio: ",((repeatRatioMole/cardsTotal) * 100) + '%' )
    console.log("repeatContinuous: ",repeatContinuous)
    return stack;
}

const gaussianDistribution = [100-68.268949,100-95.449974,100-99.730020,100-99.993666]

function adjustmentRatio(stack,currentRatioMole){
    if(currentRatioMole<expectRatioMole){
        let ratioDiff = expectRatioMole-currentRatioMole;
        //假设差了10个点，现在当前的是20%，而预期是30%，将重复率提10个点
        console.log('ratioDiff',ratioDiff)
    }
}

function adjustmentGaussianLikeLength(){
    if(repeatContinuous.length===gaussianDistribution.length){
    }else if(repeatContinuous.length>gaussianDistribution.length){
        const gaussianDLen = gaussianDistribution.length;
        let short = repeatContinuous.length-gaussianDistribution.length;
        for(var i=0;i<short;i++){
            gaussianDistribution[gaussianDLen+i] = 0
        }
    }else if(gaussianDistribution.length>repeatContinuous.length){
        const repeatConLen = repeatContinuous.length
        let short = gaussianDistribution.length-repeatContinuous.length;
        console.log('short ',short)
        for(var i=0;i<short;i++){
            repeatContinuous[repeatConLen+i] = 0
        }
    }else{
    }
    console.log('repeatContinuous.length ',repeatContinuous.length)
    console.log('repeatContinuous aft adjust  ',repeatContinuous)
}





function randomCardId(){
    return Math.floor(Math.random()*6);
}



