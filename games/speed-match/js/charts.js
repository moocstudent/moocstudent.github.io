const optionOfGaussian = {
    title: {
        text: '重复率'
    },
    legend: {
        data: ['重复率分布', '标准正态分布']
    },
    animation: false,
    grid: {
        top: 40,
        left: 50,
        right: 40,
        bottom: 50
    },
    xAxis: {
        name: 'x',
        minorTick: {
            show: true
        },
        minorSplitLine: {
            show: true
        }
    },
    yAxis: {
        name: 'y',
        min: -100,
        max: 100,
        minorTick: {
            show: true
        },
        minorSplitLine: {
            show: true
        }
    },
    dataZoom: [
        {
            show: true,
            type: 'inside',
            filterMode: 'none',
            xAxisIndex: [0],
            startValue: -20,
            endValue: 20
        },
        {
            show: true,
            type: 'inside',
            filterMode: 'none',
            yAxisIndex: [0],
            startValue: 0,
            endValue: 50
        }
    ],
    series: [
        {
            name:'重复率分布',
            type: 'line',
            showSymbol: false,
            clip: true,
            data: []
        },
        {
            name: '标准正态分布',
            type: 'line',
            showSymbol: false,
            clip: true,
            data: []
        }
    ]
};
