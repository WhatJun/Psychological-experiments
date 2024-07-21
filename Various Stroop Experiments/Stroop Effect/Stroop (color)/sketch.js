// 試行数の設定
let trialNum = 24; // すべての刺激が均等に出現するように、12(刺激対の数)の倍数をおすすめ

//刺激の属性
let stimSize = 80; // 刺激文字のサイズ
let fix_time = 300; // 注視点の提示時間(ms)

// 条件のセット(刺激対がのべ12)
let conditionSet = [
  // 統制条件
  ["赤", "red"],
  ["赤", "red"],
  ["青", "blue"],
  ["青", "blue"],
  ["緑", "green"],
  ["緑", "green"],

  // 実験条件
  ["赤", "green"],
  ["青", "red"],
  ["緑", "blue"],
  ["赤", "blue"],
  ["青", "green"],
  ["緑", "red"],
];

let condition = [];
for (let i = 0; i < Math.ceil(trialNum / conditionSet.length); i++) {
  // 試行数に合わせて刺激を複製
  condition = condition.concat(conditionSet);
}
shuffle(condition); // 要素をシャフルする
condition = condition.slice(0, trialNum); // 試行数に合わせて刺激を減らす

// console.log(condition);

//反応時間RTのセット
let reactTimeExp = []; //実験条件のRTを保存するリスト
let reactTimeCon = []; //統制条件のRTを保存するリスト
let resultsExp = []; //実験条件のRTの平均と分散を保存するリスト
let resultsCon = []; //統制条件のRTの平均と分散を保存するリスト
let ifCorrectExp = []; //実験条件の正答判定を保存するリスト
let ifCorrectCon = []; //統制条件の正答判定を保存するリスト

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
let colorsMap = {
  // 結果の判定マップ
  赤: "red",
  青: "blue",
  緑: "green",
};

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
      "これから色を判断する課題をやっていただきます。\n\n画面の中に文字が提示されます。\nその文字のインクの色をキー押しで判断してください。\n赤は「a」、青は「s」、緑は「d」で反応してください。\nできるだけ早くかつ正確に反応してください。\n\nスペースキーを押して開始",
      width / 2,
      height / 2
    );
  } else if (showFix) {
    textSize(50);
    fill("#000000");
    text("+", width / 2, height / 2);
    textSize(20);
    text(
      "文字のインクの色をキー押しで答えてください\n赤:a, 青:s, 緑:d",
      width / 2,
      height / 10
    );
  } else if (trialInProgress) {
    textSize(20);
    fill("#000000");
    text(
      "文字のインクの色をキー押しで答えてください\n赤:a, 青:s, 緑:d",
      width / 2,
      height / 10
    );

    // 刺激を生成
    stroopMaker(condition[currentTrial][0], condition[currentTrial][1]);
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

  if (trialInProgress && (key === "a" || key === "s" || key === "d")) {
    trialInProgress = false; // 次の試行に進む

    let endTime = millis(); // 試行の終了時間を取得
    let reactTime = endTime - startTime; //試行の反応時間を算出
    console.log(`Trial ${currentTrial + 1}: ${reactTime}ms`);

    // 反応時間と正誤判定を保存
    let ifCorrect = checkCorrect(condition[currentTrial][1], key) ? 1 : 0; // 正誤判定

    if (colorsMap[condition[currentTrial][0]] === condition[currentTrial][1]) {
      // 文字と色が一致の場合
      reactTimeCon.push(reactTime);
      ifCorrectCon.push(ifCorrect);
    } else {
      // 文字と色が不一致の場合
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
      // console.log("sample1:", reactTimeExp);
      // console.log("sample2:", reactTimeCon);
      // console.log("正答率実験：" + ifCorrectExp);
      // console.log("正答率統制：" + ifCorrectCon);
      // t_score = jStat.tscore(1, reactTimeCon)
      // console.log("tsocre:" + t_score)
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
function checkCorrect(col, key) {
  if (col === "red" && key === "a") return true;
  if (col === "blue" && key === "s") return true;
  if (col === "green" && key === "d") return true;
  return false;
}

// ストループ刺激を生成する関数
function stroopMaker(word, col) {
  textSize(stimSize);
  fill(col);
  text(word, width / 2, height / 2);
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
  let unbiased_var = diff_var / (condition.length / 2 - 1); // 差の不変分散
  let t_value = diff / Math.sqrt(unbiased_var); // t値
  let df = reactTimeExp.length - 1; // 自由度の計算
  let p_value = jStat.ttest(t_value, trialNum / 2, 2); // p値(外部ライブを使用)

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
    `t (${trialNum / 2 - 1}) = ${t_result["t値"].toFixed(2)}, p = ${t_result[
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
