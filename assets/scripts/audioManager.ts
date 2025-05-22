import {_decorator, Node, AudioClip, AudioSource, director, Component} from "cc";
import {Lodash} from "../PLAGameFoundation/gameControl/utilities/framework/lodash";
import {ResourceUtil} from "../PLAGameFoundation/gameControl/utilities/framework/resourceUtil";
// import { GameManager } from "../../core/manager/gameManager";

const {ccclass, property} = _decorator;

interface AudioData {
    source: AudioSource;
    isMusic: boolean;
}

interface AudioDataMap {
    [name: string]: AudioData;
}

@ccclass("GameAudioManager")
export class GameAudioManager extends Component {
    static _instance: GameAudioManager;

    static get instance() {
      if (this._instance) {
        return this._instance;
      }
  
      this._instance = new GameAudioManager();
      return this._instance;
    }

    private _persistRootNode: Node = null!;
    private _audioSources: AudioSource[] = [];
    dictWeaponSoundIndex: any = {};

    musicVolume: number = 1;
    soundVolume: number = 1;
    audios: AudioDataMap = {};
    arrSound: AudioData[] = [];

    onLoad() {
        GameAudioManager._instance = this;
        // this._persistRootNode = this.node;
        this.init();
    }

    init() {
        if (this._persistRootNode) return; //Avoid switching scene initialization errors
        this._persistRootNode = new Node("audio");
        this.openAudio();
        // GameManager.instance.SetObjectCantDestroy(this._persistRootNode);
    }

    private _getAudioSource(clip: AudioClip) {
        let result: AudioSource | undefined;
        for (let i = 0; i < this._audioSources.length; ++i) {
            let audioSource = this._audioSources[i];
            if (!audioSource.playing) {
                result = audioSource;
                break;
            }
        }
        if (!result) {
            result = this._persistRootNode.addComponent(AudioSource);
            result.playOnAwake = false;
            this._audioSources.push(result);
        }
        result.node.off(AudioSource.EventType.ENDED);
        result.clip = clip;
        result.currentTime = 0;
        return result;
    }

    /**
     * Play music
     * @param {String} name The music name can be obtained through Constant.AUDIO_MUSIC
     * @param {Boolean} loop Whether to loop
     */
    playMusic(name: string, loop: boolean) {
        let path = "audio/music/" + name;
        ResourceUtil.loadRes(path, AudioClip, (err: any, clip: any) => {
            let source = this._getAudioSource(clip);
            let tmp: AudioData = {
                source,
                isMusic: true,
            };
            this.audios[name] = tmp;
            source.volume = this.musicVolume;
            source.loop = loop;
            source.play();
        });
    }
    /**
     * Play sound effects
     * @param {String} name The music name can be obtained through Constant.AUDIO_SOUND
     * @param {Boolean} loop Whether to loop
     */
    playSound(name: string, loop: boolean = false) {
        if (!this.soundVolume) {
            return;
        }
        //There are usually multiple sound effects, not just one.
        let path = "audio/sound/";
        ResourceUtil.loadRes(path + name, AudioClip, (err: any, clip: any) => {
            let source = this._getAudioSource(clip);
            let tmp: AudioData = {
                source,
                isMusic: false,
            };
            if (this.arrSound.find(item => item.source == tmp.source)) {
                return;
            }
            this.arrSound.push(tmp);

            if (loop) {
                this.audios[name] = tmp;
            }

            source.volume = this.soundVolume;
            source.loop = loop;
            source.play();

            // source.node.on(AudioSource.EventType.ENDED, () => {
            //     Lodash.remove(this.arrSound, (obj: AudioData) => {
            //         return obj.source == tmp.source;
            //     });
            // });

            setTimeout(() => {
                this.arrSound.splice(this.arrSound.indexOf(tmp), 1);
            }, source.duration);
        });
    }

    stop(name: string) {
        if (this.audios.hasOwnProperty(name)) {
            let audio = this.audios[name];
            audio.source.stop();
        }
    }

    stopAll() {
        for (const i in this.audios) {
            if (this.audios.hasOwnProperty(i)) {
                let audio = this.audios[i];
                audio.source.stop();
            }
        }
    }

    getMusicVolume() {
        return this.musicVolume;
    }

    setMusic(flag: number) {
        this.musicVolume = flag;
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item) && this.audios[item].isMusic) {
                let audio = this.audios[item];
                audio.source.volume = this.musicVolume;
            }
        }
    }

    //Pause the music first when watching ads
    pauseAll() {
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item)) {
                let audio = this.audios[item];
                audio.source.pause();
            }
        }
    }

    resumeAll() {
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item)) {
                let audio = this.audios[item];
                audio.source.play();
            }
        }
    }

    openMusic() {
        this.setMusic(0.2);
    }

    closeMusic() {
        this.setMusic(0);
    }

    openSound() {
        this.setSound(.4);
    }

    closeSound() {
        this.setSound(0);
    }

    openAudio() {
        this.openMusic();
        this.openSound();
    }

    closeAudio() {
        this.closeMusic();
        this.closeSound();
    }

    setSound(flag: number) {
        this.soundVolume = flag;
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item) && !this.audios[item].isMusic) {
                let audio = this.audios[item];
                audio.source.volume = this.soundVolume;
            }
        }

        for (let idx = 0; idx < this.arrSound.length; idx++) {
            let audio = this.arrSound[idx];
            audio.source.volume = this.soundVolume;
        }
    }

    stopSingleSound(name: string) {
        if (this.audios.hasOwnProperty(name) && !this.audios[name].isMusic) {
            let audio = this.audios[name];
            audio.source.stop();
        }
    }
}
