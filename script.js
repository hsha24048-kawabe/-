const subjects = ["国語", "数学", "英語", "理科", "社会", "情報技術", "自由形"];
let userData = {
    level: 1,
    exp: 0,
    points: 0
};

let sessionData = {
    subject: "",
    timeMinutes: 0,
    secondsLeft: 0,
    timerId: null
};

// モバイル端末用の簡易バイブレーション機能
const triggerVibration = () => { 
    if (navigator.vibrate) navigator.vibrate(60); 
};

// --- 3.1 おみくじルーレット機能 ---
function startRoulette() {
    const textElement = document.getElementById("subject-text");
    const wrapElement = document.getElementById("roulette-wrap");
    const btnStart = document.getElementById("btn-start");
    
    triggerVibration();
    wrapElement.classList.add("spinning");
    btnStart.disabled = true;
    btnStart.style.opacity = 0.4;

    let duration = 2000; // 2秒間回転演出
    let spinInterval = setInterval(() => {
        textElement.textContent = subjects[Math.floor(Math.random() * subjects.length)];
    }, 80);

    setTimeout(() => {
        clearInterval(spinInterval);
        wrapElement.classList.remove("spinning");
        
        // 決定した教科を保持
        sessionData.subject = textElement.textContent;
        
        // UIの切り替え
        document.getElementById("cat-msg").textContent = `「本日のミッションは『${sessionData.subject}』にロックオン！稼働時間を設定してね」`;
        document.getElementById("time-options").classList.remove("hidden");
        btnStart.classList.add("hidden");
    }, duration);
}

// --- 3.2 タイマー＆学習管理（時間変換のバグ修正） ---
function selectTime(mins) {
    triggerVibration();
    sessionData.timeMinutes = mins;
    
    // 【改善点】選択された「分」を正確に秒に変換してセットする (1時間なら60分*60=3600秒)
    sessionData.secondsLeft = mins * 60; 
    
    // 起動ボタンをアクティブ化
    const btnGo = document.getElementById("btn-go");
    btnGo.classList.remove("hidden");
    btnGo.textContent = `【${mins}分間】の学習空間を展開する`;
    
    // ボタンの選択状態を視覚化
    document.querySelectorAll(".time-select .btn").forEach(button => {
        if (button.textContent.includes(mins) || (mins >= 60 && button.textContent.includes(mins / 60 + "時間"))) {
            button.style.background = "rgba(216, 191, 216, 0.3)";
            button.style.borderColor = "var(--primary-color)";
        } else {
            button.style.background = "transparent";
            button.style.borderColor = "rgba(216, 191, 216, 0.5)";
        }
    });
}

function goToTimer() {
    if (sessionData.timeMinutes === 0) return;
    
    switchScreen("screen-timer");
    document.getElementById("active-subject").textContent = `MISSION: ${sessionData.subject}`;
    updateTimerUI();

    // 1秒ごとにカウントダウンを実行
    sessionData.timerId = setInterval(() => {
        sessionData.secondsLeft--;
        updateTimerUI();

        // タイムアップ判定
        if (sessionData.secondsLeft <= 0) {
            completeStudy();
        }
    }, 1000);
}

// 残り秒数を HH:MM:SS 形式に変換して描画
function updateTimerUI() {
    const totalSeconds = sessionData.secondsLeft;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    document.getElementById("timer-text").textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// --- 3.4 ポイント＆レベルアップ処理 ---
function completeStudy() {
    clearInterval(sessionData.timerId);
    triggerVibration();
    
    // 成果配分: 1分につき10ポイント（およびEXP）
    const earnedPoints = sessionData.timeMinutes * 10;
    userData.points += earnedPoints;
    userData.exp += earnedPoints;

    const previousLevel = userData.level;
    // 500EXPごとにレベルアップ
    userData.level = Math.floor(userData.exp / 500) + 1;

    // レベルアップ時のポップアップ演出＆仕様3.4（レベル5ごとのインセンティブトリガー）
    if (userData.level > previousLevel) {
        alert(`🎉 LEVEL UP! あなたの同期レベルが LV.${userData.level} に上昇しました！`);
        if (userData.level % 5 === 0) {
            alert("🎁 【仕様3.4特典】レベルが5到達/上昇したため、外部電子決済ポイントの申請権が付与されました！");
        }
    }

    // リザルト画面へのデータ反映
    document.getElementById("res-subject").textContent = sessionData.subject;
    document.getElementById("res-pts").textContent = `+${earnedPoints} PTS`;
    
    updateStatusDisplay();
    switchScreen("screen-result");
}

// --- 3.3 途中離脱の抑止（集中維持機能） ---
document.addEventListener("visibilitychange", function() {
    // タイマーが作動中に、別のタブやアプリに切り替えて戻ってきた場合
    if (document.visibilityState === 'visible' && sessionData.timerId) {
        triggerVibration();
        document.getElementById("timer-cat-msg").innerHTML = 
            "<span style='color:var(--danger-color); font-weight:bold;'>「あ！端末の通信が乱れたよ（他アプリ検知）！集中に戻るんだニャ！」</span>";
    }
});

// --- システム共通ユーティリティ ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function updateStatusDisplay() {
    document.getElementById("level").textContent = userData.level;
    document.getElementById("exp").textContent = userData.exp;
    document.getElementById("points").textContent = userData.points;
}

function resetApp() {
    // セッション情報の初期化
    sessionData = { subject: "", timeMinutes: 0, secondsLeft: 0, timerId: null };
    
    // UIを初期状態に復元
    document.getElementById("subject-text").textContent = "?";
    const btnStart = document.getElementById("btn-start");
    btnStart.classList.remove("hidden");
    btnStart.disabled = false;
    btnStart.style.opacity = 1;
    
    document.getElementById("btn-go").classList.add("hidden");
    document.getElementById("time-options").classList.add("hidden");
    document.getElementById("cat-msg").textContent = "「始める」を押して、今日のクエストを決めよう！";
    document.getElementById("timer-cat-msg").textContent = "集中、集中！スマホは置いておこう。";
    
    switchScreen("screen-omikuji");
}

function quitStudy() {
    if (confirm("クエストを破棄しますか？ここまでのデータとポイントは消失します。")) {
        clearInterval(sessionData.timerId);
        resetApp();
    }
}
