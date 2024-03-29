//卡牌堆翻动
var popCount = 0

function cardPop() {
    popCount++
    layui.use(function () {
        var element = layui.element;
        var $ = layui.$;
        if (!document.getElementById("cardProgress")) {
            // 动态插入进度条元素
            $('#headerProgress').html(`
            <div id="cardProgress" class="layui-progress"  lay-filter="cards-use-progress" lay-showpercent="true">
              <div class="layui-progress-bar" lay-percent="0%"></div>
            </div>
          `);
            // 渲染进度条组件
            element.render('progress', 'cards-use-progress');
        }
        popNb = todayCardStack.pop();
        goneValue = popNb;
        showGone(goneValue)
        popNb = todayCardStack.peek();
        showSave(popNb)
        if (todayCardStack.size() / cardsTotal < 0.05) {
            //if cards decrease more then reproduce cards stack
            produceCardsStack()
            myChart.showLoading();
            optionOfGaussian.series[0].data=generateData()
            optionOfGaussian.series[1].data=standardGaussianRatio()
            myChart.setOption(optionOfGaussian);
            myChart.hideLoading();
        }
        console.log('pop count:',popCount)
        console.log('stack total size:',stackTotal)
        element.progress('cards-use-progress', (popCount/stackTotal)*100 +'%');
    });

}


// 封装栈类
function Stack() {
    // 栈中的属性
    this.items = []

    // 栈的相关操作
    // 1.push():将元素压入栈
    //方式一(不推荐)：给对象添加方法，其他对象不能复用
    // this.push = () => {
    // }

    //方式二(推荐)：给Stack类添加方法，能够多对象复用
    Stack.prototype.push = function (element) {
        // 利用数组item的push方法实现Stack类的pop方法
        this.items.push(element)
    }

    Stack.prototype.get = (index) => {
        // console.log('index' ,index)
        return this.items[index]
    }

    // 2.pop():从栈中取出元素
    Stack.prototype.pop = () => {
        // 利用数组item的pop方法实现Stack类的pop方法
        return this.items.pop()
    }

    // 3.peek():查看一下栈顶元素
    Stack.prototype.peek = () => {
        return this.items[this.items.length - 1]
    }

    // 4.isEmpty():判断栈是否为空
    Stack.prototype.isEmpty = () => {
        // 两个小时的教训啊不是this.length(不是Stack对象的length，Stack类没有length属性啊)，而是			Stack类中定义的数组items才有length属性呀
        return this.items.length == 0
    }

    // 5.size():获取栈中元素的个数
    Stack.prototype.size = () => {
        return this.items.length
    }

    // 6.toString():以字符串形式输出栈内数据
    Stack.prototype.toString = () => {
        //希望输出的形式：20 10 12 8 7
        let resultString = ''
        for (let i of this.items) {
            resultString += i + ' '
        }
        return resultString
    }
}
