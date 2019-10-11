//采用面向对象的写法

//首先一个构造函数

function Sweep(tr, td, mineNum) {
    this.tr = tr;//行数
    this.td = td;//列数
    this.mineNum = mineNum;//雷的数量

    this.squares = [];//储存所有方块的信息，它是一个二维数组，按行与列的方式排放，存取都使用行列的形式
    this.tds = [];//储存所有单元格的DOM(二维数组)
    this.spareNum = mineNum; //剩余雷的数量
    this.trueNum = 0;//储存正确旗子的数量
    this.clickNum = 0;//记录插同一面旗的点击次数
    this.parent = document.getElementsByClassName('gamebox')[0];
}

//初始函数，把方法都放在这里执行
Sweep.prototype.init = function() {
    //把每个方块的信息存储起来
    var mineArr = this.createNum();//雷的位置
    var n = 0;
    for(i = 0; i < this.tr; i ++) {//行列的坐标和实际方块的坐标是相反的   
        /*
        按行列的方法排列  0,0  0,1  0,2
        坐标             0,0  1,0  2,0
        */ 
        this.squares[i] = [];
        for(j = 0; j < this.td; j ++) {
            if(mineArr.indexOf(n ++) != -1) { //判断该位置是否有雷 n++可以保证从第零为开始遍历
                this.squares[i][j] = {type: 'mine', x: j, y: i};
            }else {
                this.squares[i][j] = {type: 'number', x: j, y: i, value: 0  };
            }
        }
    }  
    // console.log(this.squares); 
    this.updateNum();
    this.createDom();
    //取消右键的默认事件,加在父级上性能会更好,事件委托
    this.parent.oncontextmenu = function() {
        return false;
    }

    this.spareMine = document.getElementsByClassName('mine-num')[0];
    this.spareMine.innerHTML = this.mineNum;
    this.spareNum = this.mineNum;//避免重新开始的时候，this.spareNum还是为0
    this.trueNum = 0;//避免重新开始时，trueNum为10

}

//生成n个随机数，创建雷
Sweep.prototype.createNum = function() {
    var numArr = new Array(this.tr * this.td);//创建一个长度为所有格子数量的数组
    for(i = 0; i < numArr.length; i ++) {
        numArr[i] = i;
    }
    numArr.sort(function () {
        return 0.5 - Math.random();
    });//打乱数组的顺序
    return numArr.slice(0, this.mineNum);
}//利用乱序的数组来生成相应数量的随机雷

//创建游戏格子
Sweep.prototype.createDom = function() {
    var table = document.createElement('table');
    table.cellPadding = '1px';
    var that = this;
    for(i = 0; i < this.tr; i ++) {//行
        var tr = document.createElement('tr');
        this.tds[i] = [];
        for(j = 0; j < this.td; j ++) {//列
            var domTd = document.createElement('td');
            this.tds[i][j] = domTd ;
            tr.appendChild(domTd );
            domTd.pos = [i, j] //给每一个格子绑定上他们的位置
            //在td上绑定鼠标按下的事件
            domTd.onmousedown = function() {
                that.play(event,this); //that指向sweep,this指向domTd
            }
            
        }
        table.appendChild(tr);
    }
    this.parent.innerHTML = '';//每次创建时把之前创建的清空，避免出现多次点击创建出多个dom
    this.parent.appendChild(table);
}

/*
    x-1,y-1 <--   x,y-1 (雷的位置)  -->  x+1,y-1
    x-1,y <--   x,y (雷的位置)  -->  x+1,y
    x-1,y+1 <--   x,y (雷的位置)  -->  x+1,y+1
*/

//以雷的位置为中心，找周围八个格子的坐标
Sweep.prototype.findAround = function(coordnate) {//把所有格子的坐标传进去
    var x = coordnate.x,
        y = coordnate.y,
        result = [];//存放方块类型为数字的坐标（二维数组）
    //嵌套循环行与列
    for(var i = x - 1; i <= x + 1; i ++) {
        for(var j = y -1; j <= y + 1; j ++) {
            if(
                i < 0 || //格子超出左边
                j < 0 || //格子超出上边
                i > this.td - 1 || //格子超出右边
                j > this.tr - 1 || //格子超出下边
                (i == x && j == y) || //格子是自己本身
                (this.squares[j][i].type == 'mine') //不用找雷
            ){
                continue;
            }
            result.push([j,i]);//以行与列的方式返回出去，方便数组取用
        }
    }
    return result;
}

//更新数字
Sweep.prototype.updateNum = function() {
    //循环所有格子，以类型为雷的格子为中心找数字
    for(var i = 0; i < this.tr; i ++) {
        for(var j = 0; j < this.td; j ++) {
            if(this.squares[i][j].type == 'number') {
                continue;
            }
            //找到一个雷，数字就加一
            var num = this.findAround(this.squares[i][j]);
            //num ---> [[x,y],[x1,y1],[x2,y2],[x3,y3]]  我们需要的是x,y的值
            for(var k = 0; k < num.length; k ++) {
                this.squares[num[k][0]][num[k][1]].value ++;    
            }
        }
    }
}

//点击  --->  play
Sweep.prototype.play = function(et, obj) { //因为要判断是左键还是右键，所以要传入事件
    //判断左右键，左键  e.which = 1; 右键  e.which = 3
    var consquare  = this.squares[obj.pos[0]][obj.pos[1]];//点击到方块的信息{type: ...,x: ...,y: .....}
    var that = this;
    var cl = ['zero','one','two','three','four','five','six','seven','eight']
    if(et.which === 1 ) { //后面的条件保证点击的不是已经插旗的方块
        if(consquare.type == 'number') {
             //判断是否是数字
            obj.innerHTML = consquare.value;
            obj.className = cl[consquare.value];

            //判断是否为0
            if(consquare.value == 0) {
                obj.innerHTML = ''; //数字为0时，不显示数字

                /*
                点到0的时候，出现一大片（递归）
                1.点击 0
                   1.显示自己
                   2.以自己为中心找周围  假如为0
                      1.显示自己
                      2.以自己为中心找周围  ...
                直到找到不为0的数字，停止
                */
               function findAllZero(square) { //把坐标传进去
                    var round = that.findAround(square);//找周围
                    //循环周围的格子
                    for(var i = 0; i < round.length; i ++) {
                        var x = round[i][0];//行
                        var y = round[i][1];//列

                        that.tds[x][y].className = cl[that.squares[x][y].value];//给循环到的每一个格子设置样式
                        //以某个格子为中心向四周找，找到0
                        if(that.squares[x][y].value == 0) {
                            if(!that.tds[x][y].lock) {//剔除掉那些已经找过的格子
                                //给td设置属性，找过的值为true，保证下一次不会再循环它，没有这个属性的就要循环
                                that.tds[x][y].lock = true;
                                findAllZero(that.squares[x][y]);
                            }
                        }else{
                        //以某个格子为中心向四周找，找到非0
                            that.tds[x][y].innerHTML = that.squares[x][y].value;
                        }
                    }
               }
               findAllZero(consquare);
            }
        }else{
            //点到雷就游戏失败
            this.gameOver(obj);
        }
    }
    //点击右键
    if(et.which == 3) {
        /*
        点击右键的功能
        1.插红旗，再次点击红旗取消
        2.判断红旗所在地方是不是雷
        3.点击位置为数字，不能插旗
        4.剩余雷数随旗子变化
        */
       if(obj.className && obj.className != 'flag') {
           //功能3
           return;
       }
       obj.className = obj.className=='flag'?'':'flag';//功能1
       if(this.squares[obj.pos[0]][obj.pos[1]].type == 'mine') {//功能2
        /*
        若该方格没有被点击过，则重新记录它的点击数量,再次点击时，点击数量增加
        */
           if(!this.tds[obj.pos[0]][obj.pos[1]].flag) {//若这个方格没有被点击过，则进入函数
            this.tds[obj.pos[0]][obj.pos[1]].flag = true;//点击过后就要标记后好
            this.clickNum = 0;
            this.trueNum ++;
           }else {
               this.clickNum ++;
               if(this.clickNum % 2 == 1) {
                   this.trueNum --;
               }
               if(this.clickNum % 2 == 0) {
                this.trueNum ++;
               }
           }
       }
       //剩余雷数一定是大于等于0
       if(this.spareNum > 0) {
            if(obj.className == 'flag') {
                this.spareNum --;
                this.spareMine.innerHTML = this.spareNum;
            }else{
                this.spareNum ++;
                this.spareMine.innerHTML = this.spareNum;
            }
       }
       console.log(this.spareNum)
       console.log(this.trueNum)
       //判断游戏是成功还是失败
       if(this.spareNum == 0){
            if(this.trueNum == this.mineNum){
                alert('恭喜你，游戏成功！')
            }else{
                alert('很遗憾，游戏失败！')
                this.gameOver();
            }

       }
       
    }
}

Sweep.prototype.gameOver = function(downTd){
    /*
    游戏失败
    1.显示所有雷
    2.取消所有格子的点击事件
    3.点击的格子颜色变红色
    */
    //循环所有格子
    for(var i = 0; i < this.tr; i ++) {
        for(var j = 0; j < this.td; j ++) {
            if(this.squares[i][j].type == 'mine') {
                this.tds[i][j].className = 'mine';
                
            }
            this.tds[i][j].onmousedown = null;
        }
    }
    if(downTd) {
        downTd.style.backgroundColor = '#f00';
    }

}

//点击最上面按钮，切换等级功能
var btns = document.getElementsByTagName('button');
var state = 0;//记录当前按钮的状态
var sweep = null;//实例记录
var arr = [[9,9,10],[16,16,40],[28,28,99]];//不同级别的参数数组（二维数组）

for(let i = 0; i < btns.length - 1; i ++) { //利用let解决闭包带来的问题
    btns[i].onclick = function () {
        btns[state].className = '';//去除上一个点击的样式
        this.className = 'active';//给点击的按钮添加样式
        sweep = new Sweep(...arr[i]);
        console.log(sweep.createNum());
        console.log(sweep.squares);
        sweep.init();
        state = i;
    }
}
btns[0].onclick();//初始化游戏
btns[3].onclick = function() {
    
    sweep.init();
}

/*
bug
1.雷的数量不对，传进10个雷，最后出现的雷数不一样
2.旗子重复插会影响最后结果的判断
*/

