let trialNum = 12; // すべての刺激が均等に出現するように、6(2条件3水準)の倍数をおすすめ

// 刺激の属性
let stimSize = 80; // 刺激のサイズ
let stimCol = "#000000"; // 刺激の色
let fix_time = 300; // 注視点の提示時間(ms)

// 条件のセット(刺激対がのべ12)
let stimSet = ["2", "3", "4"];
let stims = [];
for (let i = 0; i < Math.ceil(trialNum / stimSet.length); i++) {
  // 試行数に合わせて刺激を複製
  stims = stims.concat(stimSet);
}
shuffle(stims); // 要素をシャフルする
stims = stims.slice(0, trialNum); // 試行数に合わせて刺激を減らす

let condition = [];
let expCondition = [];
for (let i = 0; i < trialNum / 2; i++) {
  condition.push("exp");
  condition.push("control");
}
shuffle(condition); // 条件をシャフルする

for (let i = 0; i < trialNum; i++) {
  let randomNum;
  if (condition[i] === "exp") {
    do {
      randomNum = Math.floor(Math.random() * 4) + 1; // 1から4のランダムな数を生成
    } while (randomNum === parseInt(stims[i]));
  } else {
    randomNum = parseInt(stims[i]);
  }
  
  expCondition.push(randomNum);
}

// 反応時間RTのセット
let reactTimeExp = []; // 実験条件のRTを保存するリスト
let reactTimeCon = []; // 統制条件のRTを保存するリスト
let resultsExp = []; // 実験条件のRTの平均と分散を保存するリスト
let resultsCon = []; // 統制条件のRTの平均と分散を保存するリスト
let ifCorrectExp = []; // 実験条件の正答判定を保存するリスト
let ifCorrectCon = []; // 統制条件の正答判定を保存するリスト

// 他global変数
let showInstruction = true; // 教示の提示状態
let currentTrial = 0; // 試行indexの設定
let trialInProgress = false; // 試行の進行状態
let expFinished = false; // 終了画面の表示状態
let accuracyExp = 0; // 実験条件の正答率
let accuracyCon = 0; // 統制条件の正答率
let t_result = {}; // t検定の結果
let startTime; // 開始時間
let tryAgainButton; // 再開ボタン
let showFix = false; // 注視点の提示

function setup() {
  createCanvas(800, 600); // キャンパスのサイズ
  textFont("Meiryo"); // 全体のフォント
  textAlign(CENTER, CENTER); // 文字を中央揃え
}

function draw() {
  background(220);

  if (showInstruction) {
    // 教示
    textSize(25);
    fill("#000000");
    text(
      "これから数を判断する課題をやっていただきます。\n\n画面の中に数字が提示されます。\nその数字のキー押しで判断してください。\n2は「2」、3は「3」、4は「4」で反応してください。\nできるだけ早くかつ正確に反応してください。\n\nスペースキーを押して開始",
      width / 2,
      height / 2
    );
  } else if (showFix) {
    textSize(50);
    fill("#000000");
    text("+", width / 2, height / 2);
    textSize(20);
    text(
      "数字のキー押しで答えてください\n2: 2, 3: 3, 4: 4",
      width / 2,
      height / 10
    );
  } else if (trialInProgress) {
    textSize(20);
    fill("#000000");
    text(
      "数字のキー押しで答えてください\n2: 2, 3: 3, 4: 4",
      width / 2,
      height / 10
    );

    // 刺激を生成
    stroopMaker(stims[currentTrial], condition[currentTrial], expCondition[currentTrial]);
  } else if (expFinished) {
    endWindow();
  }
}

// キー押しを検出する関数
function keyPressed() {
  if (showInstruction && key === " ") {
    showInstruction = false;
    showFixation();
  }

  if (trialInProgress && (key === "2" || key === "3" || key === "4")) {
    trialInProgress = false; // 次の試行に進む

    let endTime = millis(); // 試行の終了時間を取得
    let reactTime = endTime - startTime; // 試行の反応時間を算出
    console.log(`Trial ${currentTrial + 1}: ${reactTime}ms`);

    // 反応時間と正誤判定を保存
    let ifCorrect = checkCorrect(stims[currentTrial], key) ? 1 : 0; // 正誤判定

    if (condition[currentTrial] === "control") {
      // 統制条件の場合
      reactTimeCon.push(reactTime);
      ifCorrectCon.push(ifCorrect);
    } else {
      // 実験条件の場合
      reactTimeExp.push(reactTime);
      ifCorrectExp.push(ifCorrect);
    }

    // 試行の進行を行う
    currentTrial++;
    if (currentTrial < trialNum) {
      showFixation();
    } else {
      resultsExp = calculater(reactTimeExp); // 実験条件の平均と分散を計算
      resultsCon = calculater(reactTimeCon); // 統制条件の平均と分散を計算

      // 各条件の正答率を計算
      accuracyExp =
        (ifCorrectExp.reduce((sum, ifcorrect) => sum + ifcorrect, 0) /
          ifCorrectExp.length) *
        100;
      accuracyCon =
        (ifCorrectCon.reduce((sum, ifcorrect) => sum + ifcorrect, 0) /
          ifCorrectCon.length) *
        100;

      trialInProgress = false;
      expFinished = true;

      // 実験条件と統制条件の差分を計算し、diff_RTに代入
      let diff_RT = reactTimeExp.map((exp, index) => exp - reactTimeCon[index]);

      resultsDiff = calculater(diff_RT); // 差分の平均と分散を計算
      t_result = tTest(resultsExp[0], resultsCon[0], resultsDiff[1]); // t検定
      console.log("t-test result:", t_result);

      // 終了画面でボタンを表示
      if (!tryAgainButton) {
        tryAgainButton = createButton("もう一回");
        tryAgainButton.style("width", "100px");
        tryAgainButton.style("height", "50px");
        tryAgainButton.position((width * 3) / 4, (height * 4) / 5);
        tryAgainButton.mousePressed(restart);
      }
      tryAgainButton.show();
    }
  }
}

// リストの要素をシャフルする関数
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // 0-i+1までの乱数を生成
    let r = Math.floor(Math.random() * (i + 1));

    let tmp = array[i];
    array[i] = array[r];
    array[r] = tmp;
  }
  return array;
}

// 正誤判定関数
function checkCorrect(num, key) {
  if (num === "2" && key === "2") return true;
  if (num === "3" && key === "3") return true;
  if (num === "4" && key === "4") return true;
  return false;
}

// ストループ刺激を生成する関数
function stroopMaker(word, conditionType, numRepeat) {
  textSize(stimSize);
  fill(stimCol);
  if (conditionType === "control") {
    for (let i = 0; i < parseInt(word); i++) {
      text(word, width / 2 + i * 50, height / 2); // 50pxずつ横にずらして表示
    }
  } else if (conditionType === "exp") {
    for (let i = 0; i < numRepeat; i++) {
      text(word, width / 2 + i * 50, height / 2); // 50pxずつ横にずらして表示
    }
  }
}

// RTの平均と分散を計算する関数
function calculater(array) {
  let sum = array.reduce((a, b) => a + b, 0);
  let average = sum / array.length;
  let variance =
    array.reduce((a, b) => a + (b - average) ** 2, 0) / array.length;
  return [average, variance];
}

// 対応ありt-test関数
function tTest(exp, con, diff_var) {
  let diff = exp - con; // 平均の差
  let unbiased_var = diff_var / (reactTimeExp.length - 1); // 差の不変分散
  let t_value = diff / Math.sqrt(unbiased_var); // t値
  let df = reactTimeExp.length - 1; // 自由度の計算
  let p_value = jStat.ttest(t_value, df, 2); // p値(外部ライブラリを使用)

  return { t値: t_value, p値: p_value };
}

// 試行の提示を制御する
function startTrial() {
  trialInProgress = true;
  startTime = millis(); // 試行の開始時間を取得
}

// 注視点の提示を制御する
function showFixation() {
  showFix = true;
  setTimeout(() => {
    showFix = false;
    startTrial();
  }, fix_time);
}

// 終了画面
function endWindow() {
  background(220);
  textSize(30);
  fill("#000000");
  text("終了です。", width / 2, height / 10);
  text(
    `実験条件の平均RT: ${resultsExp[0].toFixed(2)}ms
    SD: ${Math.sqrt(resultsExp[1]).toFixed(2)}ms
    正答率: ${accuracyExp.toFixed(2)}%`,
    width / 2,
    height / 4
  );
  text(
    `統制条件の平均RT: ${resultsCon[0].toFixed(2)}ms
    SD: ${Math.sqrt(resultsCon[1]).toFixed(2)}ms
    正答率: ${accuracyCon.toFixed(2)}%`,
    width / 2,
    height / 2
  );
  text(
    `t (${reactTimeExp.length - 1}) = ${t_result["t値"].toFixed(2)}, p = ${t_result[
      "p値"
    ].toFixed(3)}`,
    width / 2,
    (height * 3) / 4
  );
}

// もう一回
function restart() {
  showInstruction = true;
  expFinished = false;

  // 各変数のリセット
  currentTrial = 0;
  reactTimeExp = [];
  reactTimeCon = [];
  resultsExp = [];
  resultsCon = [];
  ifCorrectExp = [];
  ifCorrectCon = [];
  condition = shuffle(condition);
  t_result = {};
  if (tryAgainButton) {
    tryAgainButton.hide();
  }
}
