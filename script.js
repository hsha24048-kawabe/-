JavaScript
// アプリの状態管理
let state = {
    level: 1,
    points: 0,
    exp: 0,
    selectedSubject: '',
    chosenDuration: 0, // 秒
    timerInterval: null,
    isStudying: false
};

const subjects = ['数学', '英語', '国語', '理科', '社会'];

// DOM要素の取得
const bubble = document.getElementById('speech-bubble');
const character = document.getElementById('app-character');
const rouletteDisplay = document.getElementById('roulette-display');
const startRouletteBtn = document.getElementById('start-roulette-btn');
const rouletteSection = document.getElementById('roulette-section');
const timerSection = document.getElementById('timer-section');
const subjectTitle = document.getElementById('selected-subject-title');
const timerClock = document.getElementById('timer-clock');
const startStudyBtn = document.getElementById('start-study-btn');

// --- ルーレット処理 ---
startRouletteBtn.addEventListener('click', () => {
    startRouletteBtn.disabled = true;
    rouletteDisplay.classList.add('spinning');
    bubble.innerText = "何が出るかな…何が出るかな…";
    
    let count = 0;
    const interval = setInterval(() => {
        rouletteDisplay.innerText = subjects[count % subjects.length];
        count++;
    }, 100);

    // 2秒後にルーレット停止
    setTimeout(() => {
        clearInterval(interval);
        rouletteDisplay.classList.remove('spinning');
        
        const resultIndex = Math.floor(Math.random() * subjects.length);
        state.selectedSubject = subjects[resultIndex];
        rouletteDisplay.innerText = state.selectedSubject;
        
        bubble.innerText = `今日の運勢は【${state.selectedSubject}】じゃ！タイマーをセットして始めるのじゃ！`;
        
        // タイマー画面への遷移準備
        setTimeout(() => {
            rouletteSection.classList.add('hidden');
            timerSection.classList.remove('hidden');
            subjectTitle.innerText = `今日の教科：${state.selectedSubject}`;
        }, 1500);

    }, 2000);
});

// --- タイマー設定処理 ---
document.querySelectorAll('.time-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // 本来は分単位ですが、テスト用に「秒」として扱います（15分→15秒）
        const minutes = parseInt(e.target.dataset.time);
        state.chosenDuration = minutes; // テスト用に爆速で終わる設定
        
        updateTimerDisplay(state.chosenDuration);
        startStudyBtn.classList.remove('hidden');
        bubble.innerText = `${minutes}分（秒）じゃな。覚悟が決まったら開始ボタンを押すのじゃ！`;
    });
});

function updateTimerDisplay(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    timerClock.innerText = `${mins}:${secs}`;
}

// --- 修業（勉強）開始 ---
startStudyBtn.addEventListener('click', () => {
    state.isStudying = true;
    startStudyBtn.classList.add('hidden');
    document.getElementById('timer-setup').classList.add('hidden');
    bubble.innerText = "集中、集中！他のページを見たらお仕置きじゃぞ！";

    state.timerInterval = setInterval(() => {
        state.chosenDuration--;
        updateTimerDisplay(state.chosenDuration);

        if (state.chosenDuration <= 0) {
            endStudy(true);
        }
    }, 1000);
});

// --- 勉強終了（成功 / 中断） ---
function endStudy(isSuccess) {
    clearInterval(state.timerInterval);
    state.isStudying = false;

    if (isSuccess) {
        bubble.innerText = "よく頑張ったのぅ！また明日も頑張ろう！";
        character.innerText = "🥳";
        
        // ポイントと経験値の付与
        state.points += 10;
        state.exp += 25;
        
        // 5レベルごとの電子決済判定を模倣するため経験値100でレベルアップ
        if (state.exp >= 100) {
            state.level++;
            state.exp = 0;
            if (state.level % 5 === 0) {
                alert(`🎉 レベル${state.level}達成！電子決済アプリで使える「特別ポイント」を獲得しました！`);
            }
        }
        updateStatus();
        
        // 親のLINEに送信するモック通知
        setTimeout(() => {
            alert(`【親御さんのLINEへの通知デモ】\nお子様が「${state.selectedSubject}」の勉強を完了しました！`);
        }, 1000);

    } else {
        bubble.innerText = "コラッ！途中で余所見（よそみ）をしてはいかん！";
        character.innerText = "👻";
    }

    // 初期画面に戻すボタンを設置
    startStudyBtn.innerText = "もう一度おみくじを引く";
    startStudyBtn.classList.remove('hidden');
    startStudyBtn.onclick = () => { location.reload(); };
}

// ステータス画面更新
function updateStatus() {
    document.getElementById('user-level').innerText = `Lv.${state.level}`;
    document.getElementById('user-points').innerText = `${state.points} pt`;
    document.getElementById('exp-progress').style.width = `${state.exp}%`;
}

// --- 集中維持機能（タブ切り替え判定） ---
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isStudying) {
        // ユーザーが別のタブを開くなどしてアプリを離脱したとき
        endStudy(false);
    }
});