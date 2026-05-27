// --- アプリ全体の状態データ ---
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
    timerId: null,
    isPaused: false // 【新規】一時停止の状態を管理するフラグ
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

    let duration = 2000; 
    let spinInterval = setInterval(() => {
        textElement.textContent = subjects[Math.floor(Math.random() * subjects.length)];
    }, 80);

    setTimeout(() => {
        clearInterval(spinInterval);
        wrapElement.classList.remove("spinning");
        
        sessionData.subject = textElement.textContent;
        
        document.getElementById("cat-msg").textContent = `「本日のミッションは『${sessionData.subject}』にロックオン！稼働時間を設定してね」`;
        
        document.getElementById("time-options").classList.remove("hidden");
        btnStart.classList.add("hidden");
    }, duration);
}

// --- 3.2 タイマー＆学習管理 ---
function selectTime(mins) {
    triggerVibration();
    sessionData.timeMinutes = mins;
    sessionData.secondsLeft = mins * 60; 
    
    const btnGo = document.getElementById("btn-go");
    btnGo.classList.remove("hidden");
    btnGo.textContent = `【${mins}分間】の学習空間を展開する`;
    
    document.querySelectorAll(".time-select .btn").forEach(button => {
        if (button.textContent.includes(mins) || (mins >= 60 && button.textContent.includes(mins / 60 + "時間"))) {
            button.style.background = "rgba(216, 191, 216, 0.4)";
            button.style.borderColor = "var(--primary-color)";
        } else {
            button.style.background = "#ffffff";
            button.style.borderColor = "rgba(216, 191, 216, 0.7)";
        }
    });
}

function goToTimer() {
    if (sessionData.timeMinutes === 0) return;
    
    switchScreen("screen-timer");
    document.getElementById("active-subject").textContent = `MISSION: ${sessionData.subject}`;
    
    // 一時停止状態をクリアして初期化
    sessionData.isPaused = false;
    document.getElementById("btn-pause").textContent = "一時停止";
    document.getElementById("btn-pause").style.background = "#ffffff";
    document.getElementById("btn-pause").style.color = "var(--pause-color)";
    
    updateTimerUI();

    // 1秒ごとにカウントダウンを実行
    sessionData.timerId = setInterval(() => {
        // 【改善】一時停止中でない場合のみ秒数を減らす
        if (!sessionData.isPaused) {
            sessionData.secondsLeft--;
            updateTimerUI();

            if (sessionData.secondsLeft <= 0) {
                completeStudy();
            }
        }
    }, 1000);
}

// 【新規】一時停止と再開を切り替える関数
function togglePause() {
    triggerVibration();
    sessionData.isPaused = !sessionData.isPaused;
    
    const pauseBtn = document.getElementById("btn-pause");
    const catMsg = document.getElementById("timer-cat-msg");

    if (sessionData.isPaused) {
        // 一時停止したとき
        pauseBtn.textContent = "再開する";
        pauseBtn.style.background = "var(--pause-color)";
        pauseBtn.style.color = "#ffffff";
        catMsg.textContent = "「ひと休み中だニャ？準備ができたら再開してね」";
    } else {
        // 再開したとき
        pauseBtn.textContent = "一時停止";
        pauseBtn.style.background = "#ffffff";
        pauseBtn.style.color = "var(--pause-color)";
        catMsg.textContent = "「よし、タイマー再始動！集中、集中！」";
    }
}

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
    
    const earnedPoints = sessionData.timeMinutes * 10;
    userData.points += earnedPoints;
    userData.exp += earnedPoints;

    const previousLevel = userData.level;
    userData.level = Math.floor(userData.exp / 500) + 1;

    if (userData.level > previousLevel) {
        alert(`🎉 LEVEL UP! あなたの同期レベルが LV.${userData.level} に上昇しました！`);
        if (userData.level % 5 === 0) {
            alert("🎁 【仕様3.4特典】レベルが5到達/上昇したため、外部電子決済ポイントの申請権が付与されました！");
        }
    }

    document.getElementById("res-subject").textContent = sessionData.subject;
    document.getElementById("res-pts").textContent = `+${earnedPoints} PTS`;
    
    updateStatusDisplay();
    switchScreen("screen-result");
}

// --- 3.3 途中離脱の抑止 ---
document.addEventListener("visibilitychange", function() {
    // タイマーが動いていて、かつ「一時停止中ではない」ときに離脱を検知したら怒る
    if (document.visibilityState === 'visible' && sessionData.timerId && !sessionData.isPaused) {
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
    sessionData = { subject: "", timeMinutes: 0, secondsLeft: 0, timerId: null, isPaused: false };
    
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