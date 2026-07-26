"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./study-room.css";

type Phase = "focus" | "break";
type StudyProfile = {
  level: number;
  exp: number;
  totalFocusMinutes: number;
  todayMinutes: number;
  todaySessions: number;
  todayDate: string;
  streak: number;
  lastStudyDate: string;
};

const PROFILE_KEY = "crimson-world.study-profile.v1";
const FOCUS_KEY = "crimson-world.study-focus-minutes.v1";
const BREAK_KEY = "crimson-world.study-break-minutes.v1";
const LEVEL_EXP = 500;

const emptyProfile: StudyProfile = {
  level: 1, exp: 0, totalFocusMinutes: 0, todayMinutes: 0,
  todaySessions: 0, todayDate: "", streak: 0, lastStudyDate: "",
};

function dateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function readNumber(key: string, fallback: number) {
  const value = Number.parseInt(window.localStorage.getItem(key) || "", 10);
  return Number.isFinite(value) ? value : fallback;
}

function readProfile(): StudyProfile {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "{}") as Partial<StudyProfile>;
    const today = dateKey();
    return {
      level: Math.max(1, Number(saved.level) || 1),
      exp: Math.max(0, Number(saved.exp) || 0),
      totalFocusMinutes: Math.max(0, Number(saved.totalFocusMinutes) || 0),
      todayMinutes: saved.todayDate === today ? Math.max(0, Number(saved.todayMinutes) || 0) : 0,
      todaySessions: saved.todayDate === today ? Math.max(0, Number(saved.todaySessions) || 0) : 0,
      todayDate: today,
      streak: Math.max(0, Number(saved.streak) || 0),
      lastStudyDate: typeof saved.lastStudyDate === "string" ? saved.lastStudyDate : "",
    };
  } catch {
    return { ...emptyProfile, todayDate: dateKey() };
  }
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function StudyRoom() {
  const [phase, setPhase] = useState<Phase>("focus");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [profile, setProfile] = useState<StudyProfile>(emptyProfile);
  const [gain, setGain] = useState(0);
  const [ready, setReady] = useState(false);

  const totalSeconds = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
  const progress = useMemo(
    () => Math.max(0, Math.min(1, 1 - remaining / Math.max(totalSeconds, 1))),
    [remaining, totalSeconds],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const focus = Math.min(120, Math.max(1, readNumber(FOCUS_KEY, 25)));
      const rest = Math.min(60, Math.max(1, readNumber(BREAK_KEY, 5)));
      setProfile(readProfile());
      setFocusMinutes(focus);
      setBreakMinutes(rest);
      setRemaining(focus * 60);
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile, ready]);

  const completeFocus = useCallback(() => {
    const today = dateKey();
    setProfile((current) => {
      const nextExp = current.exp + focusMinutes;
      return {
        ...current,
        level: current.level + Math.floor(nextExp / LEVEL_EXP),
        exp: nextExp % LEVEL_EXP,
        totalFocusMinutes: current.totalFocusMinutes + focusMinutes,
        todayMinutes: (current.todayDate === today ? current.todayMinutes : 0) + focusMinutes,
        todaySessions: (current.todayDate === today ? current.todaySessions : 0) + 1,
        todayDate: today,
        streak: current.lastStudyDate === today
          ? current.streak
          : current.lastStudyDate === dateKey(-1) ? current.streak + 1 : 1,
        lastStudyDate: today,
      };
    });
    setGain(focusMinutes);
    window.setTimeout(() => setGain(0), 1800);
  }, [focusMinutes]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value > 1) return value - 1;
        setRunning(false);
        if (phase === "focus") {
          completeFocus();
          setPhase("break");
          return breakMinutes * 60;
        }
        setPhase("focus");
        return focusMinutes * 60;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, phase, focusMinutes, breakMinutes, completeFocus]);

  function changeMinutes(kind: Phase, raw: number) {
    const value = Math.min(kind === "focus" ? 120 : 60, Math.max(1, raw || 1));
    localStorage.setItem(kind === "focus" ? FOCUS_KEY : BREAK_KEY, String(value));
    if (kind === "focus") setFocusMinutes(value);
    else setBreakMinutes(value);
    if (!running && phase === kind) setRemaining(value * 60);
  }

  function resetTimer() {
    setRunning(false);
    setRemaining(totalSeconds);
  }

  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const totalHours = Math.floor(profile.totalFocusMinutes / 60);

  return (
    <section className={`study-room ${running ? "is-running" : ""}`} aria-label="静谧自习室">
      <div className="study-atmosphere" aria-hidden="true"><i /><i /></div>
      <header className="study-heading">
        <div><p>THE SILENT STUDY</p><h1>静谧自习室</h1><span>这里记录每一次专注。</span></div>
        <div className={`study-state ${running ? "active" : ""}`}><i />{running ? phase === "focus" ? "当前专注中" : "正在休息" : "灯火已点燃"}</div>
      </header>

      <main className="study-sanctum">
        <aside className="study-profile">
          <p className="study-kicker">STUDY ARCHIVE · 学习档案</p>
          <blockquote>“把时间留给真正重要的事。”</blockquote>
          <div className="study-overview">
            <article><span>今日专注</span><strong>{profile.todayMinutes}</strong><small>分钟</small></article>
            <article><span>连续学习</span><strong>{profile.streak}</strong><small>天</small></article>
            <article><span>累计专注</span><strong>{totalHours}</strong><small>小时</small></article>
          </div>
          <div className="study-level">
            <div><span>STUDY LEVEL</span><strong>Level {profile.level}</strong></div>
            <small>EXP {profile.exp}/{LEVEL_EXP}</small>
            <div className="study-exp"><i style={{ width: `${profile.exp / LEVEL_EXP * 100}%` }} /></div>
          </div>
        </aside>

        <section className="study-timer" aria-label="专注计时器">
          <header><div><p>{phase === "focus" ? "FOCUS SESSION" : "REST SESSION"}</p><h2>{phase === "focus" ? "专注时刻" : "短暂休息"}</h2></div><span>第 {profile.todaySessions + 1} 次灯火</span></header>
          <div className="study-ring">
            <svg viewBox="0 0 240 240" aria-hidden="true">
              <circle className="ring-bg" cx="120" cy="120" r={radius} />
              <circle className="ring-progress" cx="120" cy="120" r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)} />
            </svg>
            <div><span>{phase === "focus" ? "FOCUS" : "REST"}</span><strong>{formatTime(remaining)}</strong><small>{running ? "墨迹正在缓慢延伸" : "等待开始"}</small></div>
            {gain ? <b>+{gain} EXP</b> : null}
          </div>
          <div className="study-duration">
            <label><span>专注时间</span><input type="number" min="1" max="120" value={focusMinutes} disabled={running} onChange={(event) => changeMinutes("focus", Number(event.target.value))} /><small>分钟</small></label>
            <label><span>休息时间</span><input type="number" min="1" max="60" value={breakMinutes} disabled={running} onChange={(event) => changeMinutes("break", Number(event.target.value))} /><small>分钟</small></label>
          </div>
          <div className="study-actions">
            <button className="primary" type="button" onClick={() => setRunning((value) => !value)}>{running ? "暂停" : remaining === totalSeconds ? "开始" : "继续"}</button>
            <button type="button" onClick={resetTimer}>重置</button>
          </div>
        </section>
      </main>
    </section>
  );
}
