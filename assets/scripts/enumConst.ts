//----------------------------------------大厅

import { Vec3 } from "cc"

/** 窗口类型 */
export enum WindowType {
    /** 大厅 */
    eMap = 1,
    /** 窗口 */
    eView,
    /** 弹窗 */
    eTips,
    /** 跑马灯 */
    eMarquee,
    /** 飘字 */
    eToast,
    eNetwork,
}

/** 窗口打开类型 */
export enum WindowOpenType {
    /** 只能展示这个，立即打开 */
    eSingle = 1,
    /** 可以多个同时存在，一个关闭另一个再打开 */
    eMultiple,
}


/** 三元消除方向 */
export enum Direction {
    left,
    right,
    up,
    down
}

/** 全局常量 */
export let Constants = {
    /**  交换时间 */
    changeTime: 0.15,
    /** 格子行列数 */
    layCount: 9,
    Width: 75,
    NormalType: 13,
    GoalCount: 20,
    CountdownTime: 30,
    AUDIO_NAME: {
        MUSIC_EX: 'music',
        CAR_CHANGE: 'carChangeOption',
        CAR_MOVE: 'car_start',
        MATCH: 'ChipMatching1',
        BALL_RAY: 'DiscoStartRay',
        SPECIAL_CREATE: 'special_creation',
        SPECIAL_EXPLODE: 'SPECIAL_EXPLODE',
        TRAIN: 'train',
        DEFAULT: ''
    }
}

/**
 *  关卡配置
 */
export interface LevelCfgData {
    level?: number,
}



export interface mapData {
    m_id: number[],
    m_ct: number[],
    m_mk?: number[],
}

/** 关卡数据 */
export interface LevelData {
    mapCount: number,
    blockCount: number,
    moveCount: number,
    scores: number[],
    blockRatio: number[],
    mapData: mapData[],
}
/** 原始数据 */
export interface OriginLevelData {
    mapCount: number,
    blockCount: number,
    moveCount: number,
    scores: string,
    blockRatio: string,
    m_id?: string,
    m_ct?: string,
}

/** 炸弹编号 */
export enum Bomb {
    /** 竖向 */
    ver = 8,
    /** 横向 */
    hor = 9,
    /** 周围爆炸 */
    bomb = 10,
    /** 消灭所有同一类型 */
    plane = 11,

    allSame = 12,
}

export enum Pieces {
    rocket = "rocket",
    particle = "particle",
    grid = "grid",
    score = "score",
    block = "block",
    plane = "plane",
}

export enum MergeSpecial {
    BombBomb = 1,
    BombHorOrVer = 2,
    VerHor = 3,
    BombPlane = 4,
    PlanePlane = 5,
    PlaneHorOrVer = 6,
    AllBomb = 7,
}

export type BombArea = {
    h: number,
    v: number,
    type: Bomb,
    position: Vec3
}
