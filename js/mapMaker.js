/*起動時に読み込まれる関数*/
window.onload = function(){
  var fn = "data";
  loadData(fn);
}

//ページ離れたときにも一回dataテキストを上書き
window.onbeforeunload = function(){
  resetData();
}

var canvas = document.getElementById('mapArea');
var context = canvas.getContext('2d');

//ノードに関する変数
var nodeLastID = -1;
var nodeList = [];

//リンクに関する変数
var linkLastID = -1;
var linkList = [];

//選択状態を記憶していく配列
var selectedNode = [];
var highlightedNode = [];

// 0:display, 1:select, 2:edit
var mode = 0;

var downX;
var downY;

var mouseX = 0;
var mouseY = 0;

//logを保存するための配列
var logList = [];

canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mousemove', movehandler, false);
canvas.addEventListener('dblclick', onDblClick, false);

// textObject （ノード）が表示されるオブジェクト
function textObject(txt, x, y) {
  console.log("textObject");
  this.id = ++nodeLastID;        // 通し番号としてのIDがついている
  this.selected = false;     // ダブルクリックするとselected がtrueになる
  this.highlight = false;    // 移動させるとき、highlight 表示になる
  
  this.nodeWidth = 10;
  this.nodeHeight = 36;
  this.txt = txt; // 文字列は値渡し

  // デフォルトの表示位置は一つづつ異なる
  //ノードの左上の座標が格納されている
  this.x =  x;
  this.y =  y;

  // get object ID
  this.getNodeID = function() {
    return this.id;
  }

  // オブジェクトの表示
  this.display = function(ctx) {
    this.nodeWidth = ctx.measureText(txt).width + 10;
    if (this.selected) {
    // 選択されているのならば白色の背景になる
      ctx.fillStyle = "rgb(255, 255, 255)";
    } else {
    // 選択されていなければ灰色の背景になる
      ctx.fillStyle = "rgb(125, 125, 125)";
    }
    ctx.fillRect(this.x, this.y, this.nodeWidth, this.nodeHeight);

    if (this.highlight) {
    // マウスボタンが押されているときに対応するオブジェクトは赤枠になる
      ctx.strokeStyle = "rgb(255, 0, 0)";
    } else {
    // それ以外の時は黒色
      ctx.strokeStyle = "rgb(0, 0, 0)";
    }
    ctx.strokeRect(this.x, this.y, this.nodeWidth, this.nodeHeight);

    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillText(this.txt, this.x + 4, this.y + 26, this.nodeWidth*0.98);
  }

  // ポインタの下にあるかどうかを判別する
  this.checkHit = function(x, y) {
    if (x >= this.x && x <= this.x + this.nodeWidth) {
      if (y >= this.y && y <= this.y + this.nodeHeight) {
        return true;
      }
    }

    return false;
  }

  // ポインタの下にあるときハイライトする
  this.checkHL = function(x, y) {
    this.highlight = this.checkHit(x, y);
  }

  // 現在の位置情報を一時保存
  this.store = function() {
    this.lastX = this.x;
    this.lastY = this.y;
  }

  // 一時保存した位置情報を復活させる
  this.restore = function() {
    this.x = this.lastX;
    this.y = this.lastY;
  }

  // 位置決め 絶対値
  this.locate = function(x, y) {
    this.x = x;
    this.y = y;
  }

  // 位置決め 相対値
  this.move = function(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
}

//リンクを表示するオブジェクト
//必要な引数：リンクを繋げる二つのノードID
function linkObject(before, after, txt){
  console.log("linkObject");
  if(txt == ''){
  }
  else{
    this.id = ++linkLastID;
    //リンクをつなげるノードのID情報が入るところ
    this.before = before;
    this.after = after;
    
    this.nodeWidth = 10;
    this.nodeHeight = 36;
    this.txt = txt;

    //リンクを繋ぐために必要なXY情報が入るところ
    //リンクを結ぶ前後のノードの中心の値が入る
    this.beforeX = nodeList[before].x + nodeList[before].nodeWidth / 2.0;
    this.beforeY = nodeList[before].y + nodeList[before].nodeHeight / 2.0;
    this.afterX = nodeList[after].x + nodeList[after].nodeWidth / 2.0;
    this.afterY = nodeList[after].y + nodeList[after].nodeHeight / 2.0;
  }
  //表示に関する関数
  this.display = function(ctx) {
    this.nodeWidth = ctx.measureText(txt).width + 10;
    //リンクを繋ぐ2点の座標を取ってきてパスをつなぐ
    ctx.beginPath();
    ctx.moveTo(this.beforeX, this.beforeY);
    ctx.lineTo(this.afterX, this.afterY);
    ctx.closePath();

    //黒色で直線を引く
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.stroke();

    //文字をリンクの真ん中に表示
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect((this.beforeX + this.afterX - this.nodeWidth)/2, (this.beforeY + this.afterY - this.nodeHeight)/2, this.nodeWidth, this.nodeHeight);
    //枠線部分
    ctx.strokeStyle="rgb(0, 0, 0)";
    ctx.strokeRect((this.beforeX + this.afterX - this.nodeWidth)/2, (this.beforeY + this.afterY - this.nodeHeight)/2, this.nodeWidth, this.nodeHeight);
    //テキストの表示
    ctx.fillStyle="rgb(0, 0, 0)";
    ctx.font="20px 'ＭＳ Ｐゴシック'";
    ctx.fillText(this.txt, (this.beforeX + this.afterX - this.nodeWidth)/2 +1, (this.beforeY + this.afterY - this.nodeHeight)/2 +26, this.nodeWidth*0.99);
  }

  // 現在の位置情報を一時保存
  this.store = function() {
    this.lastBeforeX = nodeList[before].x;
    this.lastBeforeY = nodeList[before].y;
    this.lastAfterX = nodeList[after].x;
    this.lastAfterY = nodeList[after].y;
  }

  // 一時保存した位置情報を復活させる
  this.restore = function() {
    this.beforeX = this.lastBeforeX;
    this.beforeY = this.lastBeforeY;
    this.afterX = this.lastAfterX;
    this.afterY = this.lastAfterY;
  }

  this.move = function(txt, dx, dy){
    if(txt == "before"){
      this.beforeX += dx;
      this.beforeY += dy;
    }else if(txt == "after"){
      this.afterX += dx;
      this.afterY += dy;
    }
  }
}

// list は全てのテキストオブジェクトを持っている配列
// obj を表示されるlistに追加するメソッド
function addTextObject(obj) {
  console.log("addTextObject");
  nodeList.push(obj);
}

function addLinkObject(){
  console.log("addLinkObject");
  //ノードを二つ選択しているかを確認する
  if(selectedNode.length == 2){
    var before = selectedNode[0];
    var after = selectedNode[1];

    var existLink = true;

    var txt = document.getElementById("linkText").value;
    //もし登録されていなければリストに追加。すでに貼られているリンクなら何もしない
    for(var i = 0; i < linkList.length; i++){
      if((linkList[i].after == after && linkList[i].before == before) || (linkList[i].before == after && linkList[i].after == before )){
        existLink = false;
      }
    }
    if(existLink){
      //リンクが存在しないならばテキストの入力を確認してリンクを追加する
      if(txt == ""){
        alert("警告：用語同士のつながりを記述した文章を挿入してください")
      }else{
        //ノードのセレクト状態を解除
        nodeList[before].selected = !nodeList[before].selected;
        nodeList[after].selected = !nodeList[after].selected;
        selectedNode = [];

        //リンクの追加
        linkList.push(new linkObject(before, after, txt));

        //logの保存
        var date = new Date();
        var tmp = {
          method: "addLink",
          linkID: (linkLastID).toString(),
          linkText: linkList[(linkLastID)].txt,
          beforeNodeText: nodeList[linkList[(linkLastID)].before].txt,
          afterNodeText:  nodeList[linkList[(linkLastID)].after].txt,
          date: date.toLocaleString()
        }
        logList.push(tmp);
        saveData("savelog", "log", JSON.stringify(logList));
        resetData();
        
        //linkTextを初期化する
        document.getElementById("linkText").value = "";
      }
    }
  }else{
    alert("警告：ノードを2つ選択してください")
  }
}

function eraseLink(){
  console.log("eraseLink");
  //ノードを二つ選択しているかを確認する
  if(selectedNode.length == 2){
    var before = selectedNode[0];
    var after = selectedNode[1];

    for(var i = 0; i < linkList.length; i++){
      if((linkList[i].after == after && linkList[i].before == before) || (linkList[i].before == after && linkList[i].after == before )){
        //ノードのセレクト状態を解除
        nodeList[before].selected = !nodeList[before].selected;
        nodeList[after].selected = !nodeList[after].selected;
        selectedNode = [];

        //logの保存
        var date = new Date();
        var tmp = {
          method: "eraseLink",
          linkID: i.toString(),
          linkText: linkList[i].txt,
          beforeNodeText: nodeList[linkList[i].before].txt,
          afterNodeText:  nodeList[linkList[i].after].txt,
          date: date.toLocaleString()
        };
        logList.push(tmp);
        saveData("savelog", "log", JSON.stringify(logList));

        //リンクを削除する
        linkList.splice(i, 1);

        resetData();
      }
    }
  }else{
    alert("警告：ノードを2つ選択してください")
  }

}

// 全ての登録されたオブジェクトを表示する
function displayObjects() {
  for(var i = 0; i<linkList.length; i++){
    linkList[i].display(context);
  }
  for (var i = 0; i < nodeList.length; i++) {
    nodeList[i].display(context);
  }
}

// 全てのオブジェクトの現在の位置情報を保存する
function storeObjects() {
  console.log("storeObjects");
  for(var i=0; i<linkList.length; i++){
    linkList[i].store();
  }
  for (var i = 0; i < nodeList.length; i++) {
    nodeList[i].store();
  }
}

// 保存した全てのオブジェクトの位置情報を復活させる
function restoreObjects() {
  console.log("restoreObjects");
  for(var i=0; i<linkList.length; i++){
    linkList[i].restore();
  }
  for (var i = 0; i < list.length; i++) {
    list[i].restore();
  }
}

// highlight 属性が true になっているオブジェクトだけを (dx, dy) だけ移す
function moveHLObjects(dx, dy) {
  console.log("moveHLObjects");
  for (var i = 0; i < nodeList.length; i++) {
    if (nodeList[i].highlight) {
      nodeList[i].move(dx, dy);
    }
  }

}

//highlight属性がtrueになっているノードを繋いでいる該当するリンクの端点だけを(dx, dy)だけ移す
function moveHLLinkObjects(dx, dy){
  console.log("moveHLLinkObjects");
  //ノードを端から見ていく
  for(var i = 0; i < nodeList.length; i++){
    //highlight属性がtrueのもののみ実行
    if(nodeList[i].highlight){
      //リンクを端から見ていき、端点どちらかが該当するノードであることを確認する
      for(var j = 0; j < linkList.length; j++){
        if(linkList[j].before == i){
          linkList[j].move("before", dx, dy);
        }
        if(linkList[j].after == i){
          linkList[j].move("after", dx, dy);
        }
      }
    }
  }

}

// (x, y) の下にあるオブジェクトの属性を highlight にする
function checkHighlightObjects(x, y) {
  for (var i = 0; i < nodeList.length; i++) {
    nodeList[i].checkHL(x, y);
    if(nodeList[i].highlight)  highlightedNode.push(i);
  }
}

// ダブルクリックしたオブジェクトの　selected 状態を反転する
function changeSelectedObjects(x, y) {
  for (var i = 0; i < nodeList.length; i++) {
    if (nodeList[i].checkHit(x, y)) {
      nodeList[i].selected = !nodeList[i].selected;
      if(nodeList[i].selected) selectedNode.push(i);
      if(!nodeList[i].selected) {
        for(var j = 0; j < selectedNode.length; j++){
          if(selectedNode[j] == i) selectedNode.splice(j, 1);
        }
      }
      //もしselectedが三つ以上なら、selectedNodeの一番目の値を一つ取り除く
      if(selectedNode.length > 2){
        nodeList[selectedNode[0]].selected = !nodeList[selectedNode[0]].selected;
        selectedNode.shift();
      }
    }
  }
}

// mouse move handler
function movehandler(event) {
  mouseX = event.offsetX;
  mouseY = event.offsetY;

  if (mode == 1) {
    if(linkList.length > 0){
      moveHLLinkObjects(mouseX - lastX, mouseY - lastY);
    }
    moveHLObjects(mouseX - lastX, mouseY - lastY);
    lastX = mouseX;
    lastY = mouseY;
  }
}

function onDblClick(event) {
  changeSelectedObjects(mouseX, mouseY);
}

function onMouseDown(event) {
  // mode を1 に設定
  mode = 1;
  downX = mouseX;
  downY = mouseY;
  lastX = downX;
  lastY = downY;
  checkHighlightObjects(downX, downY);
}

function onMouseUp(event) {
  // mode を0 に設定
  mode = 0;
  // すべてのオブジェクトのハイライト状態を落とす
  checkHighlightObjects(-1, -1);
  for(var i = 0; i < highlightedNode.length; i++){
    //logの保存
    var date = new Date();
    var tmp = {
      method: "move",
      nodeID: highlightedNode[i].toString(),
      Text: nodeList[highlightedNode[i]].txt,
      positionX: nodeList[highlightedNode[i]].x.toString(),
      positionY: nodeList[highlightedNode[i]].y.toString(),
      date: date.toLocaleString()
    };
    logList.push(tmp);
    saveData("savelog", "log", JSON.stringify(logList));
  }
  highlightedNode = [];

  //linkListとかの情報をdataファイルに更新させる
  resetData();
}

// "add" ボタンをおしたとき指定されたテキストを持つテキストオブジェクトを追加する
function addText() {
  console.log("addText");
  var txt = document.getElementById("txt").value;
  if (txt != "") {
    var obj=new textObject(txt, 0, 0);
    addTextObject(obj);
    
    //logの保存
    var date = new Date();
    var tmp = {
      method: "addNode",
      nodeID: obj.id.toString(),
      nodeText: txt,
      date: date.toLocaleString()
    }
    logList.push(tmp)
    saveData("savelog", "log", JSON.stringify(logList));
    resetData();
  }
}

function draw()  {
  //setInitCanvasSize();

  //canvasの背景色とかの指定
  context.fillStyle = "rgb(255, 255, 255)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgb(0, 0, 0)";

  //ノードを表示する
  displayObjects();

}
setInterval(draw, 20);

/*ruby使ってデータを読み込む関数*/
function loadData(fname){
  console.log("loadData");
  var xmlHttpReq = new XMLHttpRequest();
  var i, j;
  args = "cmd=read&fn="+fname+".txt";
  xmlHttpReq.open('GET', './fileIO.rb?'+args, true);

  xmlHttpReq.onreadystatechange = function(){
    if(xmlHttpReq.readyState==4){
      var txt = xmlHttpReq.responseText;
      var JSONData = JSON.parse(txt);
      console.log(JSONData);
      for(var i = 0; i < JSONData.length; i++){
        //読み込んだデータからキャンバスに書き込んでいく
        if(JSONData[i].prop == "NODE"){
          addTextObject(new textObject(JSONData[i].txt, parseInt(JSONData[i].xpos, 10), parseInt(JSONData[i].ypos, 10)));
        }
        if(JSONData[i].prop == "LINK"){
          linkList.push(new linkObject(parseInt(JSONData[i].bef, 10), parseInt(JSONData[i].aft, 10) ,JSONData[i].txt));
        }
      }
    }
  }

  xmlHttpReq.send(null);
}

function reloadData(){
  //まずはlinkListやnodeListを初期化
  nodeLastID = -1;
  linkLastID = -1;
  nodeList = [];
  linkList = [];

  var fname = document.getElementById("status").value+"data";
   loadData(fname);
}

function saveData(cmd, fname, txt){
  console.log("saveData");

  //データの保存に関する変数
  var studentsID = document.getElementById("status").value;

  if(studentsID != ''){
    fname = studentsID + fname;
  }
  var xmlHttpReq = new XMLHttpRequest();
  args = "cmd="+cmd+"&fn="+fname+".txt&params="+txt;
  xmlHttpReq.open('POST', './fileIO.rb', true);
  xmlHttpReq.send(args);
}

function resetData(){
  console.log("resetData");
  var jsonData = [];
  var temp;
  //途中の部分だけを変更してdataを保存する方法が分からないので、一度消してすべて入れなおす。
  for(var i = 0; i < nodeList.length; i++){
    temp = {
      id: i.toString(),
      prop: 'NODE',
      txt: nodeList[i].txt,
      xpos: nodeList[i].x.toString(),
      ypos: nodeList[i].y.toString()
    }
    jsonData.push(temp);
  }
  for(var i = 0; i < linkList.length; i++){
    temp = {
      id: i.toString(),
      prop: 'LINK',
      bef: linkList[i].before.toString(),
      aft: linkList[i].after.toString(),
      txt: linkList[i].txt
    }

    jsonData.push(temp);
  }

  console.log(JSON.stringify(jsonData));
  saveData("save", "data", JSON.stringify(jsonData));
}
