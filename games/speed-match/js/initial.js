
// var initCards = initialCardsStack()


let repeatRatioMole = 0;
let repeatContinuous = [];
const cardsTotal = 200;
let expectRatioMole = 30;
/**
 * 初始化卡片id
 * @returns {[]}
 */
let stack = null;
let stackTotal = 0
function produceCardsStack(){
    if (!stack){
        stack = new Stack();
    }
    repeatContinuous = []
    for(let i=0; i<cardsTotal; i++){
        // console.log('initial cards stack loop ',i)
        let randomCardId = this.randomCardId();
        //这个if里只用于判定重复率计算
        if (stack.peek()===randomCardId){
            repeatRatioMole++;
            //如果重复从前一次就开始了，则记录repeatContnuous
            let index = 0;

            // console.log('r ',i)
            // console.log('stack size ',stack.size())
            //这个for循环只用于判定重复率计算
            for(let r=i-1; r<stack.size(); r--){
                // console.log('repeat continuous cards stack loop ',r)
                // console.log('stack.get(r) ',stack.get(r))
                if (randomCardId===stack.get(r)){
                    if(!repeatContinuous[index]){
                        console.log('repeatContinuous[index] ',repeatContinuous[index])
                        repeatContinuous[index] = 0
                    }
                    console.log('index>>> ',index)
                    repeatContinuous[index] = (repeatContinuous[index] += 1)
                }else{
                    break;
                }
                index++;
            }
        }
        stack.push(randomCardId)
    }
    stackTotal+=cardsTotal
    let repeatRatioPercent = ((repeatRatioMole/cardsTotal) * 100);
    adjustmentRatio(stack,repeatRatioPercent);
    console.log("repeat ratio: ",((repeatRatioMole/cardsTotal) * 100) + '%' )
    console.log("repeatContinuous: ",repeatContinuous)
    return stack;
}



//标准正态分布占比
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
        for(let i=0;i<short;i++){
            gaussianDistribution[gaussianDLen+i] = 0
        }
    }else if(gaussianDistribution.length>repeatContinuous.length){
        const repeatConLen = repeatContinuous.length
        let short = gaussianDistribution.length-repeatContinuous.length;
        console.log('short ',short)
        for(let i=0;i<short;i++){
            repeatContinuous[repeatConLen+i] = 0
        }
    }else{
    }
    console.log('repeatContinuous.length ',repeatContinuous.length)
    console.log('repeatContinuous aft adjust  ',repeatContinuous)
}

function generateData() {
    adjustmentGaussianLikeLength()
    let data = [];
    //以下只是为了排成echarts所需格式
    for(let i=repeatContinuous.length-1;i>=0;i--){
        if(i!==0){
            data.push([-i,repeatContinuous[i]])
        }else if(i===0){
            data.push([i,repeatContinuous[i]])
        }
    }
    for(let i=0;i<repeatContinuous.length;i++){
        if(i!==0){
            data.push([i,repeatContinuous[i]])
        }
    }
    console.log('data ',data)
    return data;
}

function standardGaussianRatio(){
    adjustmentGaussianLikeLength()
    let data = [];
    for(let i=gaussianDistribution.length-1;i>=0;i--){
        if(i!==0){
            data.push([-i,gaussianDistribution[i]])
        }else if(i===0){
            data.push([i,gaussianDistribution[i]])
        }
    }
    for(let i=0;i<gaussianDistribution.length;i++){
        if(i!==0){
            data.push([i,gaussianDistribution[i]])
        }
    }
    return data;
}





function randomCardId(){
    return Math.floor(Math.random()*6);
}



